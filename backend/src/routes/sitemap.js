import express from 'express'
import { generateSitemap, generateCarriersSitemap, generateRobotsTxt } from '../controllers/sitemapController.js'

const router = express.Router()

// GET /sitemap.xml - Dynamically generated sitemap
router.get('/sitemap.xml', generateSitemap)

// GET /sitemap-carriers.xml - Only carrier profile pages (accessible via /api/sitemap-carriers.xml)
router.get('/sitemap-carriers.xml', generateCarriersSitemap)

// GET /robots.txt - SEO robots file
router.get('/robots.txt', generateRobotsTxt)

export default router
