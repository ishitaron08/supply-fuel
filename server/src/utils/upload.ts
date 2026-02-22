import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from 'shared';

// Ensure upload dirs exist
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const invoiceDir = path.join(config.uploadDir, 'invoices');
const billDir = path.join(config.uploadDir, 'bills');
ensureDir(invoiceDir);
ensureDir(billDir);

const billStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, billDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
  }
};

export const uploadBill = multer({
  storage: billStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
