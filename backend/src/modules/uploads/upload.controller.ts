import { Request, Response } from 'express';
import { formatFileUpload } from './upload.service';

export const uploadSingleFile = (req: Request, res: Response): void => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        const data = formatFileUpload(req.file);
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadMultipleFiles = (req: Request, res: Response): void => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'No files uploaded' });
            return;
        }

        const data = files.map(file => formatFileUpload(file));
        res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            data
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
