// server.js
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

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
        $('img.lazy').each((i, img) => {
            const src = $(img).attr('data-src');
            if (src) wallpapers.push(src);
        });

        res.json({ wallpapers });
    } catch (err) {
        res.status(500).json({ error: 'Scraping failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
