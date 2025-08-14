// server.js
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const http = require('http');
const cheerio = require('cheerio');
const path = require('path');
const cors = require('cors');

// --- 1. CORRECTLY INITIALIZE THE EXPRESS APP ---
const app = express();
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
const host = '0.0.0.0';

// Use environment variable for port, defaulting to 3000
const PORT = process.env.PORT || 3000;

// --- 2. CREATE THE HTTP SERVER USING THE EXPRESS APP ---
const server = http.createServer(app);

// --- 3. SET TIMEOUTS ON THE SERVER OBJECT (CORRECT LOCATION) ---
// This is the solution for the intermittent timeouts and connection reset errors.
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

// --- 4. ADD MIDDLEWARE AND ROUTES (BEFORE THE LISTEN CALL) ---
// This enables ALL CORS requests, allowing your frontend to access the backend.
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, index.html)));

// Define the API route for searching wallpapers
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'No search query provided' });
  }

  try {
    const url = `https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`;
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
    console.error('Scraping failed:', err); // Log the error for debugging
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

// --- 5. START THE SERVER (ONLY ONE LISTEN CALL) ---
// Use the defined server object and PORT variable.
server.listen(PORT, host, () => {
  console.log(`Server listening on http://${host}:${PORT}`);
});
