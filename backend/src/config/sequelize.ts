import { Sequelize, Model } from 'sequelize';
import { ENV } from './env';
import { logger } from './logger';

// Global override to map `id` to `_id` for backward compatibility with frontend MongoDB queries
const originalToJSON = Model.prototype.toJSON;
Model.prototype.toJSON = function (this: any) {
    const obj = originalToJSON.call(this);
    if (obj && typeof obj === 'object') {
        const anyObj = obj as any;
        if (anyObj.id !== undefined && anyObj._id === undefined) {
            anyObj._id = anyObj.id;
        }
    }
    return obj;
};

const sequelize = new Sequelize(ENV.PGDATABASE, ENV.PGUSER, ENV.PGPASSWORD, {
    host: ENV.PGHOST,
    port: ENV.PGPORT,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export default sequelize;
