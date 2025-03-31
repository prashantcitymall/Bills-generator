document.addEventListener('DOMContentLoaded', function() {
    // Get all form inputs
    const form = document.querySelector('.form-container');
    const inputs = form.querySelectorAll('input, select');
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();
    
    // Function to save form data to localStorage
    function saveFormData() {
        // Get all form inputs
        const travelName = document.querySelector('input[placeholder="Travel agency name"]').value;
        const travelType = document.querySelector('select[name="travel-type"]').value;
        const location = document.querySelector('input[name="location"]').value;
        const landmark = document.querySelector('input[placeholder="Landmark..."]').value;
        const address = document.querySelector('input[placeholder="Address..."]').value;
        const reportingDate = document.querySelector('input[type="date"]').value;
        const departureTime = document.querySelector('input[type="time"]').value;
        
        // Get dropping point details
        const droppingDate = document.querySelector('input[placeholder="Dropping Point Date"]').value;
        const droppingTime = document.querySelector('input[placeholder="Dropping Point Time"]').value;
        const droppingAddress = document.querySelector('input[placeholder="Enter address"]').value;
        
        // Get passenger details
        const passengerDetails = document.querySelector('input[placeholder="Name, Age, Gender"]').value;
        const numPassengers = document.querySelector('input[placeholder="Number of passengers"]').value;
        const seatNo = document.querySelector('input[placeholder="Seat number"]').value;
        
        // Get ticket details
        const ticketNo = document.querySelector('input[placeholder="Ticket number"]').value;
        const boardingPointNo = document.querySelector('input[placeholder="Boarding point number"]').value;
        const customerCareNo = document.querySelector('input[placeholder="Customer care number"]').value;
        
        // Get payment details
        const paymentMethod = document.querySelector('select[name="payment-method"]').value;
        const amount = document.querySelector('input[placeholder="Enter amount"]').value;
        const tax = document.querySelector('input[placeholder="Tax percentage"]').value;
        
        // Get selected logo
        const selectedLogo = document.querySelector('input[name="logo"]:checked').value;
        
        // Get template selection
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
        
        // Create form data object
        const formData = {
            travelName,
            travelType,
            location,
            landmark,
            address,
            reportingDate,
            departureTime,
            droppingDate,
            droppingTime,
            droppingAddress,
            passengerDetails,
            numPassengers,
            seatNo,
            ticketNo,
            boardingPointNo,
            customerCareNo,
            paymentMethod,
            amount,
            tax,
            selectedLogo,
            selectedTemplate
        };
        
        // Save to localStorage
        localStorage.setItem('ltaReceiptFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('ltaReceiptFormData');
        if (!savedData) return;
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        if (formData.travelName) document.querySelector('input[placeholder="Travel agency name"]').value = formData.travelName;
        if (formData.travelType) document.querySelector('select[name="travel-type"]').value = formData.travelType;
        if (formData.location) document.querySelector('input[name="location"]').value = formData.location;
        if (formData.landmark) document.querySelector('input[placeholder="Landmark..."]').value = formData.landmark;
        if (formData.address) document.querySelector('input[placeholder="Address..."]').value = formData.address;
        if (formData.reportingDate) document.querySelector('input[type="date"]').value = formData.reportingDate;
        if (formData.departureTime) document.querySelector('input[type="time"]').value = formData.departureTime;
        
        // Restore dropping point details
        if (formData.droppingDate) document.querySelector('input[placeholder="Dropping Point Date"]').value = formData.droppingDate;
        if (formData.droppingTime) document.querySelector('input[placeholder="Dropping Point Time"]').value = formData.droppingTime;
        if (formData.droppingAddress) document.querySelector('input[placeholder="Enter address"]').value = formData.droppingAddress;
        
        // Restore passenger details
        if (formData.passengerDetails) document.querySelector('input[placeholder="Name, Age, Gender"]').value = formData.passengerDetails;
        if (formData.numPassengers) document.querySelector('input[placeholder="Number of passengers"]').value = formData.numPassengers;
        if (formData.seatNo) document.querySelector('input[placeholder="Seat number"]').value = formData.seatNo;
        
        // Restore ticket details
        if (formData.ticketNo) document.querySelector('input[placeholder="Ticket number"]').value = formData.ticketNo;
        if (formData.boardingPointNo) document.querySelector('input[placeholder="Boarding point number"]').value = formData.boardingPointNo;
        if (formData.customerCareNo) document.querySelector('input[placeholder="Customer care number"]').value = formData.customerCareNo;
        
        // Restore payment details
        if (formData.paymentMethod) document.querySelector('select[name="payment-method"]').value = formData.paymentMethod;
        if (formData.amount) document.querySelector('input[placeholder="Enter amount"]').value = formData.amount;
        if (formData.tax) document.querySelector('input[placeholder="Tax percentage"]').value = formData.tax;
        
        // Restore selected logo
        if (formData.selectedLogo) {
            const logoRadio = document.querySelector(`input[name="logo"][value="${formData.selectedLogo}"]`);
            if (logoRadio) {
                logoRadio.checked = true;
                updateLogo(formData.selectedLogo);
            }
        }
        
        // Restore template selection
        if (formData.selectedTemplate) {
            const templateRadio = document.querySelector(`input[name="template"][value="${formData.selectedTemplate}"]`);
            if (templateRadio) templateRadio.checked = true;
        }
        
        // Update preview with loaded data
        updatePreview();
    }
    
    // Function to set up form persistence
    function setupFormPersistence() {
        // Save form data on input changes
        inputs.forEach(input => {
            input.addEventListener('input', saveFormData);
            input.addEventListener('change', saveFormData);
        });
        
        // Handle clear button to also clear localStorage
        const clearBtn = document.querySelector('.btn-clear');
        clearBtn.addEventListener('click', function() {
            localStorage.removeItem('ltaReceiptFormData');
        });
    }
    
    // Function to update preview
    function updatePreview() {
        // Get form values
        const travelName = document.querySelector('input[placeholder="Travel agency name"]').value || 'BEDI TRAVELS';
        const travelType = document.querySelector('select[name="travel-type"]').value || 'A/C Sleeper (2+1)';
        const location = document.querySelector('input[name="location"]').value || '-';
        const landmark = document.querySelector('input[placeholder="Landmark..."]').value || 'Water box road';
        const address = document.querySelector('input[placeholder="Address..."]').value || 'HIMACHAL PRADESH';
        const reportingDate = document.querySelector('input[type="date"]').value || '2025-03-05';
        const departureTime = document.querySelector('input[type="time"]').value || '22:06';
        
        // Get dropping point details
        const droppingDate = document.querySelector('input[placeholder="Dropping Point Date"]').value || '-';
        const droppingTime = document.querySelector('input[placeholder="Dropping Point Time"]').value || '-';
        const droppingAddress = document.querySelector('input[placeholder="Enter address"]').value || 'surajpur policeline greater noida';
        
        const passengerDetails = document.querySelector('input[placeholder="Name, Age, Gender"]').value || 'prashnat yadav,35,Male';
        const numPassengers = document.querySelector('input[placeholder="Number of passengers"]').value || '1';
        const seatNo = document.querySelector('input[placeholder="Seat number"]').value || 'B-12';
        const amount = document.querySelector('input[placeholder="Enter amount"]').value || '875.00';
        const tax = document.querySelector('input[placeholder="Tax percentage"]').value || '4';

        // Update preview elements
        document.getElementById('preview-travel-name').textContent = travelName;
        document.getElementById('preview-travel-type').textContent = travelType;
        
        // Update both location displays
        document.getElementById('preview-boarding-location').textContent = location;
        document.getElementById('preview-boarding-details-location').textContent = location;
        
        document.getElementById('preview-landmark').textContent = landmark;
        document.getElementById('preview-address').textContent = address;
        document.getElementById('preview-reporting-date').textContent = reportingDate;
        document.getElementById('preview-departure-time').textContent = departureTime;
        
        // Update destination info
        document.getElementById('preview-destination').textContent = droppingAddress;
        document.getElementById('preview-to-date').textContent = formatDate(reportingDate);
        
        // Update dropping point details
        document.getElementById('preview-drop-time').textContent = droppingTime;
        document.getElementById('preview-drop-date').textContent = droppingDate;
        document.getElementById('preview-drop-address').textContent = droppingAddress;
        
        document.getElementById('preview-passenger-details').textContent = passengerDetails;
        document.getElementById('preview-passengers').textContent = numPassengers;
        document.getElementById('preview-seat-no').textContent = seatNo;

        // Calculate fare details
        const totalFare = parseFloat(amount) || 875.00;
        const taxAmount = (totalFare * (parseFloat(tax) || 4)) / 100;
        const netAmount = totalFare - taxAmount;

        document.getElementById('preview-total-fare').textContent = totalFare.toFixed(2);
        document.getElementById('preview-net-amount').textContent = netAmount.toFixed(2);
        document.getElementById('preview-tax-amount').textContent = taxAmount.toFixed(2);
    }

    // Function to update logo based on selection
    function updateLogo(logoValue) {
        const logoImg = document.getElementById('selectedPlatformLogo');
        const logoPath = `images/${logoValue}.png`;
        logoImg.src = logoPath;
    }

    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Listen for logo selection changes
    const platformLogos = document.querySelectorAll('input[name="logo"]');
    platformLogos.forEach(logo => {
        logo.addEventListener('change', function() {
            updateLogo(this.value);
        });
    });

    // Set initial logo
    const defaultLogo = document.querySelector('input[name="logo"]:checked');
    if (defaultLogo) {
        updateLogo(defaultLogo.value);
    }

    // Listen for input changes
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Initial preview update
    updatePreview();

    // Listen for platform logo selection
    // const platformLogos = document.querySelectorAll('input[name="logo"]');
    // platformLogos.forEach(logo => {
    //     logo.addEventListener('change', function() {
    //         const selectedPlatformLogo = document.getElementById('selectedPlatformLogo');
    //         selectedPlatformLogo.src = `assets/${this.value}-logo.svg`;
    //     });
    // });

    // Handle generate PDF button
    document.querySelector('.btn-download').addEventListener('click', async function() {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // Save the current URL to return after login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        const ticket = document.getElementById('previewTicket');
        
        try {
            // Create canvas from the ticket element
            const canvas = await html2canvas(ticket, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: ticket.scrollWidth,
                windowHeight: ticket.scrollHeight
            });

            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculate dimensions to fit A4
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate scaling to fit content on one page
            const widthRatio = pageWidth / canvas.width;
            const heightRatio = pageHeight / canvas.height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            const canvasWidth = canvas.width * ratio;
            const canvasHeight = canvas.height * ratio;
            
            // Center the image on the page
            const offsetX = (pageWidth - canvasWidth) / 2;
            const offsetY = (pageHeight - canvasHeight) / 2;

            // Add image to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', offsetX, offsetY, canvasWidth, canvasHeight);
            
            // Save the PDF
            const fileName = `LTA_Receipt_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    });
});
