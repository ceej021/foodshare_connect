document.addEventListener('DOMContentLoaded', function() {
    // Get the CTA button
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            // If user is not authenticated, show login modal
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.click();
            } else {
                // If user is authenticated, redirect to donate page
                window.location.href = '/donate/';
            }
        });
    }
}); 