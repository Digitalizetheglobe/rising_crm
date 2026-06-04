import { User } from './user.model';
import { ApiError } from '../../utils/ApiError';

export const getAllUsers = async (page: number = 1, limit: number = 10, role?: string) => {
    const query: any = {};
    if (role) {
        query.role = role;
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
        
    const total = await User.countDocuments(query);

    return {
        users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    };
};

export const getUserById = async (id: string) => {
    const user = await User.findById(id).select('-password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return user;
};

export const createUser = async (data: any) => {
    // Check if email is already taken
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
    }

    const user = new User(data);
    await user.save();
    
    const { password: _password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};

export const updateUser = async (id: string, data: any) => {
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            throw new ApiError(400, 'Email is already in use');
        }
    }

    // Assign new fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.password) user.password = data.password; // pre-save hook will hash it
    if (data.role) user.role = data.role;

    await user.save();
    
    const { password: _password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};

export const deleteUser = async (id: string) => {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return user;
};
