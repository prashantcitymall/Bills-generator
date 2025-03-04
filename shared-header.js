document.addEventListener('DOMContentLoaded', function() {
    // Login Modal Elements
    const loginBtn = document.querySelector('.btn-login');
    const loginModal = document.getElementById('loginModal');
    const closeLogin = document.getElementById('closeLogin');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const switchToSignup = document.querySelector('.switch-to-signup');
    const signupModal = document.getElementById('signupModal');

    // Login Modal Functions
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

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Switch to signup form
    switchToSignup.addEventListener('click', function(e) {
        e.preventDefault();
        closeLoginModal();
        signupModal.style.display = 'flex';
    });

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const phoneNumber = document.getElementById('phoneNumber').value;
        const password = document.getElementById('password').value;
        
        // Add your login logic here
        console.log('Login attempt with:', { phoneNumber, password });
    });

    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    let isDropdownOpen = false;

    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        dropdownContent.classList.toggle('show-dropdown');
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        if (isDropdownOpen) {
            isDropdownOpen = false;
            dropdownContent.classList.remove('show-dropdown');
        }
    });
});
