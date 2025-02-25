document.addEventListener('DOMContentLoaded', function() {
    // Initialize dates with current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fromDate').value = today;
    document.getElementById('toDate').value = today;

    // Update preview when form fields change
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('input', updatePreview);
    });

    // Clear form
    document.getElementById('clearBtn').addEventListener('click', function() {
        const form = document.querySelector('.form-container');
        const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Reset dates to today
        document.getElementById('fromDate').value = today;
        document.getElementById('toDate').value = today;
        
        // Reset radio buttons to defaults
        document.querySelector('input[name="template"][value="template4"]').checked = true;
        document.querySelector('input[name="signatureType"][value="url"]').checked = true;
        
        // Reset checkboxes
        document.getElementById('generateZip').checked = false;
        document.getElementById('authorizedLogo').checked = false;
        
        updatePreview();
    });

    // Download functionality
    document.getElementById('downloadBtn').addEventListener('click', async function() {
        const previewContent = document.querySelector('.receipt-preview');
        const fileName = document.getElementById('downloadFileName').value || 'driver-salary';

        // Hide watermark temporarily
        const watermark = document.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';

        try {
            // Convert the preview content to canvas
            const canvas = await html2canvas(previewContent, {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
                windowWidth: previewContent.scrollWidth,
                windowHeight: previewContent.scrollHeight
            });

            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculate dimensions
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;

            // Add the image to the PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            // Save the PDF
            doc.save(`${fileName}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            // Show watermark again
            if (watermark) watermark.style.display = 'block';
        }
    });

    // Initial preview update
    updatePreview();
});

function updatePreview() {
    // Update driver name
    const driverName = document.getElementById('driverName').value || '________________';
    document.getElementById('previewDriverName').textContent = driverName;
    document.getElementById('previewDriverNameValue').textContent = driverName;

    // Update employee name
    const employeeName = document.getElementById('employeeName').value || '________________';
    document.getElementById('previewEmployeeName').textContent = employeeName;
    document.getElementById('previewEmployeeNameValue').textContent = employeeName;

    // Update vehicle number
    const vehicleNumber = document.getElementById('vehicleNumber').value || '________________';
    document.getElementById('previewVehicleNumber').textContent = vehicleNumber;

    // Update salary amount
    const currency = document.getElementById('currency').value === 'INR' ? '₹' : 
                    document.getElementById('currency').value === 'USD' ? '$' : '€';
    const amount = document.getElementById('salaryAmount').value || '________';
    document.getElementById('previewAmount').textContent = `${currency}${amount}`;

    // Update dates
    const fromDate = formatDate(document.getElementById('fromDate').value);
    const toDate = formatDate(document.getElementById('toDate').value);
    document.getElementById('previewPeriod').textContent = `${fromDate} to ${toDate}`;
    document.getElementById('previewPeriodDates').textContent = `${fromDate} - ${toDate}`;

    // Update declaration
    const declaration = document.getElementById('declaration').value;
    document.getElementById('previewDeclaration').textContent = declaration || 'I also declare that the driver is exclusively utilized for official purpose only';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
