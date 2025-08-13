async function searchWallpapers() {
    const query = document.getElementById('searchInput').value;
    if (!query) return alert('Please enter a search term');

    const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    if (data.wallpapers.length === 0) {
        gallery.innerHTML = '<p>No wallpapers found</p>';
        return;
    }

    data.wallpapers.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        gallery.appendChild(img);
    });
}
