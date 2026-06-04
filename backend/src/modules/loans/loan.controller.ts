
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createLoanService,
  getLoansService,
  getLoanByIdService,
  updateLoanService,
  updateLoanStatusService,
  deleteLoanService,
  getLoanStatsService,
} from './loan.service';

// POST /api/v1/loans
export const createLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await createLoanService(req.body, req.user!.UserId);
    res.status(201).json({ success: true, message: 'Loan application created successfully', data: loan });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/loans
export const getLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getLoansService(req.query as any, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Loans fetched successfully', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/loans/stats
export const getLoanStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getLoanStatsService(req.query as any, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Loan stats fetched successfully', data: stats });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/loans/:id
export const getLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await getLoanByIdService(req.params.id as string, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Loan fetched successfully', data: loan });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/loans/:id
export const updateLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await updateLoanService(req.params.id as string, req.body);
    res.status(200).json({ success: true, message: 'Loan updated successfully', data: loan });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/loans/:id/status
export const updateLoanStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await updateLoanStatusService(req.params.id as string, req.body, req.user!.UserId);
    res.status(200).json({ success: true, message: `Loan status updated to ${req.body.status}`, data: loan });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/loans/:id
export const deleteLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await deleteLoanService(req.params.id as string);
    res.status(200).json({ success: true, message: 'Loan deleted successfully', data: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};