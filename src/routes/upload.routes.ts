import express from 'express';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// Upload single image
router.post('/image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path });
});

// Upload multiple images
router.post('/images', upload.array('images', 5), (req, res) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    const urls = (req.files as Express.Multer.File[]).map(file => file.path);
    res.json({ urls });
});

export default router;
