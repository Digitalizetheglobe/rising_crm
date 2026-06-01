// import app from './app';
// import { connectDB } from './config/db';
// import { ENV } from './config/env';
// import { logger } from './config/logger';

// // import cron jobs here once built
import { initFollowUpJobs } from './jobs/followupReminder.job';
// // import './jobs/paymentReminder.job';
// // import './jobs/siteVisitReminder.job';

// const start = async (): Promise<void> => {
//     await connectDB();
//     app.listen(ENV.PORT, () => {
//         logger.info(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
//     });
// };

// start();

import mongoose from "mongoose";
import dotenv from "dotenv";

import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
            initFollowUpJobs();
        });
    })
    .catch((error) => {
        console.log(error);
    });