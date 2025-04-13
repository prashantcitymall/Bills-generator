// Voice Recognition Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if SpeechRecognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        return;
    }
    
    // Create voice button in header
    createVoiceButton();
    
    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only get final results to prevent duplicates
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Track state
    let isListening = false;
    let currentInput = null;
    let previousText = '';
    
    // Get the voice button
    const voiceButton = document.getElementById('headerVoiceButton');
    
    // Add event listener to voice button
    voiceButton.addEventListener('click', toggleVoiceRecognition);
    
    // Function to toggle voice recognition
    function toggleVoiceRecognition() {
        // Enable voice on supported forms
        const isGeneralBillPage = window.location.pathname.includes('general-bill.html');
        const isFuelBillPage = window.location.pathname.includes('fuel-bill.html');
        const isDriverSalaryPage = window.location.pathname.includes('driver-salary.html');
        const isRentReceiptPage = window.location.pathname.includes('rent-receipt.html');
        const isBookInvoicePage = window.location.pathname.includes('book-invoice.html');
        const isInternetBillPage = window.location.pathname.includes('internet-bill.html');
        const isRestaurantBillPage = window.location.pathname.includes('restaurant-bill.html');
        const isHotelBillPage = window.location.pathname.includes('hotel-bill.html');
        const isEcommerceBillPage = window.location.pathname.includes('ecommerce-bill.html');
        const isDonationReceiptPage = window.location.pathname.includes('donation-receipt.html');
        const isLtaReceiptPage = window.location.pathname.includes('lta-receipt.html');
        const isCourseInvoicePage = window.location.pathname.includes('course-invoice.html');
        const isMedicalBillPage = window.location.pathname.includes('medical-bill.html');
        
        const isSupportedPage = isGeneralBillPage || isFuelBillPage || isDriverSalaryPage || 
                               isRentReceiptPage || isBookInvoicePage || isInternetBillPage ||
                               isRestaurantBillPage || isHotelBillPage || isEcommerceBillPage ||
                               isDonationReceiptPage || isLtaReceiptPage || isCourseInvoicePage ||
                               isMedicalBillPage;
        
        if (!isSupportedPage) {
            showNotification('Voice recognition is only available on selected bill forms');
            return;
        }
        
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }
    
    // Function to start listening
    function startListening() {
        try {
            recognition.start();
            isListening = true;
            voiceButton.classList.add('active');
            showNotification('Voice recognition activated. Click on any input field and speak.');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            showNotification('Error starting voice recognition');
        }
    }
    
    // Function to stop listening
    function stopListening() {
        recognition.stop();
        isListening = false;
        voiceButton.classList.remove('active');
        currentInput = null;
        showNotification('Voice recognition deactivated');
    }
    
    // Handle results from speech recognition
    recognition.onresult = function(event) {
        if (!currentInput) return;
        
        // Get the final result
        const result = event.results[event.results.length - 1];
        if (!result.isFinal) return;
        
        const transcript = result[0].transcript.trim();
        if (!transcript) return;
        
        // Process the transcript
        processTranscript(transcript);
    };
    
    // Process transcript based on input type
    function processTranscript(transcript) {
        if (!currentInput) return;
        
        // Clean the transcript
        let text = removeDuplicateWords(transcript);
        
        // Handle different input types
        if (currentInput.type === 'number') {
            // Remove all spaces for numbers
            text = text.replace(/\s+/g, '');
            const numberMatch = text.match(/\d+(\.\d+)?/g);
            if (numberMatch) {
                currentInput.value = numberMatch[0];
            }
        } else if (currentInput.type === 'date') {
            // Try to parse date from speech
            const dateMatch = text.match(/\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}/);
            if (dateMatch) {
                currentInput.value = dateMatch[0];
            }
        } else if (currentInput.tagName.toLowerCase() === 'select') {
            // Try to match option text
            const options = Array.from(currentInput.options);
            const matchedOption = options.find(option => 
                option.text.toLowerCase().includes(text.toLowerCase())
            );
            
            if (matchedOption) {
                currentInput.value = matchedOption.value;
            }
        } else {
            // For text inputs and textareas
            // Check for letter-by-letter dictation
            if (text.toLowerCase().includes('letter') || text.toLowerCase().includes('spell')) {
                const letterMatch = text.match(/letter ([a-z])/i);
                if (letterMatch) {
                    currentInput.value += letterMatch[1];
                }
            } else {
                // Normal text input
                if (currentInput.value === '') {
                    // Capitalize first letter for new input
                    text = capitalizeFirstLetter(text);
                    currentInput.value = text;
                } else {
                    // Check if we need to capitalize (after period, question mark, etc.)
                    const lastChar = currentInput.value.trim().slice(-1);
                    if (lastChar === '.' || lastChar === '?' || lastChar === '!') {
                        text = capitalizeFirstLetter(text);
                    }
                    
                    // Add space only if needed
                    currentInput.value += ' ' + text;
                }
                
                // Trim any extra spaces
                currentInput.value = currentInput.value.trim();
            }
        }
        
        // Trigger input event to update form
        const event = new Event('input', { bubbles: true });
        currentInput.dispatchEvent(event);
        
        // Also trigger change event for select elements
        if (currentInput.tagName.toLowerCase() === 'select') {
            const changeEvent = new Event('change', { bubbles: true });
            currentInput.dispatchEvent(changeEvent);
        }
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(text) {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    // Function to remove duplicate adjacent words
    function removeDuplicateWords(text) {
        const words = text.split(/\s+/);
        const result = [];
        
        for (let i = 0; i < words.length; i++) {
            // Skip if this word is the same as the previous one
            if (i > 0 && words[i].toLowerCase() === words[i-1].toLowerCase()) {
                continue;
            }
            result.push(words[i]);
        }
        
        return result.join(' ');
    }
    
    // Handle speech recognition errors
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            // No speech detected, continue listening
            return;
        }
        
        stopListening();
        showNotification('Voice recognition error: ' + event.error);
    };
    
    // Handle when recognition ends
    recognition.onend = function() {
        // If still in listening mode but recognition ended, restart it
        if (isListening) {
            try {
                recognition.start();
            } catch (error) {
                console.error('Error restarting speech recognition:', error);
                stopListening();
            }
        }
    };
    
    // Add click event listeners to all input fields on supported forms
    function setupInputListeners() {
        // Only setup listeners on supported forms
        const isGeneralBillPage = window.location.pathname.includes('general-bill.html');
        const isFuelBillPage = window.location.pathname.includes('fuel-bill.html');
        const isDriverSalaryPage = window.location.pathname.includes('driver-salary.html');
        const isRentReceiptPage = window.location.pathname.includes('rent-receipt.html');
        const isBookInvoicePage = window.location.pathname.includes('book-invoice.html');
        const isInternetBillPage = window.location.pathname.includes('internet-bill.html');
        const isRestaurantBillPage = window.location.pathname.includes('restaurant-bill.html');
        const isHotelBillPage = window.location.pathname.includes('hotel-bill.html');
        const isEcommerceBillPage = window.location.pathname.includes('ecommerce-bill.html');
        const isDonationReceiptPage = window.location.pathname.includes('donation-receipt.html');
        const isLtaReceiptPage = window.location.pathname.includes('lta-receipt.html');
        const isCourseInvoicePage = window.location.pathname.includes('course-invoice.html');
        const isMedicalBillPage = window.location.pathname.includes('medical-bill.html');
        
        const isSupportedPage = isGeneralBillPage || isFuelBillPage || isDriverSalaryPage || 
                               isRentReceiptPage || isBookInvoicePage || isInternetBillPage ||
                               isRestaurantBillPage || isHotelBillPage || isEcommerceBillPage ||
                               isDonationReceiptPage || isLtaReceiptPage || isCourseInvoicePage ||
                               isMedicalBillPage;
        
        if (!isSupportedPage) return;
        
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('click', function() {
                if (isListening) {
                    // Reset recognition when changing input fields
                    if (currentInput !== this) {
                        // Stop and restart recognition to clear buffer
                        recognition.stop();
                        setTimeout(() => {
                            try {
                                recognition.start();
                            } catch (error) {
                                console.error('Error restarting speech recognition:', error);
                            }
                        }, 100);
                    }
                    
                    currentInput = this;
                    showNotification('Now listening for: ' + (this.labels[0]?.textContent || 'Selected field'));
                }
            });
        });
    }
    
    // Create notification function
    function showNotification(message) {
        // Get the voice button position
        const voiceButton = document.getElementById('headerVoiceButton');
        if (!voiceButton) return;
        
        // Check if notification container exists
        let notificationContainer = document.getElementById('voiceNotificationContainer');
        
        if (!notificationContainer) {
            // Create notification container
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'voiceNotificationContainer';
            notificationContainer.style.position = 'absolute';
            notificationContainer.style.zIndex = '9999';
            document.body.appendChild(notificationContainer);
        }
        
        // Position the container near the voice button
        const buttonRect = voiceButton.getBoundingClientRect();
        notificationContainer.style.top = (buttonRect.bottom + window.scrollY) + 'px';
        notificationContainer.style.left = (buttonRect.left + window.scrollX - 250) + 'px'; // Position to the left of the button
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'voice-notification';
        notification.style.background = '#f5f5f5';
        notification.style.color = '#333';
        notification.style.padding = '1.2rem';
        notification.style.borderRadius = '0.5rem';
        notification.style.marginTop = '10px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.borderLeft = '4px solid #ff5a5f';
        notification.style.width = '300px';
        notification.style.maxWidth = '100%';
        
        // Add icon
        notification.innerHTML = `
            <i class="fas fa-microphone" style="color: #ff5a5f; margin-right: 10px; font-size: 1.4rem;"></i>
            <span>${message}</span>
        `;
        
        // Add to container
        notificationContainer.innerHTML = ''; // Clear previous notifications
        notificationContainer.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
    
    // Function to create voice button in header
    function createVoiceButton() {
        const navbar = document.querySelector('.navbar');
        const navRight = document.querySelector('.nav-right');
        
        if (!navbar) return;
        
        // Create voice button
        const voiceButton = document.createElement('button');
        voiceButton.id = 'headerVoiceButton';
        voiceButton.className = 'voice-button';
        voiceButton.setAttribute('aria-label', 'Toggle voice recognition');
        voiceButton.innerHTML = `
            <i class="fas fa-microphone"></i>
            <span class="voice-tooltip">Voice Input</span>
        `;
        
        // Find the dropdown to insert before
        const dropdown = navRight.querySelector('.dropdown');
        
        if (dropdown) {
            // Insert before the dropdown
            navRight.insertBefore(voiceButton, dropdown);
        } else {
            // Fallback: append to navRight
            navRight.appendChild(voiceButton);
        }
    }
    
    // Setup input listeners after a short delay to ensure DOM is fully loaded
    setTimeout(setupInputListeners, 500);
});
