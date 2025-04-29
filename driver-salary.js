document.addEventListener('DOMContentLoaded', function() {
    // Initialize signature functionality
    const signatureInstance = new SejdaSignature();
    
    // Add signature button event listener
    const addSignatureBtn = document.getElementById('addSignatureBtn');
    if (addSignatureBtn) {
        addSignatureBtn.addEventListener('click', function() {
            signatureInstance.openSignatureModal();
        });
    }
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();

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
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        if (!validateForm()) return;

        const element = document.querySelector('.receipt-preview');
        const watermark = document.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';
        
        // Find signature element if it exists
        const signatureElement = document.querySelector('.draggable-signature');
        
        // Store original signature styles to restore later
        const originalStyles = {};
        if (signatureElement) {
            // Hide controls for PDF generation
            const handles = signatureElement.querySelectorAll('.resize-handle');
            handles.forEach(handle => {
                originalStyles.handleDisplay = handle.style.display;
                handle.style.display = 'none';
            });
            
            const toolbar = signatureElement.querySelector('.signature-toolbar');
            if (toolbar) {
                originalStyles.toolbarDisplay = toolbar.style.display;
                toolbar.style.display = 'none';
            }
        }
        
        // Generate a temporary element for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '10mm';
        tempDiv.style.backgroundColor = '#ffffff';
        // Apply global font style to match rent receipt
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.fontSize = '14px';
        tempDiv.style.color = '#000000';
        tempDiv.style.lineHeight = '1.5';
        document.body.appendChild(tempDiv);
        
        // Ensure heading is properly centered in the PDF and has the exact same font style as rent receipt
        const heading = tempDiv.querySelector('h2');
        if (heading) {
            heading.style.textAlign = 'center';
            heading.style.marginBottom = '2rem';
            heading.style.marginTop = '0';
            heading.style.fontWeight = 'bold';
            heading.style.color = '#000000';
            heading.style.fontFamily = 'Arial, sans-serif';
            heading.style.fontSize = '18px';
            heading.style.lineHeight = '1.5';
        }
        
        // Apply consistent font styling to match rent receipt image
        const allTextElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, td, th, div');
        allTextElements.forEach(el => {
            // Base font styling for all elements
            el.style.fontFamily = 'Arial, sans-serif';
            el.style.color = '#000000';
            
            // Apply specific styling based on element type
            if (el.tagName.toLowerCase() === 'h2') {
                el.style.fontSize = '18px';
                el.style.fontWeight = 'bold';
            } else if (el.tagName.toLowerCase() === 'h3') {
                el.style.fontSize = '16px';
                el.style.fontWeight = 'bold';
            } else if (el.tagName.toLowerCase() === 'p') {
                el.style.fontSize = '14px';
                el.style.lineHeight = '1.5';
            } else if (el.className && el.className.includes('label')) {
                el.style.fontSize = '14px';
                el.style.fontWeight = 'normal';
            } else if (el.className && el.className.includes('value')) {
                el.style.fontSize = '14px';
                el.style.fontWeight = 'bold';
            } else if (el.id && el.id.startsWith('preview')) {
                el.style.fontSize = '14px';
                el.style.fontWeight = 'bold';
            } else {
                el.style.fontSize = '14px';
            }
            
            // Ensure consistent line height
            el.style.lineHeight = '1.5';
        });
        
        // If there's a signature, copy it properly
        if (signatureElement) {
            const signatureImg = signatureElement.querySelector('img');
            if (signatureImg) {
                const signatureRect = signatureElement.getBoundingClientRect();
                const previewRect = element.getBoundingClientRect();
                
                // Create a new signature image with exact position
                const newSignature = document.createElement('img');
                newSignature.src = signatureImg.src;
                newSignature.style.position = 'absolute';
                newSignature.style.left = `${signatureRect.left - previewRect.left}px`;
                newSignature.style.top = `${signatureRect.top - previewRect.top}px`;
                newSignature.style.width = `${signatureRect.width}px`;
                newSignature.style.height = 'auto';
                newSignature.style.transform = signatureElement.style.transform;
                newSignature.style.transformOrigin = 'center center';
                newSignature.style.zIndex = '100';
                newSignature.style.maxWidth = 'none'; // Prevent cropping
                newSignature.style.objectFit = 'contain'; // Ensure the image is not cropped
                
                // Remove any existing signature in the temp div
                const oldSig = tempDiv.querySelector('.draggable-signature');
                if (oldSig) oldSig.remove();
                
                // Add the new signature
                tempDiv.appendChild(newSignature);
            }
        }

        const opt = {
            margin: 1,
            filename: `driver-salary-${document.getElementById('downloadFileName').value || 'DS001'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollY: 0,
                backgroundColor: '#ffffff',
                logging: true
            },
            jsPDF: { 
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        // Generate PDF from the temp element
        html2pdf()
            .from(tempDiv)
            .set(opt)
            .save()
            .then(() => {
                console.log('PDF generated successfully');
                
                // Clean up
                document.body.removeChild(tempDiv);
                
                // Restore original signature styles
                if (signatureElement && Object.keys(originalStyles).length > 0) {
                    // Show controls again
                    const handles = signatureElement.querySelectorAll('.resize-handle');
                    handles.forEach(handle => handle.style.display = 'block');
                    
                    const toolbar = signatureElement.querySelector('.signature-toolbar');
                    if (toolbar) toolbar.style.display = 'flex';
                }
                
                if (watermark) watermark.style.display = 'block';
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                document.body.removeChild(tempDiv);
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
    
    // Function to save form data to localStorage
    function saveFormData() {
        const formData = {
            driverName: document.getElementById('driverName').value,
            employeeName: document.getElementById('employeeName').value,
            vehicleNumber: document.getElementById('vehicleNumber').value,
            printDate: document.getElementById('printDate').value,
            fromDate: document.getElementById('fromDate').value,
            toDate: document.getElementById('toDate').value,
            currency: document.getElementById('currency').value,
            salaryAmount: document.getElementById('salaryAmount').value,
            billBy: document.getElementById('billBy').value,
            declaration: document.getElementById('declaration').value,
            downloadFileName: document.getElementById('downloadFileName').value,
            template: document.querySelector('input[name="template"]:checked')?.value || 'template4',
            signatureType: document.querySelector('input[name="signatureType"]:checked')?.value || 'url',
            generateZip: document.getElementById('generateZip').checked,
            authorizedLogo: document.getElementById('authorizedLogo').checked
        };
        
        localStorage.setItem('driverSalaryFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('driverSalaryFormData');
        if (!savedData) {
            // If no saved data, set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('fromDate').value = today;
            document.getElementById('toDate').value = today;
            document.getElementById('printDate').value = today;
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        document.getElementById('driverName').value = formData.driverName || '';
        document.getElementById('employeeName').value = formData.employeeName || '';
        document.getElementById('vehicleNumber').value = formData.vehicleNumber || '';
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('salaryAmount').value = formData.salaryAmount || '';
        document.getElementById('billBy').value = formData.billBy || 'monthly';
        document.getElementById('declaration').value = formData.declaration || '';
        document.getElementById('downloadFileName').value = formData.downloadFileName || '';
        
        // Set dates - use saved values or defaults
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('printDate').value = formData.printDate || today;
        document.getElementById('fromDate').value = formData.fromDate || today;
        document.getElementById('toDate').value = formData.toDate || today;
        
        // Set template
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || 'template4'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
        }
        
        // Set signature type
        const signatureRadio = document.querySelector(`input[name="signatureType"][value="${formData.signatureType || 'url'}"]`);
        if (signatureRadio) {
            signatureRadio.checked = true;
        }
        
        // Set checkboxes
        document.getElementById('generateZip').checked = formData.generateZip || false;
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
                localStorage.removeItem('driverSalaryFormData');
                
                // Reset dates to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('fromDate').value = today;
                document.getElementById('toDate').value = today;
                document.getElementById('printDate').value = today;
                
                // Reset radio buttons to defaults
                document.querySelector('input[name="template"][value="template4"]').checked = true;
                document.querySelector('input[name="signatureType"][value="url"]').checked = true;
                
                // Reset checkboxes
                document.getElementById('generateZip').checked = false;
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
    // Update print date
    const printDate = formatDate(document.getElementById('printDate').value);
    document.getElementById('previewPrintDate').textContent = printDate;
    togglePremiumInputClass('previewPrintDate', printDate);
    
    // Update driver name
    const driverName = document.getElementById('driverName').value || '________________';
    document.getElementById('previewDriverName').textContent = driverName;
    document.getElementById('previewDriverNameValue').textContent = driverName;
    togglePremiumInputClass('previewDriverName', driverName);
    togglePremiumInputClass('previewDriverNameValue', driverName);

    // Update employee name
    const employeeName = document.getElementById('employeeName').value || '________________';
    document.getElementById('previewEmployeeName').textContent = employeeName;
    document.getElementById('previewEmployeeNameValue').textContent = employeeName;
    togglePremiumInputClass('previewEmployeeName', employeeName);
    togglePremiumInputClass('previewEmployeeNameValue', employeeName);

    // Update vehicle number
    const vehicleNumber = document.getElementById('vehicleNumber').value || '________________';
    document.getElementById('previewVehicleNumber').textContent = vehicleNumber;
    togglePremiumInputClass('previewVehicleNumber', vehicleNumber);

    // Update salary amount
    const currency = document.getElementById('currency').value === 'INR' ? '₹' : 
                    document.getElementById('currency').value === 'USD' ? '$' : '€';
    const amount = document.getElementById('salaryAmount').value || '________';
    const formattedAmount = `${currency}${amount}`;
    document.getElementById('previewAmount').textContent = formattedAmount;
    togglePremiumInputClass('previewAmount', formattedAmount);

    // Update dates
    const fromDate = formatDate(document.getElementById('fromDate').value);
    const toDate = formatDate(document.getElementById('toDate').value);
    const periodText = `${fromDate} to ${toDate}`;
    const dateRange = `${fromDate} - ${toDate}`;
    document.getElementById('previewPeriod').textContent = periodText;
    document.getElementById('previewPeriodDates').textContent = dateRange;
    togglePremiumInputClass('previewPeriod', periodText);
    togglePremiumInputClass('previewPeriodDates', dateRange);

    // Update declaration
    const declaration = document.getElementById('declaration').value;
    document.getElementById('previewDeclaration').textContent = declaration || 'I also declare that the driver is exclusively utilized for official purpose only';
}

// Helper function to toggle premium input class based on content
function togglePremiumInputClass(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (value && value.trim() !== '' && value !== '________________' && value !== '________') {
        element.classList.add('filled');
    } else {
        element.classList.remove('filled');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
