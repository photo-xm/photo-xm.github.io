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
    const cameraStatus = document.getElementById('camera-status');
    const emptyGallery = document.getElementById('empty-gallery');
    
    // Variables
    let stream = null;
    let currentFilter = 'normal';
    let photosTaken = [];
    
    // Flag to check if this is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set camera constraints based on device
    const cameraConstraints = {
        video: {
            facingMode: isMobile ? "environment" : "user", // Use back camera on mobile by default
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };
    
    // Check if camera API is supported
    function checkCameraSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraStatus.textContent = 'กล้องไม่รองรับในเบราว์เซอร์นี้';
            cameraStatus.classList.remove('bg-black');
            cameraStatus.classList.add('bg-red-500');
            startBtn.disabled = true;
            startBtn.classList.add('opacity-50', 'cursor-not-allowed');
            
            alert('เบราว์เซอร์ของคุณไม่รองรับการใช้งานกล้อง กรุณาลองใช้ Chrome, Firefox หรือ Safari เวอร์ชั่นล่าสุด');
            return false;
        }
        return true;
    }
    
    // Add mobile camera toggle button
    if (isMobile) {
        const cameraToggle = document.createElement('button');
        cameraToggle.innerHTML = `
            <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                สลับกล้อง
            </span>
        `;
        cameraToggle.className = 'bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-2.5 px-5 rounded-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:ring-opacity-50 shadow-md';
        cameraToggle.addEventListener('click', toggleCamera);
        
        // Insert after start button
        startBtn.parentNode.insertBefore(cameraToggle, startBtn.nextSibling);
    }
    
    // Toggle between front and back camera (mobile only)
    function toggleCamera() {
        if (!stream) return;
        
        // Stop current stream
        stream.getTracks().forEach(track => track.stop());
        
        // Toggle camera facing mode
        cameraConstraints.video.facingMode = cameraConstraints.video.facingMode === "user" ? "environment" : "user";
        
        // Restart camera with new constraints
        initCamera();
    }
    
    // Event Listeners
    startBtn.addEventListener('click', () => {
        if (checkCameraSupport()) {
            initCamera();
        }
    });
    captureBtn.addEventListener('click', startCountdown);
    filterBtn.addEventListener('click', toggleFilters);
    downloadBtn.addEventListener('click', downloadPhoto);
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterButtons.forEach(b => b.classList.remove('filter-active'));
            btn.classList.add('filter-active');
            applyFilterToVideo(currentFilter);
        });
    });
    
    // Initialize the camera
    async function initCamera() {
        try {
            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Get new camera stream
            stream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
            
            video.srcObject = stream;
            video.play();
            
            // Set canvas size after video metadata loads
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                startBtn.disabled = true;
                captureBtn.disabled = false;
                
                // Update button states
                startBtn.classList.add('opacity-50', 'cursor-not-allowed');
                startBtn.classList.remove('hover:bg-primary-600', 'hover:scale-105');
                captureBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                
                // Update camera status
                cameraStatus.textContent = 'กำลังทำงาน';
                cameraStatus.classList.remove('bg-black', 'bg-red-500');
                cameraStatus.classList.add('bg-green-500');
                
                // Play animation effect
                video.classList.add('animate-fadeIn');
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            cameraStatus.textContent = 'ไม่สามารถเข้าถึงกล้องได้';
            cameraStatus.classList.remove('bg-black');
            cameraStatus.classList.add('bg-red-500');
            
            let errorMsg = 'ไม่สามารถเข้าถึงกล้องได้';
            
            if (error.name === 'NotAllowedError') {
                errorMsg += ' กรุณาอนุญาตให้เว็บไซต์เข้าถึงกล้องของคุณ';
            } else if (error.name === 'NotFoundError') {
                errorMsg += ' ไม่พบกล้องบนอุปกรณ์ของคุณ';
            } else if (error.name === 'NotReadableError') {
                errorMsg += ' กล้องของคุณอาจถูกใช้งานโดยแอปอื่นอยู่';
            }
            
            alert(errorMsg);
        }
    }
    
    // Start countdown before taking photo
    function startCountdown() {
        let count = 3;
        captureBtn.disabled = true;
        captureBtn.classList.add('opacity-50', 'cursor-not-allowed');
        captureBtn.classList.remove('hover:scale-105');
        countdown.classList.remove('hidden');
        countdown.classList.add('flex');
        countdown.textContent = count;
        
        // Add camera flash-like effect to the video container
        video.parentElement.classList.add('ring-4', 'ring-white');
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdown.textContent = count;
                // Add pulse effect to countdown
                countdown.classList.add('animate-pulse');
                setTimeout(() => countdown.classList.remove('animate-pulse'), 200);
            } else {
                clearInterval(countInterval);
                countdown.classList.remove('flex');
                countdown.classList.add('hidden');
                capturePhoto();
                
                setTimeout(() => {
                    captureBtn.disabled = false;
                    captureBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    captureBtn.classList.add('hover:scale-105');
                    video.parentElement.classList.remove('ring-4', 'ring-white');
                }, 1000);
            }
        }, 1000);
    }
    
    // Capture photo with flash effect
    function capturePhoto() {
        // Add flash effect
        const flash = document.createElement('div');
        flash.className = 'absolute inset-0 bg-white opacity-0';
        video.parentElement.appendChild(flash);
        
        // Animate the flash
        setTimeout(() => {
            flash.classList.add('opacity-70');
            setTimeout(() => {
                flash.classList.remove('opacity-70');
                setTimeout(() => {
                    video.parentElement.removeChild(flash);
                }, 300);
            }, 120);
        }, 0);
        
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
        downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        // Hide empty gallery message
        if (emptyGallery) {
            emptyGallery.style.display = 'none';
        }
    }
    
    // Add photo to gallery with animation
    function addToGallery(imageSrc) {
        const photoItem = document.createElement('div');
        photoItem.className = 'relative rounded-xl overflow-hidden shadow-lg transition transform hover:scale-105 photo-shine';
        
        // Add appearing animation
        photoItem.style.opacity = '0';
        photoItem.style.transform = 'scale(0.8)';
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.className = 'w-full h-auto block';
        
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity';
        
        const actions = document.createElement('div');
        actions.className = 'absolute inset-x-0 bottom-0 p-3 flex justify-around opacity-0 hover:opacity-100 transition-opacity duration-300';
        
        const photoDownloadBtn = document.createElement('button');
        photoDownloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            บันทึก
        `;
        photoDownloadBtn.className = 'bg-primary-500 hover:bg-primary-600 text-white text-xs py-1.5 px-3 rounded-lg transition flex items-center';
        photoDownloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadSinglePhoto(imageSrc);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ลบ
        `;
        deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded-lg transition flex items-center';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Add fade out animation
            photoItem.style.opacity = '0';
            photoItem.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                gallery.removeChild(photoItem);
                
                // Remove from stored photos
                const index = photosTaken.findIndex(photo => photo.src === imageSrc);
                if (index !== -1) {
                    photosTaken.splice(index, 1);
                }
                
                // Disable download button if no photos left
                if (photosTaken.length === 0) {
                    downloadBtn.disabled = true;
                    downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    downloadBtn.classList.remove('hover:bg-primary-600');
                    
                    // Show empty gallery message
                    if (emptyGallery) {
                        emptyGallery.style.display = 'block';
                    }
                }
            }, 300);
        });
        
        actions.appendChild(photoDownloadBtn);
        actions.appendChild(deleteBtn);
        
        photoItem.appendChild(img);
        photoItem.appendChild(overlay);
        photoItem.appendChild(actions);
        
        gallery.insertBefore(photoItem, gallery.firstChild);
        
        // Trigger animation
        setTimeout(() => {
            photoItem.style.opacity = '1';
            photoItem.style.transform = 'scale(1)';
            photoItem.style.transition = 'all 0.3s ease-out';
        }, 10);
    }
    
    // Toggle filters visibility with animation
    function toggleFilters() {
        if (filters.classList.contains('hidden')) {
            filters.classList.remove('hidden');
            filters.style.opacity = '0';
            filters.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                filters.style.opacity = '1';
                filters.style.transform = 'translateY(0)';
                filters.style.transition = 'all 0.3s ease-out';
            }, 10);
            
            filterBtn.innerHTML = `
                <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ซ่อนฟิลเตอร์
                </span>
            `;
        } else {
            filters.style.opacity = '0';
            filters.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                filters.classList.add('hidden');
            }, 300);
            
            filterBtn.innerHTML = `
                <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    ฟิลเตอร์
                </span>
            `;
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
        // For mobile devices, open image in new tab as download might not work
        if (isMobile) {
            const newTab = window.open();
            newTab.document.write(`<img src="${imageSrc}" alt="Photo" style="max-width: 100%;">`);
            newTab.document.write('<p>กดค้างที่รูปภาพแล้วเลือก "บันทึกรูปภาพ" เพื่อดาวน์โหลด</p>');
            return;
        }
        
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `photo_${new Date().getTime()}.png`;
        link.click();
        
        // Show a small notification
        showNotification('ดาวน์โหลดภาพสำเร็จ!', 'success');
    }
    
    // Download all photos as ZIP
    function downloadPhoto() {
        if (photosTaken.length === 0) return;
        
        // For mobile devices
        if (isMobile && photosTaken.length === 1) {
            downloadSinglePhoto(photosTaken[0].src);
            return;
        }
        
        if (photosTaken.length === 1) {
            // If only one photo, just download it directly
            downloadSinglePhoto(photosTaken[0].src);
            return;
        }
        
        // For multiple photos on desktop, create a notification
        showNotification(`กำลังเตรียมดาวน์โหลดภาพ ${photosTaken.length} ภาพ...`, 'info');
        
        // Download images one by one with a small delay
        photosTaken.forEach((photo, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = photo.src;
                link.download = `photo_${index+1}_${new Date().getTime()}.png`;
                link.click();
            }, index * 1000); // 1 second delay between downloads
        });
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Initialize by checking camera support
    checkCameraSupport();
});
