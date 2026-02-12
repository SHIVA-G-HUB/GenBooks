// Initialize EmailJS
(function() {
    // PASTE YOUR PUBLIC KEY HERE
    emailjs.init("yw0T3WOACj8vVLh1i");
})();

// WhatsApp Bot Toggle
function toggleBot() {
    const bubble = document.getElementById('bot-bubble');
    bubble.classList.toggle('hidden');
}

// Form Submission Logic
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const status = document.getElementById('status');
    
    btn.disabled = true;
    btn.innerText = "SENDING...";

    // These IDs come from your EmailJS Dashboard
    const serviceID = 'service_7bovf2u';
    const templateID = 'template_fuq1gxk';

    emailjs.sendForm(serviceID, templateID, this)
        .then(() => {
            status.style.color = "green";
            status.innerText = "Sent Successfully! We will email you at gentizesiva@2004gmail.com";
            btn.innerText = "SENT";
            this.reset();
        }, (err) => {
            status.style.color = "red";
            status.innerText = "Error: " + JSON.stringify(err);
            btn.disabled = false;
            btn.innerText = "TRY AGAIN";
        });
});