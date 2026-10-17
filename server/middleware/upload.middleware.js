const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError('Only PDF and DOCX documents are allowed', 400),
      false
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return cb(
      new AppError('Invalid document MIME type. Only PDF and DOCX files are allowed', 400),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Validate Magic Bytes / File Signatures for PDF and DOCX files
 */
const validateResumeMagicBytes = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please select a resume file to upload', 400));
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length < 4) {
    return next(new AppError('Uploaded file appears corrupt or unreadable', 400));
  }

  const ext = path.extname(req.file.originalname).toLowerCase();

  // Check Magic Bytes
  if (ext === '.pdf') {
    // PDF Magic Bytes: %PDF (0x25 0x50 0x44 0x46)
    const isPdf =
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;
    if (!isPdf) {
      return next(
        new AppError(
          'File signature mismatch. The uploaded file is not a valid PDF document.',
          400
        )
      );
    }
  } else if (ext === '.docx') {
    // DOCX (ZIP format) Magic Bytes: PK.. (0x50 0x4B 0x03 0x04)
    const isDocx =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
    if (!isDocx) {
      return next(
        new AppError(
          'File signature mismatch. The uploaded file is not a valid DOCX document.',
          400
        )
      );
    }
  }

  next();
};

/**
 * Multer error handler wrapper
 */
const handleUpload = (req, res, next) => {
  const singleUpload = upload.single('resume');

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError('File size exceeds the maximum limit of 5 MB', 413)
        );
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    validateResumeMagicBytes(req, res, next);
  });
};

module.exports = {
  handleUpload,
  MAX_FILE_SIZE,
};
