
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createPaymentService,
  getPaymentsService,
  getPaymentByIdService,
  updatePaymentService,
  markPaymentPaidService,
  waivePaymentService,
  deletePaymentService,
  getPaymentStatsService,
} from './payment.service';

// POST /api/v1/payments
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await createPaymentService(req.body, req.user!.UserId);
    res.status(201).json({ success: true, message: 'Payment created successfully', data: payment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/payments
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getPaymentsService(req.query as any, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Payments fetched successfully', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/payments/stats
export const getPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getPaymentStatsService(req.query as any, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Payment stats fetched successfully', data: stats });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/payments/:id
export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await getPaymentByIdService(req.params.id as string, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Payment fetched successfully', data: payment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/payments/:id
export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await updatePaymentService(req.params.id as string, req.body);
    res.status(200).json({ success: true, message: 'Payment updated successfully', data: payment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/payments/:id/pay
export const markPaymentPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await markPaymentPaidService(req.params.id as string, req.body);
    res.status(200).json({ success: true, message: 'Payment marked as paid', data: payment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/payments/:id/waive
export const waivePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await waivePaymentService(req.params.id as string, req.body.notes);
    res.status(200).json({ success: true, message: 'Payment waived successfully', data: payment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/payments/:id
export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await deletePaymentService(req.params.id as string);
    res.status(200).json({ success: true, message: 'Payment deleted successfully', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};