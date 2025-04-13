document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();

    // Add course button functionality
    document.getElementById('addCourseBtn').addEventListener('click', function() {
        addCourseItem();
    });

    // Calculate tax amount when taxable value or tax rate changes
    document.addEventListener('input', function(e) {
        if (e.target.id.startsWith('taxableValue') || e.target.id.startsWith('taxRate') || e.target.id.startsWith('quantity')) {
            const itemNumber = e.target.id.replace('taxableValue', '').replace('taxRate', '').replace('quantity', '');
            calculateTaxAmount(itemNumber);
            updateTotals();
        }
    });

    // Download functionality
    document.getElementById('downloadBtn').addEventListener('click', async function() {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        // Validate the form
        if (!validateCourseForm()) return;
        
        const previewContent = document.querySelector('.receipt-preview');
        const fileName = document.getElementById('downloadFileName').value || 'course-invoice';

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

            // Calculate dimensions with 5% margins
            const a4Width = 210; // A4 width in mm
            const a4Height = 297; // A4 height in mm
            
            // Calculate 5% margins
            const leftMargin = a4Width * 0.05; // 5% of width for left margin
            const topMargin = a4Height * 0.05; // 5% of height for top margin
            
            // Calculate available width after margins
            const availableWidth = a4Width * 0.9; // 90% of A4 width (100% - 5% - 5%)
            
            // Calculate image height proportionally
            const imgHeight = canvas.height * availableWidth / canvas.width;

            // Add the image to the PDF with margins
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            doc.addImage(imgData, 'JPEG', leftMargin, topMargin, availableWidth, imgHeight);

            // Save the PDF
            doc.save(`${fileName}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            // Show watermark again
            if (watermark) watermark.style.display = 'block';
        }
    });

    // Update preview when form fields change
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('input', updatePreview);
    });

    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', function() {
        const form = document.querySelector('.form-container');
        const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Reset date to today
        document.getElementById('invoiceDate').value = today;
        
        // Reset radio buttons to default
        document.querySelector('input[name="template"][value="template2"]').checked = true;
        
        // Reset course items
        const courseItemsContainer = document.getElementById('courseItemsContainer');
        courseItemsContainer.innerHTML = '';
        addCourseItem(); // Add one empty course item
        
        updatePreview();
        localStorage.removeItem('courseInvoiceFormData');
    });

    // Add first course item if none exists
    if (document.querySelectorAll('.course-item').length === 0) {
        addCourseItem();
    }

    // Initial preview update
    updatePreview();
    
    // Function to save form data to localStorage
    function saveFormData() {
        const courseItems = [];
        document.querySelectorAll('.course-item').forEach((item, index) => {
            courseItems.push({
                courseName: document.getElementById(`courseName${index+1}`)?.value || '',
                hsnCode: document.getElementById(`hsnCode${index+1}`)?.value || '',
                quantity: document.getElementById(`quantity${index+1}`)?.value || '1',
                taxableValue: document.getElementById(`taxableValue${index+1}`)?.value || '',
                taxRate: document.getElementById(`taxRate${index+1}`)?.value || '18',
                taxAmount: document.getElementById(`taxAmount${index+1}`)?.value || ''
            });
        });
        
        const formData = {
            supplierName: document.getElementById('supplierName').value,
            supplierAddress: document.getElementById('supplierAddress').value,
            gstin: document.getElementById('gstin').value,
            pan: document.getElementById('pan').value,
            recipientName: document.getElementById('recipientName').value,
            recipientEmail: document.getElementById('recipientEmail').value,
            recipientAddress: document.getElementById('recipientAddress').value,
            invoiceNumber: document.getElementById('invoiceNumber').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            currency: document.getElementById('currency').value,
            courseItems: courseItems,
            downloadFileName: document.getElementById('downloadFileName').value,
            template: document.querySelector('input[name="template"]:checked')?.value || 'template2'
        };
        
        localStorage.setItem('courseInvoiceFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('courseInvoiceFormData');
        if (!savedData) {
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        document.getElementById('supplierName').value = formData.supplierName || '';
        document.getElementById('supplierAddress').value = formData.supplierAddress || '';
        document.getElementById('gstin').value = formData.gstin || '';
        document.getElementById('pan').value = formData.pan || '';
        document.getElementById('recipientName').value = formData.recipientName || '';
        document.getElementById('recipientEmail').value = formData.recipientEmail || '';
        document.getElementById('recipientAddress').value = formData.recipientAddress || '';
        document.getElementById('invoiceNumber').value = formData.invoiceNumber || '';
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('downloadFileName').value = formData.downloadFileName || '';
        
        // Set date - use saved value or default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = formData.invoiceDate || today;
        
        // Set template
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || 'template2'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
        }
        
        // Load course items
        if (formData.courseItems && formData.courseItems.length > 0) {
            const courseItemsContainer = document.getElementById('courseItemsContainer');
            courseItemsContainer.innerHTML = '';
            
            formData.courseItems.forEach((item, index) => {
                addCourseItem();
                document.getElementById(`courseName${index+1}`).value = item.courseName || '';
                document.getElementById(`hsnCode${index+1}`).value = item.hsnCode || '';
                document.getElementById(`quantity${index+1}`).value = item.quantity || '1';
                document.getElementById(`taxableValue${index+1}`).value = item.taxableValue || '';
                document.getElementById(`taxRate${index+1}`).value = item.taxRate || '18';
                document.getElementById(`taxAmount${index+1}`).value = item.taxAmount || '';
            });
        }
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
                // Store the current URL to return after login
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
            }
        });
    }

    // Function to add a new course item
    function addCourseItem() {
        const courseItemsContainer = document.getElementById('courseItemsContainer');
        const itemCount = courseItemsContainer.querySelectorAll('.course-item').length + 1;
        
        const courseItem = document.createElement('div');
        courseItem.className = 'course-item';
        courseItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="courseName${itemCount}">Course Name</label>
                    <input type="text" id="courseName${itemCount}" placeholder="Enter Course Name">
                </div>
                <div class="form-group">
                    <label for="hsnCode${itemCount}">HSN Code</label>
                    <input type="text" id="hsnCode${itemCount}" placeholder="Enter HSN Code">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="quantity${itemCount}">Quantity</label>
                    <input type="number" id="quantity${itemCount}" value="1" min="1">
                </div>
                <div class="form-group">
                    <label for="taxableValue${itemCount}">Taxable Value</label>
                    <input type="number" id="taxableValue${itemCount}" placeholder="Enter Taxable Value" step="0.01">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="taxRate${itemCount}">Tax Rate (%)</label>
                    <input type="number" id="taxRate${itemCount}" placeholder="Enter Tax Rate" value="18" min="0" max="100">
                </div>
                <div class="form-group">
                    <label for="taxAmount${itemCount}">Tax Amount</label>
                    <input type="number" id="taxAmount${itemCount}" placeholder="0.00" readonly>
                </div>
            </div>
        `;
        
        // Add remove button for all items except the first one
        if (itemCount > 1) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-item';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.addEventListener('click', function() {
                courseItem.remove();
                updatePreview();
                saveFormData();
            });
            courseItem.appendChild(removeButton);
        }
        
        courseItemsContainer.appendChild(courseItem);
        updatePreview();
    }

    // Function to calculate tax amount for a course item
    function calculateTaxAmount(itemNumber) {
        const taxableValueInput = document.getElementById(`taxableValue${itemNumber}`);
        const taxRateInput = document.getElementById(`taxRate${itemNumber}`);
        const quantityInput = document.getElementById(`quantity${itemNumber}`);
        const taxAmountInput = document.getElementById(`taxAmount${itemNumber}`);
        
        if (taxableValueInput && taxRateInput && taxAmountInput && quantityInput) {
            const taxableValue = parseFloat(taxableValueInput.value) || 0;
            const taxRate = parseFloat(taxRateInput.value) || 0;
            const quantity = parseInt(quantityInput.value) || 1;
            const taxAmount = (taxableValue * quantity * taxRate) / 100;
            taxAmountInput.value = taxAmount.toFixed(2);
        }
    }

    // Function to update totals
    function updateTotals() {
        let totalTaxableValue = 0;
        let totalTaxAmount = 0;
        
        document.querySelectorAll('.course-item').forEach((item, index) => {
            const itemNumber = index + 1;
            const taxableValueInput = document.getElementById(`taxableValue${itemNumber}`);
            const taxAmountInput = document.getElementById(`taxAmount${itemNumber}`);
            const quantityInput = document.getElementById(`quantity${itemNumber}`);
            
            if (taxableValueInput && taxAmountInput && quantityInput) {
                const taxableValue = parseFloat(taxableValueInput.value) || 0;
                const quantity = parseInt(quantityInput.value) || 1;
                const taxAmount = parseFloat(taxAmountInput.value) || 0;
                
                totalTaxableValue += taxableValue * quantity;
                totalTaxAmount += taxAmount;
            }
        });
        
        // Update preview totals
        document.getElementById('totalTaxableValue').textContent = totalTaxableValue.toFixed(2);
        document.getElementById('totalTaxAmount').textContent = totalTaxAmount.toFixed(2);
        
        const currency = document.getElementById('currency').value;
        const grandTotal = totalTaxableValue + totalTaxAmount;
        document.getElementById('grandTotal').textContent = `${getCurrencySymbol(currency)} ${grandTotal.toFixed(2)}`;
    }

    // Validation function for required fields
    function validateCourseForm() {
        // Validate required fields
        const requiredFields = [
            'supplierName',
            'supplierAddress',
            'recipientName',
            'invoiceNumber',
            'invoiceDate'
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

        // Validate at least one course item has name and taxable value
        const courseItems = document.querySelectorAll('.course-item');
        let hasValidCourseItem = false;
        
        courseItems.forEach((item, index) => {
            const itemNumber = index + 1;
            const courseNameInput = document.getElementById(`courseName${itemNumber}`);
            const taxableValueInput = document.getElementById(`taxableValue${itemNumber}`);
            
            if (courseNameInput && taxableValueInput && 
                courseNameInput.value.trim() && 
                taxableValueInput.value.trim()) {
                hasValidCourseItem = true;
            }
        });
        
        if (!hasValidCourseItem) {
            alert('Please add at least one course with name and taxable value');
            return false;
        }

        if (!isValid) {
            alert('Please fill in all required fields');
            return false;
        }
        return true;
    }

    // Function to update preview
    function updatePreview() {
        // Update supplier details
        document.getElementById('previewSupplierName').textContent = document.getElementById('supplierName').value || 'Udemy India LLP';
        document.getElementById('previewSupplierAddress').innerHTML = formatAddress(document.getElementById('supplierAddress').value) || '10th Floor, RedCowork 07, Tower B,<br>Unitech Cyber Park, Sector 39,<br>Gurgaon, Haryana, India, 122003';
        document.getElementById('previewGstin').textContent = document.getElementById('gstin').value || '06AAFFU8763H1ZE';
        document.getElementById('previewPan').textContent = document.getElementById('pan').value || 'AAOCU4291A';
        
        // Update recipient details
        document.getElementById('previewRecipientName').textContent = document.getElementById('recipientName').value || 'Badri Kotanjan Reddy';
        document.getElementById('previewRecipientEmail').textContent = document.getElementById('recipientEmail').value || 'kotanjan.neo@gmail.com';
        document.getElementById('previewRecipientAddress').innerHTML = formatAddress(document.getElementById('recipientAddress').value) || 'Uppalapadu,Owk Andhra Pradesh, 37, AP, India';
        
        // Update invoice details
        document.getElementById('previewInvoiceNumber').textContent = document.getElementById('invoiceNumber').value || 'IN2020-421271';
        
        const invoiceDate = document.getElementById('invoiceDate').value;
        document.getElementById('previewInvoiceDate').textContent = invoiceDate ? formatDate(invoiceDate) : '27/10/2020';
        
        // Update course items table
        updateCourseItemsTable();
        
        // Update totals
        updateTotals();
        
        // Set company logo based on template
        const template = document.querySelector('input[name="template"]:checked').value;
        const logoPreview = document.getElementById('companyLogoPreview');
        
        // Use local Udemy logo for both templates
        logoPreview.src = 'images/udemy.png';
        logoPreview.alt = 'Udemy Logo';
    }

    // Function to update course items table
    function updateCourseItemsTable() {
        const tableBody = document.getElementById('courseItemsTableBody');
        tableBody.innerHTML = '';
        
        document.querySelectorAll('.course-item').forEach((item, index) => {
            const itemNumber = index + 1;
            const courseName = document.getElementById(`courseName${itemNumber}`).value || `Course ${itemNumber}`;
            const hsnCode = document.getElementById(`hsnCode${itemNumber}`).value || '9984';
            const quantity = document.getElementById(`quantity${itemNumber}`).value || '1';
            const taxableValue = document.getElementById(`taxableValue${itemNumber}`).value || '0.00';
            
            // Calculate tax amount
            calculateTaxAmount(itemNumber);
            const taxAmount = document.getElementById(`taxAmount${itemNumber}`).value || '0.00';
            
            // Calculate total amount
            const totalAmount = (parseFloat(taxableValue) * parseFloat(quantity)) + parseFloat(taxAmount);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${courseName}</td>
                <td>${hsnCode}</td>
                <td>${quantity}</td>
                <td>${parseFloat(taxableValue).toFixed(2)}</td>
                <td>-</td>
                <td>-</td>
                <td>${parseFloat(taxAmount).toFixed(2)}</td>
                <td>${totalAmount.toFixed(2)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '/');
    }

    // Helper function to format address with line breaks
    function formatAddress(address) {
        if (!address) return '';
        return address.replace(/\n/g, '<br>');
    }

    // Helper function to get currency symbol
    function getCurrencySymbol(currencyCode) {
        const symbols = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        return symbols[currencyCode] || currencyCode;
    }
});
