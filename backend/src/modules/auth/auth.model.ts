import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, LEGACY_FINANCE_ROLE } from "../../constants/roles";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    isActive: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        role: {
            type: String,
            enum: [
                ROLES.SUPER_ADMIN,
                ROLES.ADMIN,
                ROLES.SALES_MANAGER,
                ROLES.SALES_EXECUTIVE,
                ROLES.FINANCIAL_EXECUTIVE,
                LEGACY_FINANCE_ROLE,
                ROLES.VIEWER,
            ],
            default: ROLES.SALES_EXECUTIVE,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
    candidatePassword: string
) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
