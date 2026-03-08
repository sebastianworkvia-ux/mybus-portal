import express from 'express'
import { generateSitemap, generateRobotsTxt } from '../controllers/sitemapController.js'

const router = express.Router()

// GET /sitemap.xml - Dynamically generated sitemap
router.get('/sitemap.xml', generateSitemap)

// GET /robots.txt - SEO robots file
router.get('/robots.txt', generateRobotsTxt)

export default router
