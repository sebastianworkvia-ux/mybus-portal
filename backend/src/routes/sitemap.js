import express from 'express'
import { generateSitemap } from '../controllers/sitemapController.js'

const router = express.Router()

// GET /sitemap.xml - Dynamically generated sitemap
router.get('/sitemap.xml', generateSitemap)

export default router
