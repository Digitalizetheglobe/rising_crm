import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  verifyMetaWebhookSignature,
  processMetaLead,
  getUnmatchedLeads,
  resolveUnmatchedLead,
} from './metaWebhook.service';
import { resolveUnmatchedLeadSchema } from './metaWebhook.validation';

export const verifyMetaWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const hubMode = req.query['hub.mode'] as string;
    const hubVerifyToken = req.query['hub.verify_token'] as string;
    const hubChallenge = req.query['hub.challenge'] as string;

    const verifyToken = process.env.META_VERIFY_TOKEN;

    if (!verifyToken) {
      res.status(400).json({ success: false, message: 'META_VERIFY_TOKEN not configured' });
      return;
    }

    if (hubMode !== 'subscribe' || hubVerifyToken !== verifyToken) {
      res.status(403).json({ success: false, message: 'Verification token mismatch' });
      return;
    }

    res.status(200).send(hubChallenge);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const receiveMetaWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!signature) {
      res.status(401).json({ success: false, message: 'Missing X-Hub-Signature-256 header' });
      return;
    }

    const payload = JSON.stringify(req.body);

    const isValid = verifyMetaWebhookSignature(payload, signature);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    res.status(200).json({ success: true });

    const { entry } = req.body;
    if (!entry || !Array.isArray(entry)) {
      console.warn('[Meta Webhook] Invalid payload structure');
      return;
    }

    entry.forEach((evt: any) => {
      const changes = evt.changes || [];
      changes.forEach((change: any) => {
        const leadData = change.value;
        if (leadData && leadData.leadgen_id) {
          processMetaLead(leadData);
        }
      });
    });
  } catch (error: any) {
    console.error('[Meta Webhook] Error processing webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnmatchedMetaLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getUnmatchedLeads(req.query, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markUnmatchedAsResolved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await resolveUnmatchedLead(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Unmatched lead updated successfully',
      data: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
