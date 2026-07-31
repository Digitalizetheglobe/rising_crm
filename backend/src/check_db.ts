import sequelize from './config/sequelize';
import dotenv from "dotenv";
import User from "./modules/auth/auth.model";
import jwt from "jsonwebtoken";

dotenv.config();

async function run() {
    console.log("Connecting to PostgreSQL...");
    await sequelize.authenticate();
    await sequelize.sync(); // Ensure schemas are created
    console.log("Connected to PostgreSQL.");

    let users = await User.findAll();
    console.log("Existing users count:", users.length);
    for (const u of users) {
        console.log(`- ${u.name} (${u.email}) [${u.role}]`);
    }

    if (users.length === 0) {
        console.log("No users found. Creating a default super admin...");
        // For a single tenant context, make sure to add tenantId if required. Here we assume generic tenant ID or single tenant
        const defaultTenantId = "00000000-0000-0000-0000-000000000000";
        const adminUser = await User.create({
            tenantId: defaultTenantId,
            name: "Hello",
            email: "murali@example.com",
            phone: "9876543210",
            password: "password123",
            role: "SUPER_ADMIN"
        } as any);
        console.log("Super Admin user created successfully:", adminUser.email);
        users = [adminUser as any];
    }

    const targetUser = users[0];
    if (targetUser) {
        const token = jwt.sign(
            {
                UserId: targetUser.id,
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

    await sequelize.close();
    console.log("Disconnected.");
}

run().catch(console.error);
