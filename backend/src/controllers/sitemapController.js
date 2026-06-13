import Carrier from '../models/Carrier.js'

// Supported countries for /transport/:country pages
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
  'uk'
]

export const generateSitemap = async (req, res, next) => {
  try {
    const BASE_URL = process.env.FRONTEND_URL || 'https://my-bus.eu'
    
    // Fetch all active carriers
    const carriers = await Carrier.find({ isActive: true })
      .select('_id slug updatedAt')
      .lean()
    
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
    
    // 6. All carrier detail pages (/carrier/:slug)
    carriers.forEach(carrier => {
      const lastmod = carrier.updatedAt 
        ? new Date(carrier.updatedAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0]
      
      // Use slug if available, fallback to _id for backward compatibility
      const carrierPath = carrier.slug || carrier._id
      
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}/carrier/${carrierPath}</loc>\n`
      xml += `    <lastmod>${lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })
    
    // 7. Country transport pages (/transport/:country)
    UNIQUE_COUNTRIES.forEach(country => {
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}/transport/${country}</loc>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })
    
    // 8. Static pages (legal)
    const staticPages = [
      { path: '/privacy', priority: '0.3' },
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

// Generate carriers-only sitemap (for /api/sitemap-carriers.xml via Vercel proxy)
export const generateCarriersSitemap = async (req, res, next) => {
  try {
    const BASE_URL = process.env.FRONTEND_URL || 'https://my-bus.eu'

    const carriers = await Carrier.find({ isActive: true })
      .select('slug _id updatedAt')
      .lean()

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    carriers.forEach(carrier => {
      const lastmod = carrier.updatedAt
        ? new Date(carrier.updatedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      const carrierPath = carrier.slug || carrier._id

      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}/carrier/${carrierPath}</loc>\n`
      xml += `    <lastmod>${lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })

    xml += '</urlset>'

    res.header('Content-Type', 'application/xml; charset=utf-8')
    res.header('Cache-Control', 'public, max-age=3600')
    res.send(xml)
  } catch (error) {
    console.error('❌ Carriers sitemap generation error:', error)
    next(error)
  }
}

// Generate robots.txt
export const generateRobotsTxt = (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://my-bus.eu'
  
  const robotsTxt = `# Robots.txt for My-Bus.eu
User-agent: *
Allow: /

# Sitemap location
Sitemap: ${FRONTEND_URL}/sitemap.xml
Sitemap: ${FRONTEND_URL}/sitemap-carriers.xml

# Crawl-delay (optional, for politeness)
Crawl-delay: 1

# Disallow admin and API routes
Disallow: /api/admin
Disallow: /api/auth
Disallow: /api/password

# Allow public API endpoints
Allow: /api/carriers
Allow: /api/reviews
`
  
  res.header('Content-Type', 'text/plain; charset=utf-8')
  res.header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
  res.send(robotsTxt)
}
