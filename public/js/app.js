// DOM elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const loadingIndicator = document.getElementById('loading-indicator');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const previewModal = document.getElementById('preview-modal');
const closeBtn = document.getElementById('close-modal-btn');
const previewImage = document.getElementById('preview-image');
const downloadBtn = document.getElementById('download-btn');

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) await fetchWallpapers(query);
});

closeBtn.addEventListener('click', closePreviewModal);
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) closePreviewModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !previewModal.classList.contains('hidden')) closePreviewModal(); });

downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const url = downloadBtn.dataset.downloadUrl;
    if (url) triggerDownload(url);
    closePreviewModal();
});

// Fetch wallpapers from backend
async function fetchWallpapers(query) {
    resultsContainer.innerHTML = '';
    loadingIndicator.classList.remove('hidden');
    messageBox.classList.add('hidden');

    try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await resp.json();

        if (!resp.ok) {
            throw new Error(data.error || 'Server error while searching.');
        }

        // tolerant parsing: some backends may return {results: []}
        const wallpapers = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);

        if (!wallpapers.length) {
            showMessage(`No wallpapers found for "${query}". Try another search.`);
            return;
        }

        renderWallpapers(wallpapers);
    } catch (err) {
        console.error(err);
        showMessage(err.message || 'Failed to fetch wallpapers.');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function renderWallpapers(wallpapers) {
    resultsContainer.innerHTML = '';
    wallpapers.forEach((w, idx) => {
        const card = document.createElement('div');
        card.className = 'relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group cursor-pointer';

        // sanitize (basic)
        const title = String(w.title || `Wallpaper ${idx+1}`).replace(/</g, '&lt;');

        card.innerHTML = `
            <img src="${w.previewUrl}" alt="${title}" class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110">
            <div class="p-4">
                <h3 class="text-md font-semibold text-gray-200 truncate">${title}</h3>
                <div class="mt-4 flex justify-between items-center">
                    <button data-download-url="${w.downloadUrl}" class="download-trigger px-4 py-2 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition duration-200">
                        Download
                    </button>
                </div>
            </div>
            <div class="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                <div class="preview-trigger text-white text-lg font-bold p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Preview
                </div>
            </div>
        `;

        // preview click
        card.querySelector('.preview-trigger').addEventListener('click', () => openPreviewModal(w));
        // download click (use currentTarget to robustly read data attr)
        card.querySelector('.download-trigger').addEventListener('click', (ev) => {
            ev.stopPropagation();
            const url = ev.currentTarget.getAttribute('data-download-url');
            if (url) triggerDownload(url);
        });

        resultsContainer.appendChild(card);
    });
}

function openPreviewModal(w) {
    previewImage.src = w.previewUrl;
    downloadBtn.dataset.downloadUrl = w.downloadUrl;
    previewModal.classList.remove('hidden');
    previewModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

function closePreviewModal() {
    previewModal.classList.remove('flex');
    previewModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

async function triggerDownload(url) {
    messageBox.classList.add('hidden');
    try {
        const resp = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            throw new Error(body.error || 'Download failed.');
        }

        const blob = await resp.blob();
        const disposition = resp.headers.get('Content-Disposition') || '';
        const filenameMatch = /filename="?([^"]+)"?/.exec(disposition);
        const filename = filenameMatch ? filenameMatch[1] : `wallpaper_${Date.now()}.jpg`;

        const tempUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = tempUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(tempUrl);
        a.remove();
    } catch (err) {
        console.error('Download error:', err);
        showMessage(err.message || 'Download failed.');
    }
}

function showMessage(text) {
    messageText.textContent = text;
    messageBox.classList.remove('hidden');
}
