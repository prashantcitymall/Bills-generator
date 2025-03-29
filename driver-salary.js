document.addEventListener('DOMContentLoaded', function() {
    // Initialize dates with current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fromDate').value = today;
    document.getElementById('toDate').value = today;
    document.getElementById('printDate').value = today;

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
        document.getElementById('printDate').value = today;
        
        // Reset radio buttons to defaults
        document.querySelector('input[name="template"][value="template4"]').checked = true;
        document.querySelector('input[name="signatureType"][value="url"]').checked = true;
        
        // Reset checkboxes
        document.getElementById('generateZip').checked = false;
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
            margin: 1,
            filename: `driver-salary-${document.getElementById('downloadFileName').value || 'DS001'}.pdf`,
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
            { field: document.getElementById('driverName'), name: 'Driver Name' },
            { field: document.getElementById('employeeName'), name: 'Employee Name' },
            { field: document.getElementById('vehicleNumber'), name: 'Vehicle Number' },
            { field: document.getElementById('fromDate'), name: 'From Date' },
            { field: document.getElementById('toDate'), name: 'To Date' },
            { field: document.getElementById('printDate'), name: 'Print Date' },
            { field: document.getElementById('salaryAmount'), name: 'Salary Amount' }
        ];

        // Validate dates
        const fromDate = new Date(document.getElementById('fromDate').value);
        const toDate = new Date(document.getElementById('toDate').value);
        
        if (fromDate > toDate) {
            alert('From Date cannot be later than To Date');
            document.getElementById('fromDate').focus();
            return false;
        }

        // Validate salary amount
        const salaryAmount = parseFloat(document.getElementById('salaryAmount').value);
        if (salaryAmount <= 0) {
            alert('Salary Amount must be greater than 0');
            document.getElementById('salaryAmount').focus();
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
    // Update print date
    const printDate = formatDate(document.getElementById('printDate').value);
    document.getElementById('previewPrintDate').textContent = printDate;
    
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
