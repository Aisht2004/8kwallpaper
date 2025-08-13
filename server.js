const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic CORS (frontend is served from same server but kept here for flexibility)
app.use(cors());

// Rate limiter for /api routes to reduce chance of abuse/blocking
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // limit each IP to 30 requests per windowMs
  message: { error: 'Too many requests — try again in a minute.' }
});
app.use('/api/', apiLimiter);

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * /api/search?q=term
 * Scrape Wallpaperflare search results and return an array of objects:
 * [{ title, previewUrl, downloadUrl }, ...]
 */
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing search query (q).' });

  const searchUrl = `https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(q)}`;

  try {
    const resp = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      timeout: 15000
    });

    const $ = cheerio.load(resp.data);
    const results = [];
    const seen = new Set();

    // Generic approach: collect image URLs from <img> tags that point to wallpaperflare
    $('img').each((i, el) => {
      let src = $(el).attr('data-src') || $(el).attr('src') || $(el).attr('data-original');
      if (!src) return;
      // Normalize protocol-less URLs
      if (src.startsWith('//')) src = 'https:' + src;
      if (src.startsWith('/')) src = 'https://www.wallpaperflare.com' + src;

      // Accept only wallpaperflare image hosts
      if (!src.includes('wallpaperflare.com')) return;
      // skip tiny icons etc
      if (src.match(/(icon|sprite|favicon|logo)/i)) return;

      if (!seen.has(src)) {
        seen.add(src);
        results.push({
          title: `${q} wallpaper`,
          previewUrl: src,
          downloadUrl: src
        });
      }
    });

    // Limit results to top 40
    res.json(results.slice(0, 40));
  } catch (err) {
    console.error('Search scrape error:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch wallpapers. Try again later.' });
  }
});

/**
 * /api/download?url=<imageUrl>
 * Proxies the image binary so the browser can download via same-origin.
 * Only allows wallpaperflare domains for safety.
 */
app.get('/api/download', async (req, res) => {
  const url = (req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'Missing url parameter.' });

  // Basic domain whitelist (only wallpaperflare)
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('wallpaperflare.com')) {
      return res.status(403).json({ error: 'Download blocked: domain not allowed.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  try {
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      timeout: 20000
    });

    const contentType = resp.headers['content-type'] || 'application/octet-stream';
    // Safely extract filename from URL path
    let filename = path.basename(new URL(url).pathname) || 'wallpaper.jpg';
    // Ensure filename has an extension
    if (!path.extname(filename)) filename += '.jpg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(resp.data));
  } catch (err) {
    console.error('Download proxy error:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch the image for download.' });
  }
});

// Fallback: serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening: http://localhost:${PORT}`);
});
  
