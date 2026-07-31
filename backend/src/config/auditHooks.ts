import sequelize from './sequelize';
import { requestContext } from './context';
import AuditLog from '../modules/audit/auditLog.model';
import { logger } from './logger';

export const setupAuditHooks = () => {
    // We add global hooks to capture changes in all models.
    const modelsToIgnore = ['Session', 'AuditLog'];

    sequelize.addHook('afterCreate', async (instance: any, options: any) => {
        const modelName = instance.constructor.name;
        if (modelsToIgnore.includes(modelName)) return;

        try {
            const context = requestContext.getStore();
            const tenantId = context?.tenantId || (instance as any).tenantId; // fallback for system actions
            const userId = context?.userId;

            if (tenantId) {
                await AuditLog.create({
                    tenantId,
                    userId,
                    action: 'CREATE',
                    modelName,
                    recordId: instance.id,
                    changes: instance.toJSON(),
                }, { transaction: options.transaction });
            }
        } catch (error) {
            logger.error(`Failed to create audit log for ${modelName} CREATE:`, error);
        }
    });

    sequelize.addHook('afterUpdate', async (instance: any, options: any) => {
        const modelName = instance.constructor.name;
        if (modelsToIgnore.includes(modelName)) return;
        
        // Only log if there are actual changes
        if (!instance.changed()) return;

        try {
            const context = requestContext.getStore();
            const tenantId = context?.tenantId || (instance as any).tenantId;
            const userId = context?.userId;

            const changes: any = {};
            for (const key of instance.changed()) {
                changes[key] = {
                    old: instance.previous(key),
                    new: instance.get(key)
                };
            }

            if (tenantId) {
                await AuditLog.create({
                    tenantId,
                    userId,
                    action: 'UPDATE',
                    modelName,
                    recordId: instance.id,
                    changes,
                }, { transaction: options.transaction });
            }
        } catch (error) {
            logger.error(`Failed to create audit log for ${modelName} UPDATE:`, error);
        }
    });

    sequelize.addHook('afterDestroy', async (instance: any, options: any) => {
        const modelName = instance.constructor.name;
        if (modelsToIgnore.includes(modelName)) return;

        try {
            const context = requestContext.getStore();
            const tenantId = context?.tenantId || (instance as any).tenantId;
            const userId = context?.userId;

            if (tenantId) {
                await AuditLog.create({
                    tenantId,
                    userId,
                    action: 'DELETE',
                    modelName,
                    recordId: instance.id,
                    changes: instance.toJSON(),
                }, { transaction: options.transaction });
            }
        } catch (error) {
            logger.error(`Failed to create audit log for ${modelName} DELETE:`, error);
        }
    });
};
