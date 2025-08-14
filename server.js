// server.js
const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const cors = require('cors');

// --- 1. INITIALIZE THE EXPRESS APP AND MIDDLEWARE ---
const app = express();
const host = '0.0.0.0';

// Use environment variable for port, defaulting to 3000
const PORT = process.env.PORT || 3000;

// Enable ALL CORS requests for frontend access
app.use(cors());

// Serve static files from the 'public' directory
// NOTE: Your index.html and any other static files (CSS, JS, etc.)
// must be placed inside a folder named 'public' for this to work.
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. DEFINE ROUTES ---
// The API route for searching wallpapers
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'No search query provided' });
  }

  try {
    const url = `https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`;
    
    // Using the native Node.js fetch API (available in Node.js 18+)
    const response = await fetch(url);
    const body = await response.text();
    const $ = cheerio.load(body);

    const wallpapers = [];
    $('img.lazy').each((i, img) => {
      const src = $(img).attr('data-src'); // This is often the thumbnail
      const fullResUrl = $(img).closest('a').attr('href'); // Find the parent link for the full-res image

      if (src) {
        wallpapers.push({
          src: src,
          fullResUrl: fullResUrl
        });
      }
    });

    res.json({ wallpapers });
  } catch (err) {
    console.error('Scraping failed:', err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

// The route for the homepage should be handled by express.static
// No need for a separate app.get('/', ...) if your index.html is in 'public'

// --- 3. START THE SERVER ---
app.listen(PORT, host, () => {
  console.log(`Server listening on http://${host}:${PORT}`);
});
