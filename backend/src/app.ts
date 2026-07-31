import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import router from './routes/index';
import { UPLOADS_DIR, ensureUploadsDir } from './config/uploads';

// Explicit model registrations
import './modules/auth/session.model';
import './modules/roles/permission.model';
import './modules/audit/auditLog.model';

ensureUploadsDir();

const app: Application = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'http://localhost:*', 'https://*'],
    },
  },
  // Allow the Next.js app (different port) to embed uploaded images.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(UPLOADS_DIR));

// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/leads', require('./routes/leads'));
// app.use('/api/clients', require('./routes/clients'));
// app.use('/api/calls', require('./routes/calls'));
// app.use('/api/bookings', require('./routes/bookings'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/projects', require('./routes/projects'));
// app.use('/api/units', require('./routes/units'));
// app.use('/api/employees', require('./routes/employees'));
// app.use('/api/feedback', require('./routes/feedback'));

// // Global error handler
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ success: false, message: err.message });
// });

// module.exports = app;

app.use('/api/v1', router);

app.use(errorHandler);

export default app;