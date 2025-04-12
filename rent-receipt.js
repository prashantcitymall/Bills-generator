document.addEventListener('DOMContentLoaded', function() {
    // Debug log to check if script is loading
    console.log('Script loaded');
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();

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
        document.getElementById('printDate').value = today;
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
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
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
    
    // Function to save form data to localStorage
    function saveFormData() {
        const formData = {
            employeeName: document.getElementById('employeeName').value,
            rentAddress: document.getElementById('rentAddress').value,
            landlordName: document.getElementById('landlordName').value,
            panNo: document.getElementById('panNo').value,
            printDate: document.getElementById('printDate').value,
            fromDate: document.getElementById('fromDate').value,
            toDate: document.getElementById('toDate').value,
            billBy: document.getElementById('billBy').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            currency: document.getElementById('currency').value,
            rentAmount: document.getElementById('rentAmount').value,
            downloadFileName: document.getElementById('downloadFileName').value,
            template: document.querySelector('input[name="template"]:checked')?.value || 'template3',
            signature: document.querySelector('input[name="signature"]:checked')?.value || 'url',
            generateMultiple: document.getElementById('generateMultiple').checked,
            authorizedLogo: document.getElementById('authorizedLogo').checked
        };
        
        localStorage.setItem('rentReceiptFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('rentReceiptFormData');
        if (!savedData) {
            // If no saved data, set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('printDate').value = today;
            document.getElementById('fromDate').value = today;
            document.getElementById('toDate').value = today;
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        document.getElementById('employeeName').value = formData.employeeName || '';
        document.getElementById('rentAddress').value = formData.rentAddress || '';
        document.getElementById('landlordName').value = formData.landlordName || '';
        document.getElementById('panNo').value = formData.panNo || '';
        document.getElementById('billBy').value = formData.billBy || 'monthly';
        document.getElementById('paymentMethod').value = formData.paymentMethod || '';
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('rentAmount').value = formData.rentAmount || '';
        document.getElementById('downloadFileName').value = formData.downloadFileName || '';
        
        // Set dates - use saved values or defaults
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('printDate').value = formData.printDate || today;
        document.getElementById('fromDate').value = formData.fromDate || today;
        document.getElementById('toDate').value = formData.toDate || today;
        
        // Set template
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || 'template3'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
        }
        
        // Set signature type
        const signatureRadio = document.querySelector(`input[name="signature"][value="${formData.signature || 'url'}"]`);
        if (signatureRadio) {
            signatureRadio.checked = true;
        }
        
        // Set checkboxes
        document.getElementById('generateMultiple').checked = formData.generateMultiple || false;
        document.getElementById('authorizedLogo').checked = formData.authorizedLogo || false;
    }
    
    // Function to set up form persistence
    function setupFormPersistence() {
        // Get the form element
        const form = document.querySelector('.form-container');
        
        // Save form data on input changes
        form.addEventListener('input', function() {
            saveFormData();
        });
        
        form.addEventListener('change', function() {
            saveFormData();
        });
        
        // Update the download button to store current page URL before redirecting to login
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', function() {
            if (!window.authState || !window.authState.isAuthenticated) {
                // Save the current URL to return after login
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
            }
        }, true); // Use capture phase to ensure this runs before the download handler
        
        // Update clear button to also clear localStorage
        const clearBtn = document.getElementById('clearBtn');
        const originalClearBtnClick = clearBtn.onclick;
        clearBtn.onclick = function(e) {
            if (confirm('Are you sure you want to clear the form?')) {
                // Remove the saved form data from localStorage
                localStorage.removeItem('rentReceiptFormData');
                
                // Reset dates to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('printDate').value = today;
                document.getElementById('fromDate').value = today;
                document.getElementById('toDate').value = today;
                
                // Reset radio buttons to defaults
                document.querySelector('input[name="template"][value="template3"]').checked = true;
                document.querySelector('input[name="signature"][value="url"]').checked = true;
                
                // Reset checkboxes
                document.getElementById('generateMultiple').checked = false;
                document.getElementById('authorizedLogo').checked = false;
                
                // Clear other form fields
                const inputs = form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="date"]), select, textarea');
                inputs.forEach(input => {
                    input.value = '';
                });
                
                updatePreview();
            }
            return false; // Prevent the original click handler from running
        };
    }
});

function updatePreview() {
    console.log('Updating preview');
    // Update employee name
    const employeeName = document.getElementById('employeeName').value || '';
    document.getElementById('previewName').textContent = employeeName;
    document.getElementById('previewEmployee').textContent = employeeName;
    togglePremiumInputClass('previewName', employeeName);
    togglePremiumInputClass('previewEmployee', employeeName);

    // Update amount
    const amount = document.getElementById('rentAmount').value || '';
    const currency = document.getElementById('currency').value === 'INR' ? '₹' : 
                    document.getElementById('currency').value === 'USD' ? '$' : '€';
    const formattedAmount = amount ? `${currency}${amount}` : '';
    document.getElementById('previewAmount').textContent = formattedAmount;
    togglePremiumInputClass('previewAmount', formattedAmount);

    // Update address
    const address = document.getElementById('rentAddress').value || '';
    document.getElementById('previewAddress').textContent = address;
    togglePremiumInputClass('previewAddress', address);

    // Update landlord name in all locations
    const landlordName = document.getElementById('landlordName').value || '';
    const landlordElements = document.querySelectorAll('#previewLandlord');
    landlordElements.forEach(element => {
        element.textContent = landlordName;
        if (element.classList.contains('premium-input')) {
            togglePremiumInputClass(element.id, landlordName);
        }
    });

    // Update Pan No.
    const panNo = document.getElementById('panNo').value || '';
    document.getElementById('previewPan').textContent = panNo;
    togglePremiumInputClass('previewPan', panNo);

    // Update payment method
    const paymentMethod = document.getElementById('paymentMethod');
    const paymentText = paymentMethod.value ? paymentMethod.options[paymentMethod.selectedIndex].text : '';
    document.getElementById('previewPayment').textContent = paymentText;
    togglePremiumInputClass('previewPayment', paymentText);

    // Update dates
    const fromDate = formatDate(document.getElementById('fromDate').value);
    const toDate = formatDate(document.getElementById('toDate').value);
    const dateRange = `${fromDate} - ${toDate}`;
    const periodText = `${fromDate} to ${toDate}`;
    document.getElementById('previewDates').textContent = dateRange;
    document.getElementById('previewPeriod').textContent = periodText;
    togglePremiumInputClass('previewDates', dateRange);
    togglePremiumInputClass('previewPeriod', periodText);
    
    // Update the date in the header of the preview
    const currentDate = formatDate(document.getElementById('printDate').value);
    document.getElementById('previewDate').textContent = currentDate;
    togglePremiumInputClass('previewDate', currentDate);
}

// Helper function to toggle premium input class based on content
function togglePremiumInputClass(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (value && value.trim() !== '') {
        element.classList.add('filled');
    } else {
        element.classList.remove('filled');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}
