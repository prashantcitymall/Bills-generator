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

    // Download button functionality (placeholder)
    document.getElementById('downloadBtn').addEventListener('click', function() {
        // Validate required fields
        const requiredFields = [
            'employeeName',
            'rentAddress',
            'landlordName',
            'panNo',
            'rentAmount'
        ];

        let isValid = true;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = 'red';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) {
            alert('Please fill in all required fields');
            return;
        }

        // TODO: Implement actual PDF generation and download
        alert('PDF generation will be implemented in the next phase');
    });

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

    // Update landlord name
    const landlordName = document.getElementById('landlordName').value || '';
    document.getElementById('previewLandlord').textContent = landlordName;
    
    // Update landlord name in the main text
    const mainText = document.querySelector('.main-text');
    const mainTextContent = mainText.innerHTML;
    const landlordRegex = /(to landlord, Mr\/Ms)(?:\s+[^\s]+)?/;
    mainText.innerHTML = mainTextContent.replace(landlordRegex, `$1${landlordName ? ' ' + landlordName : ''}`);

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
