async function searchWallpapers() {
    const query = document.getElementById('searchInput').value;
    if (!query) return alert('Please enter a search term');

    // Change this to your backend URL after hosting it on Render/Railway/Heroku
    const backendURL = 'https://my-wallpaper-backend.onrender.com';

    const res = await fetch(`${backendURL}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    if (!data.wallpapers || data.wallpapers.length === 0) {
        gallery.innerHTML = '<p>No wallpapers found</p>';
        return;
    }

    data.wallpapers.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Wallpaper';
        gallery.appendChild(img);
    });
}
