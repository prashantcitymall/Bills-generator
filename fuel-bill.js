// Get all input elements
const stationName = document.getElementById('stationName');
const stationAddress = document.getElementById('stationAddress');
const paymentMethod = document.getElementById('paymentMethod');
const invoiceNumber = document.getElementById('invoiceNumber');
const fuelRate = document.getElementById('fuelRate');
const totalAmount = document.getElementById('totalAmount');
const billDate = document.getElementById('billDate');
const billTime = document.getElementById('billTime');
const customerName = document.getElementById('customerName');
const vehicleNumber = document.getElementById('vehicleNumber');
const vehicleType = document.getElementById('vehicleType');

// Calculate quantity function
function calculateQuantity() {
    const rate = parseFloat(fuelRate.value) || 0;
    const total = parseFloat(totalAmount.value) || 0;
    
    if (rate > 0 && total > 0) {
        const quantity = Math.round(total / rate);
        document.getElementById('previewQuantity').textContent = quantity + 'L';
    } else {
        document.getElementById('previewQuantity').textContent = '1L';
    }
}

// Set current date and time
const now = new Date();
billDate.value = now.toISOString().split('T')[0];
billTime.value = now.toTimeString().split(' ')[0].slice(0, 5);

// Preview update function
function updatePreview() {
    // Update receipt number
    document.getElementById('previewReceiptNumber').textContent = 'RP-' + (invoiceNumber.value || '6524');
    
    // Calculate and update quantity
    
    // Update date and time
    const formattedDate = new Date(billDate.value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    document.getElementById('previewDate').textContent = formattedDate;
    document.getElementById('previewTime').textContent = billTime.value;
    document.getElementById('previewFooterTime').textContent = billTime.value;

    // Update customer details
    document.getElementById('previewCustomerName').textContent = customerName.value;
    document.getElementById('previewVehicleNumber').textContent = vehicleNumber.value;
    document.getElementById('previewVehicleType').textContent = 
        vehicleType.options[vehicleType.selectedIndex]?.text || '';

    // Update station details
    document.getElementById('previewStationName').textContent = stationName.value;
    document.getElementById('previewStationAddress').textContent = stationAddress.value;

    // Update payment method
    document.getElementById('previewPaymentMethod').textContent = 
        paymentMethod.options[paymentMethod.selectedIndex]?.text || '';

    // Update amounts and calculate quantity
    const rate = fuelRate.value;
    const total = totalAmount.value;
    document.getElementById('previewFuelRate').textContent = rate ? rate : '';
    document.getElementById('previewTotalAmount').textContent = total ? total : '';
    document.getElementById('previewGrandTotal').textContent = total ? total : '';
    calculateQuantity();
}

// Add event listeners to all input fields
[stationName, stationAddress, paymentMethod, invoiceNumber, billDate, 
 billTime, customerName, vehicleNumber, vehicleType
].forEach(element => {
    element.addEventListener('input', updatePreview);
    element.addEventListener('change', updatePreview);
});

// Add special listeners for rate and amount to trigger quantity calculation
fuelRate.addEventListener('input', function() {
    updatePreview();
    calculateQuantity();
});

totalAmount.addEventListener('input', function() {
    updatePreview();
    calculateQuantity();
});

// Validate form function
function validateForm() {
    const requiredFields = [
        { field: stationName, name: 'Fuel Station Name' },
        { field: stationAddress, name: 'Fuel Station Address' },
        { field: paymentMethod, name: 'Payment Method' },
        { field: customerName, name: 'Customer Name' },
        { field: vehicleNumber, name: 'Vehicle Number' },
        { field: vehicleType, name: 'Vehicle Type' },
        { field: fuelRate, name: 'Fuel Rate' },
        { field: totalAmount, name: 'Total Amount' }
    ];

    for (const { field, name } of requiredFields) {
        if (!field.value.trim()) {
            alert(`Please enter ${name}`);
            field.focus();
            return false;
        }
    }
    return true;
}

// Download PDF function
document.getElementById('downloadBtn').addEventListener('click', () => {
    // Check if user is logged in
    if (!window.authState || !window.authState.isAuthenticated) {
        // User is not logged in, show alert
        alert('Please sign in to download bills');
        return;
    }
    
    if (!validateForm()) return;

    const element = document.querySelector('.preview-content');
    const watermark = element.querySelector('.watermark');
    watermark.style.display = 'none';

    const opt = {
        margin: 1,
        filename: `fuel-receipt-${invoiceNumber.value || '6524'}.pdf`,
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
        watermark.style.display = 'block';
    });
});

// Clear form function
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the form?')) {
        const form = document.querySelector('.input-form');
        form.reset();
        
        // Reset date and time
        const now = new Date();
        billDate.value = now.toISOString().split('T')[0];
        billTime.value = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        updatePreview();
    }
});

// Clear form function
document.getElementById('clearBtn').addEventListener('click', () => {
    const form = document.querySelector('.input-form');
    const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
    inputs.forEach(input => input.value = '');
    
    // Reset radio buttons to first option
    const radioGroups = form.querySelectorAll('input[type="radio"]');
    radioGroups.forEach(radio => {
        if (radio.value === '1' || radio.value === 'none' || radio.value === 'url') {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });

    // Reset checkbox
    document.getElementById('logoAuth').checked = false;

    // Update preview after clearing
    updatePreview();
});

// Template selection handling
const templateRadios = document.querySelectorAll('input[name="template"]');
const logoImage = document.querySelector('.bpcl-logo');

templateRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        // Update the file name with the selected template number
        document.getElementById('fileName').value = `Fuel Bill Template ${this.value}`;
        
        // Change logo based on template selection
        if (this.value === '2') {
            logoImage.src = 'images/hp.png';
            logoImage.alt = 'HP Logo';
        } else if (this.value === '3') {
            logoImage.src = 'images/iocl.png';
            logoImage.alt = 'IOCL Logo';
        } else if (this.value === '4') {
            logoImage.src = 'images/relience.png';
            logoImage.alt = 'Reliance Logo';
        } else {
            logoImage.src = 'images/bpcl.png';
            logoImage.alt = 'BPCL Logo';
        }
        
        // Update the preview
        updatePreview();
    });
});

// Initial preview update
updatePreview();
