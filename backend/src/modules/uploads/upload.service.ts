export const formatFileUpload = (file: Express.Multer.File) => {
    return {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`,
    };
};
