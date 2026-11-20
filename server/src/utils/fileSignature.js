// Checks the file's first bytes (its "magic number"), not the filename or browser-provided MIME type.
export function detectMime(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
  return null;
}

export function verifyEvidence(req, res, next) {
  for (const f of req.files || []) {
    if (detectMime(f.buffer) !== f.mimetype) {
      return res.status(400).json({ message: `${f.originalname} is not a valid file of its type` });
    }
  }
  next();
}