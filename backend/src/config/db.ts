import sequelize from './sequelize';
import { ENV } from './env';
import { logger } from './logger';
import { setupAuditHooks } from './auditHooks';

export const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        logger.info('PostgreSQL connected successfully via Sequelize');
        
        // Initialize global audit hooks
        setupAuditHooks();
        
        // Sync models (in development you might want alter: true, but be careful in production)
        if (ENV.NODE_ENV === 'development') {
            // We will await sequelize.sync({ alter: true }); later after defining models
        }
    } catch (error) {
        logger.error('PostgreSQL connection failed:', error);
        process.exit(1);
    }
};