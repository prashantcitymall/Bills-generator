document.addEventListener('DOMContentLoaded', function() {
    // Debug log to check if script is loading
    console.log('Script loaded');
    // Initialize date fields with current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fromDate').value = today;
    document.getElementById('toDate').value = today;

    // Update preview when form fields change
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        console.log('Adding listener to:', element.id);
        element.addEventListener('input', function(e) {
            console.log('Input changed:', e.target.id, e.target.value);
            updatePreview();
        });
    });

    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', function() {
        const form = document.querySelector('.form-container');
        const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Reset dates to today
        document.getElementById('fromDate').value = today;
        document.getElementById('toDate').value = today;
        
        // Reset radio buttons to default
        document.querySelector('input[name="template"][value="template3"]').checked = true;
        document.querySelector('input[name="signature"][value="url"]').checked = true;
        
        // Reset checkboxes
        document.getElementById('generateMultiple').checked = false;
        document.getElementById('authorizedLogo').checked = false;
        
        updatePreview();
    });

    // Download functionality
    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (!validateForm()) return;

        const element = document.querySelector('.receipt-preview');
        const watermark = element.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';

        const opt = {
            margin: [10, 10, 10, 10], // [top, right, bottom, left] margins in mm
            filename: `rent-receipt-${document.getElementById('downloadFileName').value || 'RR001'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollY: 0
            },
            jsPDF: { 
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        // New Promise-based usage:
        html2pdf().set(opt).from(element).save().then(() => {
            if (watermark) watermark.style.display = 'block';
        });
    });

    // Validate form function
    function validateForm() {
        const requiredFields = [
            { field: document.getElementById('employeeName'), name: 'Employee Name' },
            { field: document.getElementById('rentAddress'), name: 'Rent Address' },
            { field: document.getElementById('landlordName'), name: 'Landlord Name' },
            { field: document.getElementById('panNo'), name: 'PAN Number' },
            { field: document.getElementById('fromDate'), name: 'From Date' },
            { field: document.getElementById('toDate'), name: 'To Date' },
            { field: document.getElementById('rentAmount'), name: 'Rent Amount' }
        ];

        // Validate dates
        const fromDate = new Date(document.getElementById('fromDate').value);
        const toDate = new Date(document.getElementById('toDate').value);
        
        if (fromDate > toDate) {
            alert('From Date cannot be later than To Date');
            document.getElementById('fromDate').focus();
            return false;
        }

        // Validate rent amount
        const rentAmount = parseFloat(document.getElementById('rentAmount').value);
        if (rentAmount <= 0) {
            alert('Rent Amount must be greater than 0');
            document.getElementById('rentAmount').focus();
            return false;
        }

        for (const { field, name } of requiredFields) {
            if (!field.value.trim()) {
                alert(`Please enter ${name}`);
                field.focus();
                return false;
            }
        }

        return true;
    }

    // Initial preview update
    updatePreview();
});

function updatePreview() {
    console.log('Updating preview');
    // Update employee name
    const employeeName = document.getElementById('employeeName').value || '';
    document.getElementById('previewName').textContent = employeeName;
    document.getElementById('previewEmployee').textContent = employeeName;

    // Update amount
    const amount = document.getElementById('rentAmount').value || '';
    const currency = document.getElementById('currency').value === 'INR' ? '₹' : 
                    document.getElementById('currency').value === 'USD' ? '$' : '€';
    document.getElementById('previewAmount').textContent = amount ? `${currency}${amount}` : '';

    // Update address
    const address = document.getElementById('rentAddress').value || '';
    document.getElementById('previewAddress').textContent = address;

    // Update landlord name in all locations
    const landlordName = document.getElementById('landlordName').value || '';
    const landlordElements = document.querySelectorAll('#previewLandlord');
    landlordElements.forEach(element => {
        element.textContent = landlordName;
    });

    // Update Pan No.
    const panNo = document.getElementById('panNo').value || '';
    document.getElementById('previewPan').textContent = panNo;

    // Update payment method
    const paymentMethod = document.getElementById('paymentMethod');
    const paymentText = paymentMethod.value ? paymentMethod.options[paymentMethod.selectedIndex].text : '';
    document.getElementById('previewPayment').textContent = paymentText;

    // Update dates
    const fromDate = formatDate(document.getElementById('fromDate').value);
    const toDate = formatDate(document.getElementById('toDate').value);
    document.getElementById('previewDates').textContent = `${fromDate} - ${toDate}`;
    document.getElementById('previewPeriod').textContent = `${fromDate} to ${toDate}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}
