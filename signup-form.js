document.addEventListener('DOMContentLoaded', function() {
    const signupBtn = document.querySelector('.btn-signup');
    const signupModal = document.getElementById('signupModal');
    const closeSignup = document.getElementById('closeSignup');
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthMeter = document.getElementById('strengthMeter');
    const passwordMatch = document.getElementById('passwordMatch');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const phoneInput = document.getElementById('signupPhone');

    // Open modal
    signupBtn.addEventListener('click', () => {
        signupModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeSignup.addEventListener('click', () => {
        signupModal.classList.remove('show');
        document.body.style.overflow = '';
    });

    // Close modal when clicking outside
    signupModal.addEventListener('mousedown', (e) => {
        if (e.target === signupModal) {
            signupModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Prevent modal from closing when clicking inside the form
    document.querySelector('.signup-form-container').addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    // Ensure form inputs are clickable
    const formInputs = signupForm.querySelectorAll('input');
    formInputs.forEach(input => {
        input.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    toggleConfirmPassword.addEventListener('click', () => {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        toggleConfirmPassword.classList.toggle('fa-eye');
        toggleConfirmPassword.classList.toggle('fa-eye-slash');
    });

    // Check password strength
    function checkPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;

        strengthMeter.className = 'strength-meter';
        if (strength >= 4) {
            strengthMeter.classList.add('strength-strong');
        } else if (strength >= 2) {
            strengthMeter.classList.add('strength-medium');
        } else if (strength >= 1) {
            strengthMeter.classList.add('strength-weak');
        }
    }

    // Check password match
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword) {
            if (password === confirmPassword) {
                passwordMatch.textContent = 'Passwords match';
                passwordMatch.className = 'password-match-indicator match';
            } else {
                passwordMatch.textContent = 'Passwords do not match';
                passwordMatch.className = 'password-match-indicator mismatch';
            }
        } else {
            passwordMatch.className = 'password-match-indicator';
        }
    }

    passwordInput.addEventListener('input', () => {
        checkPasswordStrength(passwordInput.value);
        checkPasswordMatch();
    });

    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    // Format phone number
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 10) {
            value = value.slice(0, 10);
            value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
        }
        
        e.target.value = value;
    });

    // Handle form submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validate form
        let isValid = true;
        const inputs = signupForm.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            const group = input.closest('.form-group');
            group.classList.remove('error');
            
            if (!input.value) {
                group.classList.add('error');
                isValid = false;
            }
            
            if (input.type === 'email' && !input.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                group.classList.add('error');
                isValid = false;
            }
            
            if (input.id === 'signupPassword' && input.value.length < 8) {
                group.classList.add('error');
                isValid = false;
            }
            
            if (input.id === 'confirmPassword' && input.value !== passwordInput.value) {
                group.classList.add('error');
                isValid = false;
            }
        });

        if (isValid) {
            // Here you would typically send the form data to your server
            console.log('Form submitted successfully');
            signupForm.reset();
            signupModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
});
