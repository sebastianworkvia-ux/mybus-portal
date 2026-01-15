import express from 'express'
import multer from 'multer'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { importCarriers } from '../controllers/importController.js'

const router = express.Router()

// Konfiguracja multer
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Tylko pliki CSV są dozwolone'))
    }
  }
})

// POST /api/import/carriers - import przewoźników z CSV (tylko admin)
router.post('/carriers', authMiddleware, adminMiddleware, upload.single('file'), importCarriers)

export default router
