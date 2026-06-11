import multer from "multer";
import { UPLOAD_MAX_BYTES } from "../constants/uploadLimits.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    return cb(null, true);
  },
});

const uploadSingle = upload.single("image");

/** Multer upload with size/type pre-check and friendly errors. */
const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `File too large. Maximum size is ${Math.round(UPLOAD_MAX_BYTES / (1024 * 1024))} MB`,
        });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return next();
  });
};

export default uploadMiddleware;
