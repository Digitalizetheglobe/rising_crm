
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createBookingService,
  getBookingsService,
  getBookingByIdService,
  updateBookingService,
  cancelBookingService,
  completeBookingService,
  getBookingStatsService,
} from './booking.service';

// POST /api/v1/bookings
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await createBookingService(req.body, req.user!.UserId);
    res.status(201).json({ success: true, message: 'Booking created successfully', data: booking });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bookings
export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getBookingsService(req.query as any, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Bookings fetched successfully', data: result });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bookings/stats
export const getBookingStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getBookingStatsService(req.query as any, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Booking stats fetched successfully', data: stats });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// GET /api/v1/bookings/:id
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await getBookingByIdService(req.params.id as string, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Booking fetched successfully', data: booking });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/bookings/:id
export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await updateBookingService(req.params.id as string, req.body, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Booking updated successfully', data: booking });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/bookings/:id/cancel
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await cancelBookingService(
      req.params.id as string,
      req.body.cancellationReason,
      req.user!.UserId,
      req.user!.role
    );
    res.status(200).json({ success: true, message: 'Booking cancelled and unit reverted to Available', data: result });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/bookings/:id/complete
export const completeBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await completeBookingService(req.params.id as string, req.user!.UserId, req.user!.role);
    res.status(200).json({ success: true, message: 'Booking completed and unit marked as Sold', data: result });
  } catch (error: any) {
    const code = error.statusCode || 500;
    res.status(code).json({ success: false, message: error.message });
  }
};