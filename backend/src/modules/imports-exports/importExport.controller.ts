import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import {
  importLeads, importClients, importPayments, importProjects, importUnits,
  exportLeads, exportClients, exportPayments, exportProjects, exportUnits,
  downloadTemplate, ExportFilters,
} from './importExport.service';

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

export const handleImportLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Please upload an Excel or CSV file.');
  const result = await importLeads(
    req.file.buffer,
    req.user!.id,
    req.body.agentId  // admin can pass agentId to override
  );
  res.status(200).json(new ApiResponse('Leads import complete', result));
});

export const handleImportClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Please upload an Excel or CSV file.');
  const result = await importClients(req.file.buffer, req.user!.id, req.body.agentId);
  res.status(200).json(new ApiResponse('Clients import complete', result));
});

export const handleImportPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Please upload an Excel or CSV file.');
  const result = await importPayments(req.file.buffer, req.user!.id, req.body.agentId);
  res.status(200).json(new ApiResponse('Payments import complete', result));
});

export const handleImportProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Please upload an Excel or CSV file.');
  const result = await importProjects(req.file.buffer);
  res.status(200).json(new ApiResponse('Projects import complete', result));
});

export const handleImportUnits = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Please upload an Excel or CSV file.');
  const result = await importUnits(req.file.buffer);
  res.status(200).json(new ApiResponse('Units import complete', result));
});

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

const getFilters = (query: Record<string, any>): ExportFilters => ({
  agentId:   query.agentId,
  projectId: query.projectId,
  startDate: query.startDate,
  endDate:   query.endDate,
});

const sendExcel = (res: Response, buffer: ExcelJS.Buffer, filename: string) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.xlsx"`);
  res.send(buffer);
};

// import ExcelJS buffer type
import ExcelJS from 'exceljs';

export const handleExportLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = await exportLeads(getFilters(req.query as any));
  sendExcel(res, buffer, 'leads');
});

export const handleExportClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = await exportClients(getFilters(req.query as any));
  sendExcel(res, buffer, 'clients');
});

export const handleExportPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = await exportPayments(getFilters(req.query as any));
  sendExcel(res, buffer, 'payments');
});

export const handleExportProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = await exportProjects(getFilters(req.query as any));
  sendExcel(res, buffer, 'projects');
});

export const handleExportUnits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = await exportUnits(getFilters(req.query as any));
  sendExcel(res, buffer, 'units');
});

export const handleDownloadTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const type = req.params.type as any;
  const buffer = await downloadTemplate(type);
  sendExcel(res, buffer, `${type}_template`);
});