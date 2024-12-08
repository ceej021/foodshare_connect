document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    initializeUserMenu();
    initializeLogout();
    initializeMobileMenu();
    initializeDonateLink();
});

function initializeDonateLink() {
    const donateLink = document.querySelector('a[href="/donate/"]');
    if (donateLink) {
        donateLink.addEventListener('click', function(e) {
            // Check if user is not authenticated (login button exists)
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                e.preventDefault();
                // Show login modal
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    showModal(loginModal);
                }
            }
        });
    }
}

function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });

        // Close mobile menu when window is resized above mobile breakpoint
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('active');
            }
        });
    }
}

function initializeModals() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const closeBtns = document.querySelectorAll('.close');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    // Helper function to show modal
    window.showModal = function(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Focus first input in modal
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Helper function to hide modal
    function hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Helper function to hide all modals
    function hideAllModals() {
        [loginModal, signupModal].forEach(modal => {
            if (modal) hideModal(modal);
        });
    }

    // Open modals
    loginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(loginModal);
    });

    signupBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(signupModal);
    });

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            hideAllModals();
        });
    });

    // Switch between modals
    switchToSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(loginModal);
        showModal(signupModal);
    });

    switchToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(signupModal);
        showModal(loginModal);
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });

    // Prevent modal content clicks from closing modal
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

function initializeUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const notificationBtn = document.querySelector('.notification-btn');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    const markAllReadBtn = document.querySelector('.mark-all-read');

    if (userMenu && dropdownMenu) {
        // Toggle dropdown on user menu click
        userMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            dropdownMenu.style.display = 'none';
        });

        // Prevent dropdown from closing when clicking inside it
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Notification handling
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
            
            // Hide user menu dropdown if open
            if (dropdownMenu) {
                dropdownMenu.style.display = 'none';
            }
        });

        // Mark all as read functionality
        markAllReadBtn?.addEventListener('click', function() {
            const unreadItems = notificationDropdown.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update notification count
            const countBadge = document.querySelector('.notification-count');
            if (countBadge) {
                countBadge.textContent = '0';
            }
        });

        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        });

        // Prevent dropdown from closing when clicking inside
        notificationDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function initializeLogout() {
    const logoutLinks = document.querySelectorAll('.logout');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.getAttribute('href');
        });
    });
} 