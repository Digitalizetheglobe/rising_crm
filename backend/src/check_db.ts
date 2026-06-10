import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./modules/auth/auth.model";
import jwt from "jsonwebtoken";

dotenv.config();

async function run() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is not defined");
        return;
    }
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    let users = await User.find({});
    console.log("Existing users count:", users.length);
    for (const u of users) {
        console.log(`- ${u.name} (${u.email}) [${u.role}]`);
    }

    if (users.length === 0) {
        console.log("No users found. Creating a default super admin...");
        const adminUser = await User.create({
            name: "Hello",
            email: "murali@example.com",
            phone: "9876543210",
            password: "password123",
            role: "SUPER_ADMIN"
        });
        console.log("Super Admin user created successfully:", adminUser.email);
        users = [adminUser];
    }

    const targetUser = users[0];
    if (targetUser) {
        const token = jwt.sign(
            {
                UserId: targetUser._id,
                role: targetUser.role,
            },
            process.env.JWT_SECRET || "your_super_secret_key_change_this_in_production",
            {
                expiresIn: "365d",
            }
        );
        console.log("JWT token generated for", targetUser.email, ":");
        console.log("Bearer " + token);
    }

    await mongoose.disconnect();
    console.log("Disconnected.");
}

run().catch(console.error);
