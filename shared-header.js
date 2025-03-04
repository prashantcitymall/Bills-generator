document.addEventListener('DOMContentLoaded', function() {
    // Dropdown functionality
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn && dropdownContent) {
        // Show dropdown on hover
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.addEventListener('mouseenter', function() {
                dropdownContent.style.opacity = '1';
                dropdownContent.style.visibility = 'visible';
                dropdownContent.style.transform = 'translateY(0)';
            });

            dropdown.addEventListener('mouseleave', function() {
                dropdownContent.style.opacity = '0';
                dropdownContent.style.visibility = 'hidden';
                dropdownContent.style.transform = 'translateY(10px)';
            });
        }
    }

    // Login Modal Elements
    const loginBtn = document.querySelector('.btn-login');
    const loginModal = document.getElementById('loginModal');
    const closeLogin = document.getElementById('closeLogin');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const switchToSignup = document.querySelector('.switch-to-signup');
    const signupModal = document.getElementById('signupModal');

    // Contact Modal Elements
    const contactBtn = document.querySelector('.contact-btn');
    const contactModal = document.getElementById('contactModal');
    const closeContact = document.getElementById('closeModal');

    // Contact Modal Functions
    if (contactBtn && contactModal && closeContact) {
        function openContactModal() {
            contactModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeContactModal() {
            contactModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        contactBtn.addEventListener('click', openContactModal);
        closeContact.addEventListener('click', closeContactModal);

        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                closeContactModal();
            }
        });
    }

    // Login Modal Functions
    if (loginBtn && loginModal && closeLogin) {
        function openLoginModal() {
            loginModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeLoginModal() {
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // Event Listeners for Login Modal
        loginBtn.addEventListener('click', openLoginModal);
        closeLogin.addEventListener('click', closeLoginModal);

        // Close modal when clicking outside
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Switch to signup form
    if (switchToSignup && signupModal) {
        switchToSignup.addEventListener('click', function(e) {
            e.preventDefault();
            closeLoginModal();
            signupModal.style.display = 'flex';
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const phoneNumber = document.getElementById('phoneNumber').value;
            const password = document.getElementById('password').value;
            
            // Add your login logic here
            console.log('Login attempt with:', { phoneNumber, password });
        });
    }
});
