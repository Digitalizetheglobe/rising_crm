import crypto from 'crypto';
import axios from 'axios';
import mongoose from 'mongoose';
import { MetaWebhookEvent } from './metaWebhook.model';
import { UnmatchedMetaLead } from './unmatchedMetaLeads.model';
import { Project } from '../projects/project.model';
import { Enquiry } from '../enquiries/enquiry.model';
import { createNotification } from '../notifications/notification.helper';
import { ApiError } from '../../utils/ApiError';

interface MetaLeadData {
  leadgen_id: string;
  ad_id: string;
  form_id: string;
  page_id: string;
  field_data?: Array<{ name: string; values: string[] }>;
}

interface ParsedLeadData {
  fullName?: string;
  email?: string;
  phone?: string;
  platform: 'facebook' | 'instagram';
}

export const verifyMetaWebhookSignature = (payload: string, signature: string): boolean => {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.warn('[Meta Webhook] META_APP_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

export const fetchMetaLeadData = async (leadgenId: string): Promise<ParsedLeadData> => {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const apiVersion = 'v19.0';

  if (!accessToken) {
    throw new ApiError(500, 'META_PAGE_ACCESS_TOKEN not configured');
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/${apiVersion}/${leadgenId}`,
      {
        params: { access_token: accessToken },
        timeout: 5000,
      }
    );

    const fieldData = response.data.field_data || [];

    const parseFieldData = (name: string, values: string[]): string | undefined => {
      if (!values || values.length === 0) return undefined;
      return values[0];
    };

    const parsed: ParsedLeadData = {
      platform: 'facebook',
    };

    fieldData.forEach((field: { name: string; values: string[] }) => {
      const value = parseFieldData(field.name, field.values);
      if (!value) return;

      if (
        field.name.toLowerCase().includes('full_name') ||
        field.name.toLowerCase().includes('name')
      ) {
        parsed.fullName = value;
      } else if (field.name.toLowerCase().includes('email')) {
        parsed.email = value;
      } else if (
        field.name.toLowerCase().includes('phone') ||
        field.name.toLowerCase().includes('phone_number')
      ) {
        parsed.phone = value;
      }
    });

    return parsed;
  } catch (error: any) {
    console.error('[Meta Webhook] Error fetching lead data from Meta:', error.message);
    throw new ApiError(
      500,
      `Failed to fetch lead data from Meta: ${error.message}`
    );
  }
};

export const processMetaLead = async (metaLeadData: MetaLeadData) => {
  const { leadgen_id, ad_id, form_id, page_id } = metaLeadData;

  try {
    const existingEnquiry = await Enquiry.findOne({ metaLeadId: leadgen_id });
    if (existingEnquiry) {
      console.log(
        `[Meta Webhook] Enquiry already exists for leadgen_id: ${leadgen_id}`
      );
      return;
    }

    const parsedData = await fetchMetaLeadData(leadgen_id);

    const projectMatch = await Project.findOne({
      'metaCampaigns.adId': ad_id,
      'metaCampaigns.isActive': true,
    });

    if (!projectMatch) {
      console.log(
        `[Meta Webhook] No active campaign found for ad_id: ${ad_id}. Saving as unmatched.`
      );
      await UnmatchedMetaLead.create({
        leadgenId: leadgen_id,
        adId: ad_id,
        formId: form_id,
        pageId: page_id,
        rawPayload: metaLeadData,
        status: 'pending',
      });

      await MetaWebhookEvent.create({
        eventId: `${leadgen_id}-${Date.now()}`,
        leadgenId: leadgen_id,
        adId: ad_id,
        formId: form_id,
        pageId: page_id,
        platform: parsedData.platform,
        rawPayload: metaLeadData,
        status: 'unmatched',
        errorMessage: 'No active campaign found for this ad',
      });

      return;
    }

    const campaign = projectMatch.metaCampaigns!.find(
      (c) => c.adId === ad_id && c.isActive
    );

    if (!campaign) {
      await UnmatchedMetaLead.create({
        leadgenId: leadgen_id,
        adId: ad_id,
        formId: form_id,
        pageId: page_id,
        rawPayload: metaLeadData,
        status: 'pending',
      });

      await MetaWebhookEvent.create({
        eventId: `${leadgen_id}-${Date.now()}`,
        leadgenId: leadgen_id,
        adId: ad_id,
        formId: form_id,
        pageId: page_id,
        platform: parsedData.platform,
        rawPayload: metaLeadData,
        status: 'unmatched',
        errorMessage: 'Campaign not found in project',
      });

      return;
    }

    if (!parsedData.phone) {
      console.warn(
        `[Meta Webhook] Lead ${leadgen_id} has no phone number. Skipping.`
      );
      return;
    }

    const newEnquiry = await Enquiry.create({
      name: parsedData.fullName || 'Unknown',
      phone: parsedData.phone,
      email: parsedData.email,
      source: 'META_ADS',
      platform: parsedData.platform,
      interestedProject: projectMatch._id,
      assignedTo: campaign.defaultAssigneeId || undefined,
      metaLeadId: leadgen_id,
      metaAdId: ad_id,
      metaFormId: form_id,
      rawMetaPayload: metaLeadData,
      status: 'Pending',
      createdBy: projectMatch.createdBy,
    });

    await MetaWebhookEvent.create({
      eventId: `${leadgen_id}-${Date.now()}`,
      leadgenId: leadgen_id,
      adId: ad_id,
      formId: form_id,
      pageId: page_id,
      platform: parsedData.platform,
      rawPayload: metaLeadData,
      status: 'success',
      enquiryId: newEnquiry._id,
    });

    if (campaign.defaultAssigneeId) {
      await createNotification({
        UserId: campaign.defaultAssigneeId,
        title: 'New Meta Ads Enquiry',
        message: `New enquiry from ${parsedData.fullName || 'Unknown'} (${parsedData.phone}) via ${campaign.campaignName}`,
        type: 'Lead',
        refId: newEnquiry._id,
        refModel: 'Enquiry',
      });
    }
  } catch (error: any) {
    console.error('[Meta Webhook] Error processing Meta lead:', error.message);

    const { leadgen_id, ad_id, form_id, page_id } = metaLeadData;
    await MetaWebhookEvent.create({
      eventId: `${leadgen_id}-${Date.now()}`,
      leadgenId: leadgen_id,
      adId: ad_id,
      formId: form_id,
      pageId: page_id,
      platform: 'facebook',
      rawPayload: metaLeadData,
      status: 'failed',
      errorMessage: error.message,
    });
  }
};

export const getUnmatchedLeads = async (
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10
) => {
  const filter: Record<string, any> = {};

  if (query.status) filter.status = query.status;

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    UnmatchedMetaLead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UnmatchedMetaLead.countDocuments(filter),
  ]);

  return {
    leads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
};

export const resolveUnmatchedLead = async (
  unmatchedId: string,
  data: { notes?: string; status?: 'pending' | 'resolved' }
) => {
  const unmatched = await UnmatchedMetaLead.findById(unmatchedId);
  if (!unmatched) throw new ApiError(404, 'Unmatched lead not found');

  const updateData: Record<string, any> = {};

  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
  }

  const updated = await UnmatchedMetaLead.findByIdAndUpdate(
    unmatchedId,
    { $set: updateData },
    { new: true }
  );

  return updated;
};
