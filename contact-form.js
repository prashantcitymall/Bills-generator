document.addEventListener('DOMContentLoaded', function() {
    const contactBtn = document.querySelector('.contact-btn');
    const contactModal = document.getElementById('contactModal');
    const closeModal = document.getElementById('closeModal');
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');

    // Open modal
    contactBtn.addEventListener('click', () => {
        contactModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        contactModal.classList.remove('show');
        document.body.style.overflow = ''; // Re-enable scrolling
    });

    // Close modal when clicking outside
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            contactModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Handle form submission
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Here you would typically send the form data to your server
        // For now, we'll just show the success message
        successMessage.style.display = 'block';
        
        // Reset form
        contactForm.reset();
        
        // Hide success message and close modal after 3 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
            contactModal.classList.remove('show');
            document.body.style.overflow = '';
        }, 3000);
    });

    // Add input validation and formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', (e) => {
        // Remove non-numeric characters
        let value = e.target.value.replace(/\D/g, '');
        
        // Format as (XXX) XXX-XXXX
        if (value.length >= 10) {
            value = value.slice(0, 10);
            value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
        }
        
        e.target.value = value;
    });
});
