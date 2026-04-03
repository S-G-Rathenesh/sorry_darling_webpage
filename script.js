// ========================
// STATE MANAGEMENT
// ========================
const state = {
    currentScreen: 'intro', // 'intro', 'apology', 'scratch'
    noButtonAttempts: 0,
    noButtonLocked: false,
    scratchProgress: 0,
    scratchRevealed: false,
    videoEnded: false,
    videoPlayEnforcer: null,
    userInteracted: false,
};

// ========================
// DOM ELEMENTS
// ========================
const introScreen = document.getElementById('intro-screen');
const apologyScreen = document.getElementById('apology-screen');
const scratchScreen = document.getElementById('scratch-screen');
const videoContainer = document.querySelector('.video-container');
const video = document.getElementById('apology-video');
const videoCover = document.getElementById('video-cover');
const questionArea = document.getElementById('question-area');
const yesButton = document.getElementById('yes-button');
const noButton = document.getElementById('no-button');
const scratchCanvas = document.getElementById('scratch-canvas');
const scratchImage = document.getElementById('scratch-image');
const heartsContainer = document.getElementById('hearts-container');

// ========================
// SCREEN MANAGEMENT
// ========================
function switchScreen(screenName) {
    // Remove active class from all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('screen-active');
    });

    // Add active class to target screen
    let targetScreen;
    switch(screenName) {
        case 'intro':
            targetScreen = introScreen;
            break;
        case 'apology':
            targetScreen = apologyScreen;
            break;
        case 'scratch':
            targetScreen = scratchScreen;
            break;
    }

    if (targetScreen) {
        targetScreen.classList.add('screen-active');
        state.currentScreen = screenName;
    }
}

// ========================
// INTRO TO APOLOGY TRANSITION
// ========================
function initIntroTransition() {
    setTimeout(() => {
        switchScreen('apology');
        if (videoCover) {
            videoCover.classList.add('hidden');
        }
        enforceVideoPlayback();
    }, 3500); // Show intro for 3.5 seconds
}

// ========================
// VIDEO HANDLING
// ========================
function setupVideoListener() {
    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute('muted');
    video.volume = 1;
    video.setAttribute('playsinline', '');

    video.addEventListener('ended', () => {
        state.videoEnded = true;
        stopVideoEnforcer();
        if (videoCover) {
            videoCover.classList.remove('hidden');
        }
        revealQuestion();
    });

    video.addEventListener('play', () => {
        stopVideoEnforcer();
        if (videoCover) {
            videoCover.classList.add('hidden');
        }
    });

    video.addEventListener('canplay', () => {
        if (state.currentScreen === 'apology' && video.paused) {
            enforceVideoPlayback();
        }
    });

    video.addEventListener('loadedmetadata', () => {
        if (!videoContainer) return;
        const isPortraitVideo = video.videoHeight > video.videoWidth;
        videoContainer.classList.toggle('landscape', !isPortraitVideo);
    });
}

function stopVideoEnforcer() {
    if (state.videoPlayEnforcer) {
        clearInterval(state.videoPlayEnforcer);
        state.videoPlayEnforcer = null;
    }
}

function enforceVideoPlayback() {
    stopVideoEnforcer();
    if (state.videoEnded) return;

    const tryPlay = () => {
        if (state.currentScreen !== 'apology' || state.videoEnded) {
            stopVideoEnforcer();
            return;
        }

        if (video.paused) {
            video.muted = false;
            video.defaultMuted = false;
            video.volume = 1;
            video.play().catch(() => {
                // Browser may require user interaction; keep retrying briefly.
            });
        }
    };

    tryPlay();
    state.videoPlayEnforcer = setInterval(tryPlay, 1500);
}

function revealQuestion() {
    questionArea.classList.remove('hidden');
}

// ========================
// YES BUTTON HANDLER
// ========================
yesButton.addEventListener('click', () => {
    switchScreen('scratch');
    initializeScratchCard();
    startFloatingHearts();
});

// ========================
// NO BUTTON ESCAPING LOGIC
// ========================
function setupNoButton() {
    noButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (state.noButtonLocked) return;

        state.noButtonAttempts++;

        if (state.noButtonAttempts < 5) {
            // Move button to random position
            moveNoButton();
        } else if (state.noButtonAttempts === 5) {
            // Hide button after 5 attempts and show a playful message
            noButton.style.opacity = '0.3';
            noButton.style.pointerEvents = 'none';
            state.noButtonLocked = true;
            
            // Show a playful notification (could be a toast or simple visual)
            showPlayfulMessage();
        }
    });

    // Also handle mouse enter for extra playfulness on desktop
    if (!isMobileDevice()) {
        noButton.addEventListener('mouseenter', () => {
            if (state.noButtonAttempts > 2 && state.noButtonAttempts < 5) {
                moveNoButton();
                state.noButtonAttempts++;
            }
        });
    }
}

function moveNoButton() {
    const rect = noButton.getBoundingClientRect();
    const cardRect = document.querySelector('.apology-card').getBoundingClientRect();
    
    let newX, newY, attempts = 0;
    
    // Generate random position that avoids the card
    do {
        newX = Math.random() * (window.innerWidth - 100) - 50;
        newY = Math.random() * (window.innerHeight - 100) - 50;
        attempts++;
    } while (
        newX > cardRect.left - 100 && 
        newX < cardRect.right + 100 && 
        newY > cardRect.top - 100 && 
        newY < cardRect.bottom + 100 &&
        attempts < 10
    );

    noButton.style.position = 'fixed';
    noButton.style.left = newX + 'px';
    noButton.style.top = newY + 'px';
    noButton.style.zIndex = '20';
}

function showPlayfulMessage() {
    // Create a temporary playful message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 20, 147, 0.9);
        color: white;
        padding: 2rem;
        border-radius: 20px;
        font-size: 1.5rem;
        text-align: center;
        z-index: 30;
        animation: fadeInUp 0.5s ease;
        max-width: 80%;
    `;
    message.textContent = "You know you want to! 💕";
    document.body.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => message.remove(), 500);
    }, 2000);
}

// ========================
// SCRATCH CARD INITIALIZATION
// ========================
function initializeScratchCard() {
    const canvas = scratchCanvas;
    const ctx = canvas.getContext('2d');
    const wrapper = document.querySelector('.scratch-card-wrapper');

    // Set canvas size to match wrapper
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;

    // Draw gradient background with message
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#c48bff');
    gradient.addColorStop(0.5, '#9f63f2');
    gradient.addColorStop(1, '#6b35c7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add centered message
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 2rem Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch me 💜', canvas.width / 2, canvas.height / 2);

    // Setup scratch interaction
    setupScratchInteraction(canvas, ctx);
}

// ========================
// SCRATCH INTERACTION
// ========================
function setupScratchInteraction(canvas, ctx) {
    let isDrawing = false;

    function startDrawing(e) {
        isDrawing = true;
        scratch(e);
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function scratch(e) {
        if (!isDrawing && e.type !== 'touchstart') return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // Clear circular scratch area
        const radius = 30;
        ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);

        // Check scratch progress
        updateScratchProgress(canvas, ctx);
    }

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        scratch(e);
    });
    canvas.addEventListener('touchend', stopDrawing);
}

function updateScratchProgress(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let clearedPixels = 0;

    // Count transparent pixels
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) {
            clearedPixels++;
        }
    }

    const progress = (clearedPixels / (data.length / 4)) * 100;
    state.scratchProgress = progress;

    // Reveal image at 40% scratch
    if (progress > 40 && !state.scratchRevealed) {
        revealScratchImage();
    }
}

function revealScratchImage() {
    state.scratchRevealed = true;
    scratchCanvas.classList.add('hidden');
    scratchImage.classList.add('revealed');
    scratchImage.style.display = 'block';
    
    // Intensify floating hearts
    intensifyHearts();
}

// ========================
// FLOATING HEARTS
// ========================
function spawnHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = '💜';

    const x = Math.random() * window.innerWidth;
    const duration = 3 + Math.random() * 2; // 3-5 seconds
    const delay = Math.random() * 0.5;
    const tx = (Math.random() - 0.5) * 200; // -100 to 100

    heart.style.left = x + 'px';
    heart.style.bottom = '-50px';
    heart.style.setProperty('--tx', tx + 'px');
    heart.style.animationDuration = duration + 's';
    heart.style.animationDelay = delay + 's';
    heart.style.fontSize = (1.5 + Math.random() * 1.5) + 'rem';
    heart.style.opacity = '0.6';

    heartsContainer.appendChild(heart);

    // Remove heart after animation
    setTimeout(() => {
        heart.remove();
    }, (duration + delay) * 1000);
}

function startFloatingHearts() {
    // Spawn hearts at regular intervals
    const heartInterval = setInterval(() => {
        if (state.scratchRevealed) {
            // More hearts when revealed
            spawnHeart();
            spawnHeart();
        } else if (state.currentScreen === 'scratch') {
            spawnHeart();
        } else {
            clearInterval(heartInterval);
        }
    }, 500);

    // Stop after scratch is revealed and enough time has passed
    setTimeout(() => {
        clearInterval(heartInterval);
    }, 20000);
}

function intensifyHearts() {
    // Spawn hearts more frequently
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            spawnHeart();
        }, i * 100);
    }
}

// ========================
// UTILITY FUNCTIONS
// ========================
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ========================
// HANDLE WINDOW RESIZE
// ========================
window.addEventListener('resize', () => {
    // Reset NO button position if it escaped
    if (state.noButtonAttempts > 4) {
        const cardRect = document.querySelector('.apology-card').getBoundingClientRect();
        if (noButton.style.position === 'fixed') {
            // Reposition if outside bounds
            const rect = noButton.getBoundingClientRect();
            if (rect.left < 0 || rect.right > window.innerWidth || 
                rect.top < 0 || rect.bottom > window.innerHeight) {
                moveNoButton();
            }
        }
    }

    // Recalculate scratch canvas if needed
    if (state.currentScreen === 'scratch' && !state.scratchRevealed) {
        const canvas = scratchCanvas;
        const wrapper = document.querySelector('.scratch-card-wrapper');
        if (canvas.width !== wrapper.offsetWidth || canvas.height !== wrapper.offsetHeight) {
            initializeScratchCard();
        }
    }
});

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners
    setupVideoListener();
    setupNoButton();

    // Start intro transition
    initIntroTransition();

    // Keep listening for interaction so autoplay and audio unlock work reliably.
    const onInteraction = () => {
        state.userInteracted = true;
        if (state.currentScreen === 'apology') {
            if (video.paused) {
                enforceVideoPlayback();
            }
        }
    };

    document.addEventListener('pointerdown', onInteraction);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.currentScreen === 'apology' && video.paused) {
            enforceVideoPlayback();
        }
    });
});

// Add CSS animation for slideOut (used in playful message)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
`;
document.head.appendChild(style);
