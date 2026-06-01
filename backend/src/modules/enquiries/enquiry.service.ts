import mongoose from 'mongoose';
import { Enquiry, EnquirySource, BudgetRange, PropertyType } from './enquiry.model';
import { ApiError } from '../../utils/ApiError';
import { LeadPriority } from '../leads/lead.constants';

// ─── Helper: build filter query ───────────────────────────────────────────────
const buildFilterQuery = (query: Record<string, any>) => {
    const filter: Record<string, any> = {};

    if (query.status)     filter.status     = query.status;
    if (query.source)     filter.source     = query.source;
    if (query.assignedTo) filter.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
    if (query.isConverted !== undefined) filter.isConverted = query.isConverted === 'true';

    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate)   filter.createdAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59));
    }

    if (query.search) {
        filter.$or = [
            { name:  { $regex: query.search, $options: 'i' } },
            { phone: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

// ─── Create Enquiry ───────────────────────────────────────────────────────────
export const createEnquiryService = async (
    data: {
        name: string;
        phone: string;
        email?: string;
        source: EnquirySource;
        message?: string;
        budgetRange?: BudgetRange;
        propertyType?: PropertyType;
        preferredLocation?: string;
        interestedProject?: string;
        notes?: string;
    },
    createdBy: string
) => {
    const enquiry = await Enquiry.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(createdBy),
        interestedProject: data.interestedProject
            ? new mongoose.Types.ObjectId(data.interestedProject)
            : undefined,
    });

    return enquiry;
};

// ─── Get All Enquiries ────────────────────────────────────────────────────────
export const getAllEnquiriesService = async (
    query: Record<string, any>,
    page: number = 1,
    limit: number = 10
) => {
    const filter = buildFilterQuery(query);
    const skip   = (page - 1) * limit;

    const [enquiries, total] = await Promise.all([
        Enquiry.find(filter)
            .populate('assignedTo',       'name email phone')
            .populate('createdBy',        'name email')
            .populate('interestedProject','name location')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Enquiry.countDocuments(filter),
    ]);

    return {
        enquiries,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};

// ─── Get Single Enquiry ───────────────────────────────────────────────────────
export const getEnquiryByIdService = async (enquiryId: string) => {
    const enquiry = await Enquiry.findById(enquiryId)
        .populate('assignedTo',        'name email phone')
        .populate('assignedBy',        'name email')
        .populate('createdBy',         'name email')
        .populate('interestedProject', 'name location')
        .populate('convertedLeadId',   'name phone status')
        .populate('convertedBy',       'name email')
        .populate('rejectedBy',        'name email');

    if (!enquiry) throw new ApiError(404, 'Enquiry not found');

    return enquiry;
};

// ─── Update Enquiry ───────────────────────────────────────────────────────────
export const updateEnquiryService = async (
    enquiryId: string,
    data: Record<string, any>
) => {
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) throw new ApiError(404, 'Enquiry not found');

    if (enquiry.isConverted) {
        throw new ApiError(400, 'Cannot edit a converted enquiry');
    }

    const updated = await Enquiry.findByIdAndUpdate(
        enquiryId,
        { $set: data },
        { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    return updated;
};

// ─── Update Enquiry Status ────────────────────────────────────────────────────
export const updateEnquiryStatusService = async (
    enquiryId: string,
    status: string,
    updatedBy: string,
    notes?: string,
    rejectionReason?: string
) => {
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) throw new ApiError(404, 'Enquiry not found');

    if (enquiry.isConverted) {
        throw new ApiError(400, 'Cannot change status of a converted enquiry');
    }

    const updateData: Record<string, any> = { status };

    if (notes) updateData.notes = notes;

    if (status === 'Rejected') {
        if (!rejectionReason) throw new ApiError(400, 'Rejection reason is required');
        updateData.rejectedAt      = new Date();
        updateData.rejectedBy      = new mongoose.Types.ObjectId(updatedBy);
        updateData.rejectionReason = rejectionReason;
    }

    if (status === 'Contacted') {
        updateData.lastContactedAt = new Date();
    }

    const updated = await Enquiry.findByIdAndUpdate(
        enquiryId,
        { $set: updateData },
        { new: true }
    ).populate('assignedTo', 'name email');

    return updated;
};

// ─── Assign Enquiry ───────────────────────────────────────────────────────────
export const assignEnquiryService = async (
    enquiryId: string,
    assignedTo: string,
    assignedBy: string
) => {
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) throw new ApiError(404, 'Enquiry not found');

    if (enquiry.isConverted) {
        throw new ApiError(400, 'Cannot reassign a converted enquiry');
    }

    const updated = await Enquiry.findByIdAndUpdate(
        enquiryId,
        {
            $set: {
                assignedTo: new mongoose.Types.ObjectId(assignedTo),
                assignedBy: new mongoose.Types.ObjectId(assignedBy),
                assignedAt: new Date(),
            },
        },
        { new: true }
    ).populate('assignedTo', 'name email phone');

    return updated;
};

// ─── Convert Qualified Enquiry to Lead ───────────────────────────────────────
export const convertToLeadService = async (
    enquiryId: string,
    convertedBy: string,
    assignedTo: string,
    followUpDate: Date,
    followUpNotes: string = '',
    priority: LeadPriority = 'Medium'
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const enquiry = await Enquiry.findById(enquiryId).session(session);
        if (!enquiry) throw new ApiError(404, 'Enquiry not found');

        if (enquiry.status !== 'Qualified') {
            throw new ApiError(400, 'Only Qualified enquiries can be converted to leads');
        }

        if (enquiry.isConverted) {
            throw new ApiError(400, 'This enquiry has already been converted to a lead');
        }

        // Dynamically import to avoid circular deps
        const { Lead }     = await import('../leads/lead.model');
        const { FollowUp } = await import('../followups/followup.model');
        const { Notification } = await import('../notifications/notification.model');

        // 1. Create Lead
        const [lead] = await Lead.create(
            [
                {
                    name:              enquiry.name,
                    phone:             enquiry.phone,
                    email:             enquiry.email,
                    source:            enquiry.source as string,
                    status:            'NEW',
                    priority,
                    budgetRange:       enquiry.budgetRange as string | undefined,
                    propertyType:      enquiry.propertyType as string | undefined,
                    preferredLocation: enquiry.preferredLocation,
                    interestedProject: enquiry.interestedProject,
                    assignedTo:        new mongoose.Types.ObjectId(assignedTo),
                    assignedBy:        new mongoose.Types.ObjectId(convertedBy),
                    assignedAt:        new Date(),
                    notes:             enquiry.notes,
                    enquiryId:         enquiry._id,
                    createdBy:         new mongoose.Types.ObjectId(convertedBy),
                } as any,
            ],
            { session }
        );

        // 2. Schedule First Follow-Up
        await FollowUp.create(
            [
                {
                    lead:        lead._id,
                    scheduledAt: followUpDate,
                    type:        'Call',
                    notes:       followUpNotes || `First follow-up for converted enquiry from ${enquiry.source}`,
                    status:      'SCHEDULED',
                    createdBy:   new mongoose.Types.ObjectId(convertedBy),
                    assignedTo:  new mongoose.Types.ObjectId(assignedTo),
                } as any,
            ],
            { session }
        );

        // 3. Mark Enquiry as Converted
        await Enquiry.findByIdAndUpdate(
            enquiryId,
            {
                $set: {
                    status:          'Converted',
                    isConverted:     true,
                    convertedAt:     new Date(),
                    convertedBy:     new mongoose.Types.ObjectId(convertedBy),
                    convertedLeadId: lead._id,
                },
            },
            { session }
        );

        // 4. Send Notification to Sales Executive
        await Notification.create(
            [
                {
                    userId:  new mongoose.Types.ObjectId(assignedTo),
                    title:   'New Lead Assigned',
                    message: `A qualified enquiry from ${enquiry.name} (${enquiry.phone}) has been converted and assigned to you. First follow-up scheduled for ${new Date(followUpDate).toLocaleDateString('en-IN')}.`,
                    type:    'Lead',
                    refId:   lead._id,
                    refModel:'Lead',
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return {
            lead,
            message: `Enquiry successfully converted to lead and assigned. Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString('en-IN')}.`,
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// ─── Delete Enquiry ───────────────────────────────────────────────────────────
export const deleteEnquiryService = async (enquiryId: string) => {
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) throw new ApiError(404, 'Enquiry not found');

    if (enquiry.isConverted) {
        throw new ApiError(400, 'Cannot delete a converted enquiry. It is linked to a lead.');
    }

    await Enquiry.findByIdAndDelete(enquiryId);
    return { message: 'Enquiry deleted successfully' };
};

// ─── Get Enquiry Stats ─────────────────────────────────────────────────────────
export const getEnquiryStatsService = async () => {
    const stats = await Enquiry.aggregate([
        {
            $group: {
                _id:   '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const sourceStats = await Enquiry.aggregate([
        {
            $group: {
                _id:   '$source',
                count: { $sum: 1 },
            },
        },
    ]);

    const total     = await Enquiry.countDocuments();
    const converted = await Enquiry.countDocuments({ isConverted: true });

    return {
        total,
        converted,
        conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0%',
        byStatus: stats,
        bySource: sourceStats,
    };
};