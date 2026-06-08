import { Request, Response, NextFunction } from 'express';

// ─── MongoDB Operator Injection Prevention ────────────────────────────────────

const MONGO_OPERATORS = /^\$|^\./;

/**
 * Recursively strip MongoDB operators ($, .) from object keys.
 * Prevents NoSQL injection attacks.
 */
const sanitizeObject = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (MONGO_OPERATORS.test(key)) {
      // Drop the key entirely
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Middleware: sanitize req.body, req.query, req.params against NoSQL injection.
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body) as Record<string, unknown>;
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as Record<string, string>;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as Record<string, string>;
  }
  next();
};

// ─── XSS Prevention ───────────────────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export const escapeHtml = (str: string): string =>
  str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] ?? char);

// ─── File Upload Validation ───────────────────────────────────────────────────

// Magic bytes for common image/video formats
const MAGIC_BYTES: Array<{ bytes: number[]; offset?: number; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png' },
  { bytes: [0x47, 0x49, 0x46], mime: 'image/gif' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' }, // RIFF header (WebP)
  { bytes: [0x00, 0x00, 0x00], offset: 4, mime: 'video/mp4' }, // ftyp box
];

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export const validateFileUpload = (
  buffer: Buffer,
  declaredMime: string,
): { valid: boolean; reason?: string } => {
  const isImage = ALLOWED_IMAGE_MIMES.has(declaredMime);
  const isVideo = ALLOWED_VIDEO_MIMES.has(declaredMime);

  if (!isImage && !isVideo) {
    return { valid: false, reason: `File type ${declaredMime} is not allowed` };
  }

  const maxSize = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      reason: `File too large. Max ${isVideo ? '50MB' : '10MB'} allowed`,
    };
  }

  // Check magic bytes for images
  if (isImage) {
    const matchesMagic = MAGIC_BYTES.some(({ bytes, offset = 0 }) =>
      bytes.every((b, i) => buffer[offset + i] === b),
    );
    if (!matchesMagic) {
      return { valid: false, reason: 'File content does not match declared type' };
    }
  }

  return { valid: true };
};
