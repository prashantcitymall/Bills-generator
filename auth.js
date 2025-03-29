document.addEventListener('DOMContentLoaded', function() {
    // Sign In Form
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your authentication logic here
            window.location.href = '/'; // Redirect to home page after successful login
        });

        // Forgot Password Button
        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', function() {
                window.location.href = 'forgot-password.html';
            });
        }
    }

    // Forgot Password Form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const otpDialog = document.getElementById('otpDialog');
            otpDialog.classList.add('active');
            startOtpTimer();
        });
    }

    // OTP Dialog
    const otpDialog = document.getElementById('otpDialog');
    if (otpDialog) {
        const verifyBtn = otpDialog.querySelector('.verify-otp-btn');
        const otpInputs = otpDialog.querySelectorAll('.otp-input');

        // Auto-focus and move to next input
        otpInputs.forEach((input, index) => {
            input.addEventListener('keyup', function(e) {
                const currentInput = this;
                const nextInput = this.nextElementSibling;
                const prevInput = this.previousElementSibling;

                // Clear value if not a number
                if (isNaN(currentInput.value)) {
                    currentInput.value = '';
                    return;
                }

                // Auto move to next input
                if (currentInput.value !== '' && nextInput && nextInput.hasAttribute('type')) {
                    nextInput.focus();
                }

                // Handle backspace
                if (e.key === 'Backspace' && prevInput && prevInput.hasAttribute('type')) {
                    prevInput.focus();
                    prevInput.value = '';
                }
            });

            // Handle paste
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text').split('');
                otpInputs.forEach((input, i) => {
                    if (pasteData[i] && !isNaN(pasteData[i])) {
                        input.value = pasteData[i];
                        if (i < otpInputs.length - 1) {
                            otpInputs[i + 1].focus();
                        }
                    }
                });
            });
        });

        verifyBtn.addEventListener('click', function() {
            // Add your OTP verification logic here
            window.location.href = '/'; // Redirect to home page after successful verification
        });
    }
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });

    // Form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            // Simulate sending OTP
            const email = document.getElementById('email').value;
            localStorage.setItem('userEmail', email);
            window.location.href = '/otp.html';
        });
    }

    // Google Sign In
    const googleAuth = document.querySelector('.google-auth');
    if (googleAuth) {
        googleAuth.addEventListener('click', function() {
            console.log('Google auth button clicked');
            // Redirect to Google OAuth route
            window.location.href = '/auth/google';
        });
    }

    // Check if user is logged in
    function checkAuthStatus() {
        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    // User is logged in
                    updateUIForLoggedInUser(data.user);
                }
            })
            .catch(error => {
                console.error('Error checking authentication status:', error);
            });
    }

    // Update UI for logged in user
    function updateUIForLoggedInUser(user) {
        console.log('Updating UI for logged in user:', user);
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            // Clear existing buttons
            authButtons.innerHTML = '';
            
            // Create user dropdown
            const userDropdown = document.createElement('div');
            userDropdown.className = 'user-dropdown';
            
            // Get user display name or email
            let displayName = 'User';
            if (user.displayName) {
                displayName = user.displayName;
            } else if (user.emails && user.emails.length > 0) {
                displayName = user.emails[0].value;
            } else if (user.name && user.name.givenName) {
                displayName = user.name.givenName;
            }
            
            // Create dropdown button with user name/email
            const dropdownBtn = document.createElement('button');
            dropdownBtn.className = 'user-dropdown-btn';
            dropdownBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>Hi, ${displayName}</span>
                <i class="fas fa-chevron-down"></i>
            `;
            
            // Create dropdown content
            const dropdownContent = document.createElement('div');
            dropdownContent.className = 'user-dropdown-content';
            dropdownContent.innerHTML = `
                <a href="/profile.html"><i class="fas fa-user"></i> Profile</a>
                <a href="/my-bills.html"><i class="fas fa-file-invoice"></i> My Bills</a>
                <a href="/auth/logout" id="logoutLink"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
            
            // Append elements
            userDropdown.appendChild(dropdownBtn);
            userDropdown.appendChild(dropdownContent);
            authButtons.appendChild(userDropdown);
            
            // Toggle dropdown on click
            dropdownBtn.addEventListener('click', function() {
                dropdownContent.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            window.addEventListener('click', function(e) {
                if (!e.target.matches('.user-dropdown-btn') && 
                    !e.target.matches('.user-dropdown-btn *')) {
                    dropdownContent.classList.remove('show');
                }
            });

            // Add logout functionality
            const logoutLink = document.getElementById('logoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Logging out user');
                    fetch('/auth/logout')
                        .then(() => {
                            window.location.href = '/';
                        })
                        .catch(error => {
                            console.error('Error during logout:', error);
                        });
                });
            }
        }
    }

    // Check auth status on page load
    checkAuthStatus();
});
