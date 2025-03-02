document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const captureBtn = document.getElementById('captureBtn');
    const filterBtn = document.getElementById('filterBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const gallery = document.getElementById('gallery');
    const countdown = document.getElementById('countdown');
    const filters = document.getElementById('filters');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Variables
    let stream = null;
    let currentFilter = 'normal';
    let photosTaken = [];
    
    // Event Listeners
    startBtn.addEventListener('click', initCamera);
    captureBtn.addEventListener('click', startCountdown);
    filterBtn.addEventListener('click', toggleFilters);
    downloadBtn.addEventListener('click', downloadPhoto);
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterButtons.forEach(b => b.classList.remove('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-purple-500'));
            btn.classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-purple-500');
            applyFilterToVideo(currentFilter);
        });
    });
    
    // Initialize the camera
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false
            });
            
            video.srcObject = stream;
            
            // Set canvas size after video metadata loads
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                startBtn.disabled = true;
                captureBtn.disabled = false;
                startBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                startBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                captureBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                captureBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please make sure you have granted camera permissions.');
        }
    }
    
    // Start countdown before taking photo
    function startCountdown() {
        let count = 3;
        captureBtn.disabled = true;
        captureBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        captureBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        countdown.classList.remove('hidden');
        countdown.classList.add('flex');
        countdown.textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdown.textContent = count;
            } else {
                clearInterval(countInterval);
                countdown.classList.remove('flex');
                countdown.classList.add('hidden');
                capturePhoto();
                captureBtn.disabled = false;
                captureBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                captureBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            }
        }, 1000);
    }
    
    // Capture photo
    function capturePhoto() {
        // Hide video and show canvas temporarily
        video.classList.add('hidden');
        canvas.classList.remove('hidden');
        
        // Draw the video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Apply the selected filter to the captured image
        applyFilterToCanvas(currentFilter);
        
        // Create a copy of the canvas content
        const imageData = canvas.toDataURL('image/png');
        
        // Add photo to gallery
        addToGallery(imageData);
        
        // Store the photo
        photosTaken.push({
            src: imageData,
            filter: currentFilter,
            timestamp: new Date().toISOString()
        });
        
        // Show video and hide canvas again after a brief delay
        setTimeout(() => {
            video.classList.remove('hidden');
            canvas.classList.add('hidden');
        }, 1500);
        
        // Enable download button
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
        downloadBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }
    
    // Add photo to gallery
    function addToGallery(imageSrc) {
        const photoItem = document.createElement('div');
        photoItem.className = 'relative rounded-lg overflow-hidden shadow-md transition transform hover:scale-105';
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.className = 'w-full h-auto block';
        
        const actions = document.createElement('div');
        actions.className = 'absolute inset-x-0 bottom-0 bg-black bg-opacity-70 p-2 flex justify-around opacity-0 hover:opacity-100 transition-opacity';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded transition';
        downloadBtn.addEventListener('click', () => {
            downloadSinglePhoto(imageSrc);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition';
        deleteBtn.addEventListener('click', () => {
            gallery.removeChild(photoItem);
            
            // Remove from stored photos
            const index = photosTaken.findIndex(photo => photo.src === imageSrc);
            if (index !== -1) {
                photosTaken.splice(index, 1);
            }
            
            // Disable download button if no photos left
            if (photosTaken.length === 0) {
                downloadBtn.disabled = true;
                downloadBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                downloadBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            }
        });
        
        actions.appendChild(downloadBtn);
        actions.appendChild(deleteBtn);
        
        photoItem.appendChild(img);
        photoItem.appendChild(actions);
        
        gallery.appendChild(photoItem);
    }
    
    // Toggle filters visibility
    function toggleFilters() {
        if (filters.classList.contains('hidden')) {
            filters.classList.remove('hidden');
            filterBtn.textContent = 'Hide Filters';
        } else {
            filters.classList.add('hidden');
            filterBtn.textContent = 'Apply Filter';
        }
    }
    
    // Apply filter to video
    function applyFilterToVideo(filter) {
        let filterValue = getFilterCSS(filter);
        video.style.filter = filterValue;
    }
    
    // Apply filter to canvas
    function applyFilterToCanvas(filter) {
        if (filter === 'normal') return;
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            
            switch(filter) {
                case 'grayscale':
                    const gray = 0.3 * red + 0.59 * green + 0.11 * blue;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                    break;
                    
                case 'sepia':
                    data[i] = Math.min(255, (red * 0.393) + (green * 0.769) + (blue * 0.189));
                    data[i + 1] = Math.min(255, (red * 0.349) + (green * 0.686) + (blue * 0.168));
                    data[i + 2] = Math.min(255, (red * 0.272) + (green * 0.534) + (blue * 0.131));
                    break;
                    
                case 'invert':
                    data[i] = 255 - red;
                    data[i + 1] = 255 - green;
                    data[i + 2] = 255 - blue;
                    break;
            }
        }
        
        context.putImageData(imageData, 0, 0);
    }
    
    // Helper function to get CSS filter value
    function getFilterCSS(filter) {
        switch(filter) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(100%)';
            case 'invert': return 'invert(100%)';
            default: return 'none';
        }
    }
    
    // Download single photo
    function downloadSinglePhoto(imageSrc) {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `photo_${new Date().getTime()}.png`;
        link.click();
    }
    
    // Download all photos as zip (this would require a zip library in production)
    function downloadPhoto() {
        if (photosTaken.length === 1) {
            downloadSinglePhoto(photosTaken[0].src);
        } else if (photosTaken.length > 1) {
            // In a real application, you would use a library like JSZip to package multiple files
            // For this demo, we'll just download the most recent photo
            downloadSinglePhoto(photosTaken[photosTaken.length - 1].src);
            alert('Note: To download multiple photos as a ZIP file, you would need to include a ZIP library.');
        }
    }
    
    // Clean up when leaving page
    window.addEventListener('beforeunload', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
    
    // Mark first filter button as active
    document.querySelector('.filter-btn[data-filter="normal"]').classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-purple-500');
});