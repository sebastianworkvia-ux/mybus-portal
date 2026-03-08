import Carrier from '../models/Carrier.js'
import { slugify } from '../utils/textUtils.js'

// Supported countries for /transport-to/:country pages
const COUNTRIES = [
  'germany', 'niemcy',
  'netherlands', 'holandia',
  'belgium', 'belgia',
  'france', 'francja',
  'austria',
  'denmark', 'dania',
  'norway', 'norwegia',
  'sweden', 'szwecja',
  'switzerland', 'szwajcaria',
  'luxembourg', 'luksemburg',
  'england', 'uk', 'anglia'
]

// Use unique country names only (no duplicates)
const UNIQUE_COUNTRIES = [
  'germany', 'netherlands', 'belgium', 'france', 
  'austria', 'denmark', 'norway', 'sweden', 
  'switzerland', 'luxembourg', 'uk'
]

export const generateSitemap = async (req, res, next) => {
  try {
    const BASE_URL = process.env.FRONTEND_URL || 'https://my-bus.eu'
    
    // Fetch all active carriers
    const carriers = await Carrier.find({ isActive: true })
      .select('_id location.city updatedAt')
      .lean()
    
    // Extract unique cities (for /city/:cityName pages)
    const citiesSet = new Set()
    carriers.forEach(carrier => {
      if (carrier.location?.city) {
        citiesSet.add(carrier.location.city)
      }
    })
    const cities = Array.from(citiesSet)
    
    // Start XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    // 1. Homepage
    xml += '  <url>\n'
    xml += `    <loc>${BASE_URL}/</loc>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'
    
    // 2. Search page
    xml += '  <url>\n'
    xml += `    <loc>${BASE_URL}/search</loc>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>0.9</priority>\n'
    xml += '  </url>\n'
    
    // 3. Map page
    xml += '  <url>\n'
    xml += `    <loc>${BASE_URL}/map</loc>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'
    
    // 4. Pricing page
    xml += '  <url>\n'
    xml += `    <loc>${BASE_URL}/pricing</loc>\n`
    xml += '    <changefreq>monthly</changefreq>\n'
    xml += '    <priority>0.7</priority>\n'
    xml += '  </url>\n'
    
    // 5. For carriers page
    xml += '  <url>\n'
    xml += `    <loc>${BASE_URL}/for-carriers</loc>\n`
    xml += '    <changefreq>monthly</changefreq>\n'
    xml += '    <priority>0.7</priority>\n'
    xml += '  </url>\n'
    
    // 6. All carrier detail pages (/carrier/:id)
    carriers.forEach(carrier => {
      const lastmod = carrier.updatedAt 
        ? new Date(carrier.updatedAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0]
      
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}/carrier/${carrier._id}</loc>\n`
      xml += `    <lastmod>${lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })
    
    // 7. All city pages (/city/:cityName)
    cities.forEach(city => {
      const slug = slugify(city)
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}/city/${slug}</loc>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.7</priority>\n'
      xml += '  </url>\n'
    })
    
    // 8. All country transport pages (/transport-to/:country)
    UNIQUE_COUNTRIES.forEach(country => {
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}/transport-to/${country}</loc>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })
    
    // 9. Static pages (legal)
    const staticPages = [
      { path: '/privacy-policy', priority: '0.3' },
      { path: '/terms', priority: '0.3' },
      { path: '/cookies', priority: '0.3' }
    ]
    
    staticPages.forEach(page => {
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}${page.path}</loc>\n`
      xml += '    <changefreq>yearly</changefreq>\n'
      xml += `    <priority>${page.priority}</priority>\n`
      xml += '  </url>\n'
    })
    
    // Close XML
    xml += '</urlset>'
    
    // Set proper headers for XML
    res.header('Content-Type', 'application/xml; charset=utf-8')
    res.header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.send(xml)
    
  } catch (error) {
    console.error('❌ Sitemap generation error:', error)
    next(error)
  }
}
