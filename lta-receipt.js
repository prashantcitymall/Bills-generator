document.addEventListener('DOMContentLoaded', function() {
    // Get all form inputs
    const form = document.querySelector('.form-container');
    const inputs = form.querySelectorAll('input, select');
    
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
