// server.js
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');
const cors = require('cors'); // <-- ADD THIS LINE

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port

// --- ADD THE CORS MIDDLEWARE HERE ---
// This enables ALL CORS requests, allowing your frontend to access the backend.
app.use(cors());

// You can also configure it to only allow specific origins for better security,
// but for now, the simple `app.use(cors())` is a great start.
// For example:
// app.use(cors({
//     origin: 'https://your-github-username.github.io' 
// }));

app.use(express.static(path.join(__dirname, 'public')));

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
        // The original scraping code was pushing a data-src attribute.
        // It's possible the website has changed or the attribute name is different
        // for full-size vs thumbnails. Let's make a slight adjustment to be
        // more robust.
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
