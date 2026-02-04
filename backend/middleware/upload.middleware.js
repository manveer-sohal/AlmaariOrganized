import multer from "multer";

// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for handling file upload route
const uploadMiddleware = upload.single("image");

export default uploadMiddleware;
