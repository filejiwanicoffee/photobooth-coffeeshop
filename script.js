class CoffeeShopPhotoBooth {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.captureBtn = document.getElementById('captureBtn');
        this.timerSelect = document.getElementById('timerSelect');
        this.mirrorBtn = document.getElementById('mirrorBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.timerOverlay = document.getElementById('timerOverlay');
        this.timerText = document.getElementById('timerText');
        this.filterOverlay = document.getElementById('filterOverlay');
        this.gallery = document.getElementById('gallery');
        this.photoGrid = document.getElementById('photoGrid');
        this.newSessionBtn = document.getElementById('newSessionBtn');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.app = document.getElementById('app');

        this.isMirror = true;
        this.currentFilter = 'none';
        this.photos = [];
        this.timerDuration = 3;
        this.isCapturing = false;

        this.init();
    }

    async init() {
        // Hide loading after 3s
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
            this.app.classList.remove('hidden');
            this.startCamera();
        }, 3000);

        this.bindEvents();
    }

    bindEvents() {
        // Capture button
        this.captureBtn.addEventListener('click', () => this.capture());

        // Timer select
        this.timerSelect.addEventListener('change', (e) => {
            this.timerDuration = parseInt(e.target.value);
        });

        // Mirror button
        this.mirrorBtn.addEventListener('click', () => {
            this.isMirror = !this.isMirror;
            this.updateMirror();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // New session
        this.newSessionBtn.addEventListener('click', () => this.newSession());
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 1920 },
                    facingMode: 'user'
                }
            });
            this.video.srcObject = stream;
            this.video.onloadedmetadata = () => {
                this.updateMirror();
            };
        } catch (err) {
            console.error('Camera error:', err);
            alert('Camera access denied. Please allow camera permission.');
        }
    }

    updateMirror() {
        const scale = this.isMirror ? -1 : 1;
        this.video.style.transform = `scaleX(${scale})`;
        this.mirrorBtn.textContent = this.isMirror ? '🔄 Mirror' : '🔄 Normal';
        this.mirrorBtn.style.background = this.isMirror ? '#213B2A' : '#FFFFFF';
        this.mirrorBtn.style.color = this.isMirror ? '#FFFFFF' : '#213B2A';
    }

    setFilter(filterName) {
        this.currentFilter = filterName;
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filterName}"]`).classList.add('active');
        
        // Apply filter to video
        this.video.style.filter = this.getFilterCSS(filterName);
    }

    getFilterCSS(filter) {
        const filters = {
            none: 'none',
            coffee: 'sepia(0.3) contrast(1.1) brightness(1.05) saturate(1.2)',
            latte: 'warmth(1.2) contrast(1.1) brightness(1.1) saturate(1.3)',
            espresso: 'grayscale(0.4) contrast(1.3) brightness(0.9)',
            cappuccino: 'sepia(0.2) contrast(1.2) brightness(1.15) blur(0.5px)',
            mocha: 'sepia(0.4) hue-rotate(20deg) contrast(1.1)',
            matcha: 'hue-rotate(120deg) saturate(1.4) brightness(1.1)',
            caramel: 'sepia(0.5) contrast(1.2) brightness(1.05) saturate(1.1)',
            vintage: 'sepia(0.6) contrast(1.1) brightness(0.95) saturate(0.8)',
            bokeh: 'blur(1px) contrast(1.3) brightness(1.2)'
        };
        return filters[filter] || 'none';
    }

    async capture() {
        if (this.isCapturing) return;
        
        this.isCapturing = true;
        this.captureBtn.disabled = true;
        this.captureBtn.textContent = '⏳ Processing...';

        // Start timer
        await this.startTimer();

        // Capture photo
        this.canvas.width = 1280;
        this.canvas.height = 1920;
        const ctx = this.canvas.getContext('2d');
        
        ctx.save();
        if (this.isMirror) {
            ctx.scale(-1, 1);
            ctx.drawImage(this.video, -1280, 0, 1280, 1920);
        } else {
            ctx.drawImage(this.video, 0, 0, 1280, 1920);
        }
        ctx.restore();

        // Apply filter to canvas
        ctx.filter = this.getFilterCSS(this.currentFilter);
        ctx.drawImage(this.canvas, 0, 0);

        // Convert to image
        const photoData = this.canvas.toDataURL('image/jpeg', 0.9);
        this.savePhoto(photoData);

        // Reset after 3s delay
        setTimeout(() => {
            this.resetCapture();
        }, 3000);
    }

    async startTimer() {
        return new Promise((resolve) => {
            this.timerOverlay.classList.remove('hidden');
            let timeLeft = this.timerDuration;

            const timerInterval = setInterval(() => {
                this.timerText.textContent = timeLeft;
                timeLeft--;

                if (timeLeft < 0) {
                    clearInterval(timerInterval);
                    this.timerOverlay.classList.add('hidden');
                    resolve();
                }
            }, 1000);
        });
    }

    savePhoto(photoData) {
        this.photos.unshift(photoData);
        
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.innerHTML = `<img src="${photoData}" alt="Photo">`;
        this.photoGrid.prepend(photoDiv);

        // Show gallery if first photo
        if (this.photos.length === 1) {
            this.showGallery();
        }

        // Keep only last 10 photos
        if (this.photos.length > 10) {
            this.photos.pop();
            this.photoGrid.removeChild(this.photoGrid.lastElementChild);
        }
    }

    showGallery() {
        document.querySelector('.camera-container').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        this.gallery.classList.remove('hidden');
    }

    resetCapture() {
        this.isCapturing = false;
        this.captureBtn.disabled = false;
        this.captureBtn.textContent = '📸 TAKE PHOTO';
    }

    newSession() {
        this.photos = [];
        this.photoGrid.innerHTML = '';
        this.gallery.classList.add('hidden');
        document.querySelector('.camera-container').style.display = 'block';
        document.querySelector('.controls').style.display = 'block';
        this.resetCapture();
    }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoffeeShopPhotoBooth();
});
