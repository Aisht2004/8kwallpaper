// Function to handle the search logic
async function searchWallpapers() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value;
    const gallery = document.getElementById('gallery');
    const loadingIndicator = document.getElementById('loading-indicator');
    const messageBox = document.getElementById('message-box');

    if (!query) {
        messageBox.textContent = 'Please enter a search term.';
        messageBox.style.display = 'block';
        return;
    }

    // Hide any previous messages and clear the gallery
    messageBox.style.display = 'none';
    gallery.innerHTML = '';
    loadingIndicator.style.display = 'block';

    try {
        // Replace with your actual backend URL after deployment
        const backendURL = 'https://my-wallpaper-backend.onrender.com';
        const res = await fetch(`${backendURL}/search?q=${encodeURIComponent(query)}`);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.wallpapers || data.wallpapers.length === 0) {
            messageBox.textContent = 'No wallpapers found for your search.';
            messageBox.style.display = 'block';
        } else {
            // Dynamically create the full UI for each wallpaper
            data.wallpapers.forEach(wallpaper => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'wallpaper-item';
                itemDiv.setAttribute('data-full-res', wallpaper.fullResUrl || wallpaper.src);

                const img = document.createElement('img');
                img.src = wallpaper.src;
                img.alt = wallpaper.alt || 'Wallpaper';

                const overlayDiv = document.createElement('div');
                overlayDiv.className = 'image-overlay';
                overlayDiv.innerHTML = '<span class="overlay-text">Preview</span>';

                itemDiv.appendChild(img);
                itemDiv.appendChild(overlayDiv);

                // Add an event listener to open the modal on click
                itemDiv.addEventListener('click', () => {
                    openModal(wallpaper.fullResUrl || wallpaper.src);
                });

                gallery.appendChild(itemDiv);
            });
        }
    } catch (error) {
        console.error('Error fetching wallpapers:', error);
        messageBox.textContent = 'Failed to load wallpapers. Please try again later.';
        messageBox.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Function to handle the preview modal
function openModal(imageUrl) {
    const modal = document.getElementById('preview-modal');
    const previewImage = document.getElementById('preview-image');
    const downloadBtn = document.getElementById('download-btn');
    
    previewImage.src = imageUrl;
    downloadBtn.href = imageUrl;
    downloadBtn.download = `wallpaper-${new Date().getTime()}.jpg`; // Suggest a filename
    modal.style.display = 'flex';
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('preview-modal');
    modal.style.display = 'none';
}

// Attach the search function to the button click and enter key press
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.querySelector('.search-container button');
    const searchInput = document.getElementById('searchInput');
    const modalCloseButton = document.querySelector('.close-btn');

    searchButton.addEventListener('click', searchWallpapers);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchWallpapers();
        }
    });

    modalCloseButton.addEventListener('click', closeModal);
});
