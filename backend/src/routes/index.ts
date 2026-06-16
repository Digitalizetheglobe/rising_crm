import { Router } from 'express';

// will uncomment as you build each module
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import roleRoutes from '../modules/roles/role.routes';
import leadRoutes from '../modules/leads/lead.routes';
import enquiryRoutes from '../modules/enquiries/enquiry.routes';
import followupRoutes from '../modules/followups/followup.routes';
import clientRoutes from '../modules/clients/client.routes';
import callRoutes from '../modules/calls/call.routes';
import feedbackRoutes from '../modules/feedbacks/feedback.routes';
import projectRoutes from '../modules/projects/project.routes';
import unitRoutes from '../modules/units/unit.routes';
import bookingRoutes from '../modules/bookings/booking.routes';
import paymentRoutes from '../modules/payments/payment.routes';
import loanRoutes from '../modules/loans/loan.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import reportRoutes from '../modules/reports/report.routes';
import uploadRoutes from '../modules/uploads/upload.routes';
import importExportRoutes from '../modules/imports-exports/importExport.routes';
import sitevisitRoutes from '../modules/sitevisits/sitevisit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/leads', leadRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/followups', followupRoutes);
router.use('/clients', clientRoutes);
router.use('/calls', callRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/projects', projectRoutes);
router.use('/units', unitRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/loans', loanRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/uploads', uploadRoutes);
router.use('/data', importExportRoutes);
router.use('/sitevisits', sitevisitRoutes);

router.get('/health', (_req, res) => {
    res.json({ success: true, message: 'CRM API is running.' });
});

export default router;