import dotenv from "dotenv";

import app from "./app";
import sequelize from "./config/sequelize";
import { initFollowUpJobs } from './jobs/followupReminder.job';

dotenv.config();

const PORT = process.env.PORT || 5000;

sequelize
    .authenticate()
    .then(() => {
        console.log("PostgreSQL Connected");

        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
            initFollowUpJobs();
        });
    })
    .catch((error) => {
        console.error("Unable to connect to the database:", error);
    });