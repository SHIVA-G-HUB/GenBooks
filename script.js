// Countdown Timer Functionality
function updateCountdown() {
    // Set the target date (24 hours from now)
    const now = new Date().getTime();
    const targetDate = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    function updateTimer() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            // Timer expired, reset to 24 hours
            const newTarget = new Date().getTime() + (24 * 60 * 60 * 1000);
            updateCountdownDisplay(newTarget - new Date().getTime());
            return;
        }
        
        updateCountdownDisplay(distance);
    }
    
    function updateCountdownDisplay(distance) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update banner countdown
        const bannerHours = document.getElementById('hours');
        const bannerMinutes = document.getElementById('minutes');
        const bannerSeconds = document.getElementById('seconds');
        
        if (bannerHours) bannerHours.textContent = hours.toString().padStart(2, '0');
        if (bannerMinutes) bannerMinutes.textContent = minutes.toString().padStart(2, '0');
        if (bannerSeconds) bannerSeconds.textContent = seconds.toString().padStart(2, '0');
        
        // Update hero section timer
        const timerNumbers = document.querySelectorAll('.timer-number');
        if (timerNumbers.length >= 3) {
            timerNumbers[0].textContent = hours.toString().padStart(2, '0');
            timerNumbers[1].textContent = minutes.toString().padStart(2, '0');
            timerNumbers[2].textContent = seconds.toString().padStart(2, '0');
        }
    }
    
    // Update immediately
    updateTimer();
    
    // Update every second
    setInterval(updateTimer, 1000);
}

// Navigation to Payment Page
function goToPayment() {
    // Create and navigate to payment page
    window.location.href = 'payment.html';
}

// Advanced Smooth Scrolling for Internal Links
function smoothScroll(target, offset = 80) {
    const element = document.querySelector(target);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        // Custom easing function for smoother scrolling
        const startPosition = window.pageYOffset;
        const distance = offsetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) * 0.5, 1000); // Max 1 second
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function (ease-out-cubic)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            window.scrollTo(0, startPosition + (distance * ease));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
}

// Enhanced scroll to section functionality
function scrollToSection(sectionId) {
    smoothScroll(`#${sectionId}`, 100);
}

// Add Click Tracking and Analytics
function trackClick(elementName) {
    console.log(`User clicked: ${elementName}`);
    // Here you can add analytics tracking code
    // Example: gtag('event', 'click', { 'element': elementName });
}

// Add hover effects and interactions
function addInteractiveEffects() {
    // Add click tracking to all CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button, .final-cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', () => {
            trackClick('CTA Button');
            // Add loading state
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            button.disabled = true;
            
            setTimeout(() => {
                goToPayment();
            }, 1000);
        });
    });
    
    // Add click tracking to category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            trackClick('Category Card');
            goToPayment();
        });
    });
    
    // Optimized scroll effects with cached elements and single handler
    let ticking = false;
    let lastScrollTop = 0;
    
    // Cache DOM elements to avoid repeated queries
    const cachedElements = {
        progressBar: null,
        hero: null,
        benefitsSection: null,
        categoriesSection: null,
        scrollToTopBtn: null,
        flashBanner: null,
        paymentBar: null
    };
    
    // Initialize cached elements
    function initCachedElements() {
        cachedElements.progressBar = document.getElementById('scrollProgress');
        cachedElements.hero = document.querySelector('.hero');
        cachedElements.benefitsSection = document.querySelector('.benefits-section');
        cachedElements.categoriesSection = document.querySelector('.categories-section');
        cachedElements.scrollToTopBtn = document.getElementById('scrollToTop');
        cachedElements.flashBanner = document.querySelector('.flash-banner');
        cachedElements.paymentBar = document.getElementById('fixedPaymentBar');
    }

    function optimizedScrollHandler() {
        const scrolled = window.pageYOffset;
        const scrollDirection = scrolled > lastScrollTop ? 'down' : 'up';
        const scrollProgress = Math.min(scrolled / (document.documentElement.scrollHeight - window.innerHeight), 1);
        const windowHeight = window.innerHeight;
        
        // Update scroll progress indicator
        if (cachedElements.progressBar) {
            cachedElements.progressBar.style.width = `${scrollProgress * 100}%`;
        }
        
        // Hero parallax with scaling effect (only when visible)
        if (cachedElements.hero && scrolled < windowHeight) {
            const rate = scrolled * -0.3; // Reduced parallax intensity
            const scale = 1 + (scrolled * 0.0001); // Reduced scaling
            cachedElements.hero.style.transform = `translate3d(0, ${rate}px, 0) scale(${scale})`;
        }
        
        // Benefits section parallax (reduced intensity)
        if (cachedElements.benefitsSection) {
            const sectionOffset = scrolled * -0.05; // Reduced from -0.1
            const opacity = Math.max(0.5, 1 - (scrolled / windowHeight) * 0.3); // Less aggressive opacity
            cachedElements.benefitsSection.style.transform = `translate3d(0, ${sectionOffset}px, 0)`;
            cachedElements.benefitsSection.style.opacity = opacity;
        }
        
        // Categories section parallax (reduced intensity)
        if (cachedElements.categoriesSection) {
            const sectionOffset = scrolled * -0.02; // Reduced from -0.05
            cachedElements.categoriesSection.style.transform = `translate3d(0, ${sectionOffset}px, 0)`;
        }
        
        // Scroll-to-top button
        if (cachedElements.scrollToTopBtn) {
            if (scrolled > 300) {
                cachedElements.scrollToTopBtn.style.opacity = '1';
                cachedElements.scrollToTopBtn.style.visibility = 'visible';
                cachedElements.scrollToTopBtn.style.transform = 'translate3d(0, 0, 0) scale(1)';
            } else {
                cachedElements.scrollToTopBtn.style.opacity = '0';
                cachedElements.scrollToTopBtn.style.visibility = 'hidden';
                cachedElements.scrollToTopBtn.style.transform = 'translate3d(0, 20px, 0) scale(0.8)';
            }
        }
        
        // Flash banner behavior
        if (cachedElements.flashBanner) {
            if (scrollDirection === 'down' && scrolled > 100) {
                cachedElements.flashBanner.style.transform = 'translate3d(0, -100%, 0)';
                cachedElements.flashBanner.style.opacity = '0';
            } else if (scrollDirection === 'up' || scrolled <= 100) {
                cachedElements.flashBanner.style.transform = 'translate3d(0, 0, 0)';
                cachedElements.flashBanner.style.opacity = '1';
            }
        }
        
        // Payment bar visibility (consolidated from separate handler)
        if (cachedElements.paymentBar) {
            const isAtBottom = (windowHeight + scrolled) >= (document.documentElement.scrollHeight - 100);
            
            if (scrollDirection === 'up' || isAtBottom || scrolled < 100) {
                cachedElements.paymentBar.style.transform = 'translate3d(0, 0, 0)';
                cachedElements.paymentBar.style.opacity = '1';
            } else if (scrollDirection === 'down' && scrolled > 200) {
                cachedElements.paymentBar.style.transform = 'translate3d(0, 100%, 0)';
                cachedElements.paymentBar.style.opacity = '0.8';
            }
        }
        
        // Removed expensive backdrop-filter for better performance
        
        lastScrollTop = scrolled;
        ticking = false;
    }

    // Single optimized scroll listener with proper throttling
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(optimizedScrollHandler);
            ticking = true;
        }
    }, { passive: true });
    
    // Enhanced scroll-triggered animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Add staggered animation for child elements
                const children = entry.target.querySelectorAll('.benefit-card, .category-card, .testimonial-card');
                children.forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('animate-in');
                    }, index * 100);
                });
            }
        });
    }, observerOptions);
    
    // Initialize scroll animations
    function initScrollAnimations() {
        // Add animation classes to elements
        const benefitCards = document.querySelectorAll('.benefit-card');
        benefitCards.forEach((card, index) => {
            card.classList.add(index % 2 === 0 ? 'scroll-animate-left' : 'scroll-animate-right');
        });
        
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.classList.add('scroll-animate-scale');
        });
        
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        testimonialCards.forEach(card => {
            card.classList.add('scroll-animate');
        });
        
        const problemItems = document.querySelectorAll('.problem-item');
        problemItems.forEach(item => {
            item.classList.add('scroll-animate');
        });
        
        // Observe sections for animations
        const sectionsToAnimate = document.querySelectorAll('.benefits-section, .categories-section, .testimonials-section, .final-cta-section');
        sectionsToAnimate.forEach(section => {
            animationObserver.observe(section);
        });
    }
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Add enhanced hover effects to interactive elements
    function addEnhancedHoverEffects() {
        const interactiveElements = document.querySelectorAll('.benefit-card, .category-card, .testimonial-card, .cta-button, .final-cta-button, .price-option');
        interactiveElements.forEach(element => {
            element.classList.add('enhanced-hover');
        });
    }
    
    addEnhancedHoverEffects();
    
    // Initialize cached elements for scroll performance
    initCachedElements();
    
    // Initialize fixed payment bar
    initFixedPaymentBar();
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.benefit-card, .category-card, .testimonial-card, .problem-item');
    animateElements.forEach(element => {
        animationObserver.observe(element);
    });
}

// Fixed Payment Bar Functionality (scroll handling moved to main handler)
function initFixedPaymentBar() {
    const paymentBar = document.getElementById('fixedPaymentBar');
    
    // Auto-show payment bar after initial delay
    setTimeout(() => {
        if (paymentBar) {
            paymentBar.style.transform = 'translate3d(0, 0, 0)';
            paymentBar.style.opacity = '1';
        }
    }, 2000);
}

function togglePaymentBar() {
    const paymentBar = document.getElementById('fixedPaymentBar');
    const toggleIcon = document.querySelector('#paymentBarToggle i');
    
    paymentBar.classList.toggle('minimized');
    
    if (paymentBar.classList.contains('minimized')) {
        toggleIcon.style.transform = 'rotate(180deg)';
    } else {
        toggleIcon.style.transform = 'rotate(0deg)';
    }
}

// Social Proof Animation
function animateSocialProof() {
    const names = ['Rohan from Chennai', 'Priya from Mumbai', 'Aarav from Delhi', 'Anjali from Bangalore', 'Vikram from Pune'];
    const timeAgo = ['28 min ago', '15 min ago', '42 min ago', '1 hour ago', '35 min ago'];
    
    const socialProofElement = document.querySelector('.recent-purchase');
    if (socialProofElement) {
        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % names.length;
            socialProofElement.style.opacity = '0';
            
            setTimeout(() => {
                socialProofElement.textContent = `${names[currentIndex]} just purchased • ${timeAgo[currentIndex]}`;
                socialProofElement.style.opacity = '1';
            }, 300);
        }, 5000);
    }
}

// Add floating elements animation
function addFloatingAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        
        .benefit-icon {
            animation: float 3s ease-in-out infinite;
        }
        
        .benefit-card:nth-child(2) .benefit-icon {
            animation-delay: 0.5s;
        }
        
        .benefit-card:nth-child(3) .benefit-icon {
            animation-delay: 1s;
        }
        
        .benefit-card:nth-child(4) .benefit-icon {
            animation-delay: 1.5s;
        }
    `;
    document.head.appendChild(style);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateCountdown();
    addInteractiveEffects();
    animateSocialProof();
    addFloatingAnimation();
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    console.log('Sales application loaded successfully!');
});

// Handle form submissions and user interactions
function handleFormSubmission(formData) {
    // This function can be extended to handle actual form submissions
    console.log('Form submitted:', formData);
    
    // Simulate processing
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, message: 'Payment processed successfully!' });
        }, 2000);
    });
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Press 'P' to go to payment
    if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.altKey) {
        goToPayment();
    }
    
    // Press 'Escape' to scroll to top
    if (e.key === 'Escape') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Add mobile touch gestures
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchStartY - touchEndY;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        const scrollAmount = Math.min(Math.abs(swipeDistance) * 2, 400);
        
        if (swipeDistance > 0) {
            // Swipe up - scroll down
            window.scrollBy({ 
                top: scrollAmount, 
                behavior: 'smooth' 
            });
        } else {
            // Swipe down - scroll up
            window.scrollBy({ 
                top: -scrollAmount, 
                behavior: 'smooth' 
            });
        }
    }
}

// Performance optimization
function optimizePerformance() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Preload critical resources
    const criticalResources = [
        'payment.html',
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.includes('.css') ? 'style' : 'document';
        document.head.appendChild(link);
    });
}

// Initialize performance optimizations
optimizePerformance();