import { Model, ModelStatic } from 'sequelize';

interface PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export const paginate = async <T extends Model>(
    model: ModelStatic<T>,
    query: Record<string, any> = {},
    page = 1,
    limit = 10,
    include?: any
): Promise<PaginationResult<T>> => {
    const offset = (page - 1) * limit;
    const { count, rows } = await model.findAndCountAll({
        where: query,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include,
    });

    return {
        data: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
    };
};