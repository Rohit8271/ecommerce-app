import path from 'path';
import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // Create unique filename: fieldname-timestamp.extension
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// File filter — images only, no videos
function fileFilter(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp).'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter,
});

// POST /api/upload — upload a single product image
router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    // Return URL path that can be stored in DB and referenced publicly
    res.json({
        message: 'Image uploaded successfully',
        imageUrl: `/uploads/${req.file.filename}`,
    });
});

export default router;
