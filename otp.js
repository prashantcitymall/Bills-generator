document.addEventListener('DOMContentLoaded', function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const form = document.getElementById('otpForm');
    const resendBtn = document.getElementById('resendOtp');
    const timerDisplay = document.getElementById('timer');
    let countdown = 30;

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
            }
        });

        // Handle paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').split('');
            otpInputs.forEach((input, i) => {
                if (pasteData[i]) {
                    input.value = pasteData[i];
                    if (i < otpInputs.length - 1) {
                        otpInputs[i + 1].focus();
                    }
                }
            });
        });
    });

    // Start timer
    function startTimer() {
        resendBtn.disabled = true;
        countdown = 30;
        const timer = setInterval(() => {
            timerDisplay.textContent = `(${countdown}s)`;
            countdown--;
            if (countdown < 0) {
                clearInterval(timer);
                resendBtn.disabled = false;
                timerDisplay.textContent = '';
            }
        }, 1000);
    }

    // Initialize timer
    startTimer();

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        
        // Verify OTP (mock verification)
        if (otp.length === 6) {
            // Redirect to dashboard or home page after successful verification
            window.location.href = '/';
        }
    });

    // Handle resend OTP
    resendBtn.addEventListener('click', function() {
        if (!this.disabled) {
            // Resend OTP logic here
            startTimer();
        }
    });
});
