import mongoose, { Model } from 'mongoose';

interface PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export const paginate = async <T>(
    model: Model<T>,
    query: Record<string, any> = {},
    page = 1,
    limit = 10,
    populate?: string | string[]
): Promise<PaginationResult<T>> => {
    const skip = (page - 1) * limit;
    const total = await model.countDocuments(query);

    let q = model.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
    if (populate) {
        const fields = Array.isArray(populate) ? populate : [populate];
        fields.forEach(f => { q = q.populate(f) as typeof q; });
    }

    const data = await q.exec();

    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
};