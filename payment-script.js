// Payment Page JavaScript

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentPage();
    setupFormValidation();
    setupPaymentMethods();
    updateCountdown();
    setupCardFormatting();
});

// Initialize payment page functionality
function initializePaymentPage() {
    console.log('Payment page loaded');
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Generate order ID (for display only; real order is created on submit)
    const orderId = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    document.getElementById('order-id').textContent = orderId;
    
    // Handle product-specific parameters from URL
    handleProductParameters();
}

// Handle product-specific parameters from URL
function handleProductParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    const productName = urlParams.get('name');
    const productPrice = urlParams.get('price');
    
    if (productId && productName && productPrice) {
        // Update product details in the order summary
        updateProductDisplay(productId, productName, productPrice);
        
        // Store product info for order creation
        window.selectedProduct = {
            id: productId,
            name: productName,
            price: parseFloat(productPrice)
        };
    } else {
        // Default product
        window.selectedProduct = {
            id: 'default',
            name: 'GenBooks Premium Collection',
            price: 399
        };
    }
}

// Update product display in order summary
function updateProductDisplay(productId, productName, productPrice) {
    const productNameEl = document.querySelector('.product-info h3');
    const productDescEl = document.querySelector('.product-info p');
    const priceEl = document.querySelector('.price-breakdown .total-amount');
    const subtotalEl = document.querySelector('.price-breakdown .subtotal');
    
    if (productNameEl) productNameEl.textContent = productName;
    if (productDescEl) productDescEl.textContent = `Product ID: ${productId}`;
    if (priceEl) priceEl.textContent = `₹${productPrice}`;
    if (subtotalEl) subtotalEl.textContent = `₹${productPrice}`;
}

// Create order in backend with current form data
async function createOrder() {
    const emailEl = document.getElementById('email');
    const firstNameEl = document.getElementById('firstName');
    const lastNameEl = document.getElementById('lastName');
    const phoneEl = document.getElementById('phone');

    const selectedProduct = window.selectedProduct || {
        id: 'default',
        name: 'GenBooks Premium Collection',
        price: 399
    };

    const payload = {
        firstName: firstNameEl?.value || '',
        lastName: lastNameEl?.value || '',
        email: emailEl?.value || '',
        phone: phoneEl?.value || '',
        totalAmount: selectedProduct.price,
        currency: 'INR',
        productId: selectedProduct.id,
        productName: selectedProduct.name
    };

    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'failed_to_create_order');
    }
    const data = await res.json();
    if (!data?.id) throw new Error('invalid_order_response');

    // Update displayed order id to the backend one
    document.getElementById('order-id').textContent = data.id;
    return data.id;
}

// Countdown timer for checkout page
function updateCountdown() {
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
        
        const checkoutHours = document.getElementById('checkout-hours');
        const checkoutMinutes = document.getElementById('checkout-minutes');
        const checkoutSeconds = document.getElementById('checkout-seconds');
        
        if (checkoutHours) checkoutHours.textContent = hours.toString().padStart(2, '0');
        if (checkoutMinutes) checkoutMinutes.textContent = minutes.toString().padStart(2, '0');
        if (checkoutSeconds) checkoutSeconds.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Setup payment method selection
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const cardDetails = document.getElementById('card-details');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            if (this.value === 'card') {
                cardDetails.style.display = 'block';
                makeCardFieldsRequired(true);
            } else {
                cardDetails.style.display = 'none';
                makeCardFieldsRequired(false);
            }
        });
    });
}

// Make card fields required or optional
function makeCardFieldsRequired(required) {
    const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
    cardFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.required = required;
        }
    });
}

// Setup card number formatting
function setupCardFormatting() {
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    
    // Format card number
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry date
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Format CVV
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// Form validation
function setupFormValidation() {
    const form = document.getElementById('checkout-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                await processPayment();
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    }
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.required && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Card number validation
    if (field.id === 'cardNumber' && value) {
        const cardNumber = value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            isValid = false;
            errorMessage = 'Please enter a valid card number';
        }
    }
    
    // Expiry date validation
    if (field.id === 'expiryDate' && value) {
        const [month, year] = value.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        if (!month || !year || month < 1 || month > 12 || 
            (parseInt(year) < currentYear) || 
            (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            isValid = false;
            errorMessage = 'Please enter a valid expiry date';
        }
    }
    
    // CVV validation
    if (field.id === 'cvv' && value) {
        if (value.length < 3 || value.length > 4) {
            isValid = false;
            errorMessage = 'Please enter a valid CVV';
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    field.style.borderColor = '#dc3545';
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.9em';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.style.borderColor = '#e9ecef';
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Validate entire form
function validateForm() {
    const form = document.getElementById('checkout-form');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Check terms and conditions
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox.checked) {
        isValid = false;
        showFieldError(termsCheckbox, 'You must agree to the terms and conditions');
    }
    
    return isValid;
}

// Process payment using backend
async function processPayment() {
    const form = document.getElementById('checkout-form');
    const submitButton = document.querySelector('.complete-purchase-btn');
    
    // Show loading state
    form.classList.add('loading');
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    submitButton.disabled = true;

    try {
        // Ensure order exists in backend with customer details
        const orderId = await createOrder();
        const provider = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';

        // Record payment
        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount: 399, currency: 'INR', provider, status: 'succeeded' })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'failed_to_record_payment');
        }

        // Reset form state
        form.classList.remove('loading');
        submitButton.innerHTML = '<i class="fas fa-lock"></i> Complete Secure Purchase - ₹399';
        submitButton.disabled = false;
        
        // Show success modal
        showSuccessModal();
        
        // Track conversion
        trackConversion();
    } catch (err) {
        console.error('Payment failed:', err);
        form.classList.remove('loading');
        submitButton.innerHTML = '<i class="fas fa-lock"></i> Complete Secure Purchase - ₹399';
        submitButton.disabled = false;
        alert('Payment failed. Please check your details and try again.');
    }
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.style.display = 'block';
    
    // Add confetti effect
    createConfetti();
}

// Close modal
function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.style.display = 'none';
    
    // Redirect to thank you page or back to main site
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Create confetti effect
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }
}

function createConfettiPiece(color) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.zIndex = '10000';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    
    document.body.appendChild(confetti);
    
    // Animate confetti
    const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 3000 + 2000,
        easing: 'cubic-bezier(0.5, 0, 0.5, 1)'
    });
    
    animation.onfinish = () => {
        confetti.remove();
    };
}

// Track conversion for analytics
function trackConversion() {
    console.log('Conversion tracked: Payment completed');
    
    // Here you can add analytics tracking
    // Example: gtag('event', 'purchase', { 'value': 399, 'currency': 'INR' });
    
    // Store conversion data
    const conversionData = {
        timestamp: new Date().toISOString(),
        amount: 399,
        currency: 'INR',
        orderId: document.getElementById('order-id').textContent,
        email: document.getElementById('email').value
    };
    
    localStorage.setItem('lastConversion', JSON.stringify(conversionData));
}

// Show terms modal
function showTerms() {
    alert('Terms & Conditions:\n\n1. Digital products are delivered instantly via email\n2. No refunds after download\n3. Personal use license only\n4. 7-day money back guarantee if not satisfied\n5. Support available via email');
}

// Show privacy policy
function showPrivacy() {
    alert('Privacy Policy:\n\n1. We collect only necessary information for order processing\n2. Your data is encrypted and secure\n3. We do not share your information with third parties\n4. You can request data deletion at any time\n5. Cookies are used for website functionality only');
}

// Handle modal clicks
document.addEventListener('click', function(e) {
    const modal = document.getElementById('success-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Handle escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('success-modal');
        if (modal.style.display === 'block') {
            closeModal();
        }
    }
});

// Auto-fill demo data (for testing)
function fillDemoData() {
    document.getElementById('firstName').value = 'John';
    document.getElementById('lastName').value = 'Doe';
    document.getElementById('email').value = 'john.doe@example.com';
    document.getElementById('phone').value = '+91 9876543210';
    document.getElementById('cardNumber').value = '4532 1234 5678 9012';
    document.getElementById('expiryDate').value = '12/25';
    document.getElementById('cvv').value = '123';
    document.getElementById('cardName').value = 'John Doe';
    document.getElementById('state').value = 'Maharashtra';
    document.getElementById('city').value = 'Mumbai';
    document.getElementById('zipCode').value = '400001';
    document.getElementById('terms').checked = true;
}

// Add demo data button for testing (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const demoButton = document.createElement('button');
    demoButton.textContent = 'Fill Demo Data';
    demoButton.style.position = 'fixed';
    demoButton.style.top = '10px';
    demoButton.style.right = '10px';
    demoButton.style.zIndex = '1000';
    demoButton.style.padding = '10px';
    demoButton.style.background = '#667eea';
    demoButton.style.color = 'white';
    demoButton.style.border = 'none';
    demoButton.style.borderRadius = '5px';
    demoButton.style.cursor = 'pointer';
    demoButton.onclick = fillDemoData;
    document.body.appendChild(demoButton);
}

// Performance optimization
function optimizePaymentPage() {
    // Preload success modal resources
    const modal = document.getElementById('success-modal');
    modal.style.display = 'block';
    modal.style.visibility = 'hidden';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.visibility = 'visible';
    }, 100);
}

// Initialize optimizations
optimizePaymentPage();