import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ATTACHMENT_MIME_TYPES } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/id.js';

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: env.uploadDir,
  // Never trust the client file name for the path on disk: random id + safe extension only.
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
    cb(null, `${newId()}${ext}`);
  },
});

export const uploadSingleFile = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
      return cb(AppError.badRequest(`File type "${file.mimetype}" is not allowed`));
    }
    return cb(null, true);
  },
}).single('file');
