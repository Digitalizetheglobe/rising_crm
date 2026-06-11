import fs from 'fs';
import path from 'path';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export const UPLOADS_DIR = path.join(BACKEND_ROOT, 'uploads');

export const ensureUploadsDir = (): void => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
};
