document.addEventListener('DOMContentLoaded', function() {
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();

    // Download functionality
    document.getElementById('downloadBtn').addEventListener('click', async function() {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        // Validate the form
        if (!validateBookForm()) return;
        
        const previewContent = document.querySelector('.receipt-preview');
        const fileName = document.getElementById('downloadFileName').value || 'book-invoice';

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
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
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
        document.getElementById('purchaseDate').value = today;
        
        // Reset radio buttons to default
        document.querySelector('input[name="template"][value="template2"]').checked = true;
        
        updatePreview();
    });

    // Validation function for required fields
    function validateBookForm() {
        // Validate required fields
        const requiredFields = [
            'bookAuthor',
            'bookStoreName',
            'storeAddress',
            'bookName',
            'publisher',
            'quantity',
            'bookPrice',
            'customerName'
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
            return false;
        }
        return true;
    }

    // Initial preview update
    updatePreview();
    
    // Function to save form data to localStorage
    function saveFormData() {
        const formData = {
            bookAuthor: document.getElementById('bookAuthor').value,
            bookStoreName: document.getElementById('bookStoreName').value,
            storeAddress: document.getElementById('storeAddress').value,
            bookName: document.getElementById('bookName').value,
            publisher: document.getElementById('publisher').value,
            description: document.getElementById('description').value,
            receiptNo: document.getElementById('receiptNo').value,
            currency: document.getElementById('currency').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            quantity: document.getElementById('quantity').value,
            bookPrice: document.getElementById('bookPrice').value,
            customerName: document.getElementById('customerName').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            downloadFileName: document.getElementById('downloadFileName').value,
            template: document.querySelector('input[name="template"]:checked')?.value || 'template2'
        };
        
        localStorage.setItem('bookInvoiceFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('bookInvoiceFormData');
        if (!savedData) {
            // If no saved data, set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('purchaseDate').value = today;
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        document.getElementById('bookAuthor').value = formData.bookAuthor || '';
        document.getElementById('bookStoreName').value = formData.bookStoreName || '';
        document.getElementById('storeAddress').value = formData.storeAddress || '';
        document.getElementById('bookName').value = formData.bookName || '';
        document.getElementById('publisher').value = formData.publisher || '';
        document.getElementById('description').value = formData.description || '';
        document.getElementById('receiptNo').value = formData.receiptNo || '';
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('paymentMethod').value = formData.paymentMethod || '';
        document.getElementById('quantity').value = formData.quantity || '';
        document.getElementById('bookPrice').value = formData.bookPrice || '';
        document.getElementById('customerName').value = formData.customerName || '';
        document.getElementById('downloadFileName').value = formData.downloadFileName || '';
        
        // Set date - use saved value or default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = formData.purchaseDate || today;
        
        // Set template
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || 'template2'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
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
                // Save the current URL to return after login
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
            }
        }, true); // Use capture phase to ensure this runs before the download handler
        
        // Update clear button to also clear localStorage
        const clearBtn = document.getElementById('clearBtn');
        const originalClearBtnClick = clearBtn.onclick;
        clearBtn.onclick = function(e) {
            // Remove the saved form data from localStorage
            localStorage.removeItem('bookInvoiceFormData');
            
            // Reset date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('purchaseDate').value = today;
            
            // Reset radio buttons to default
            document.querySelector('input[name="template"][value="template2"]').checked = true;
            
            // Clear other form fields
            const inputs = form.querySelectorAll('input:not([type="radio"]):not([type="date"]), select, textarea');
            inputs.forEach(input => {
                input.value = '';
            });
            
            updatePreview();
            return false; // Prevent the original click handler from running
        };
    }
});

function updatePreview() {
    // Update receipt number
    const receiptNo = document.getElementById('receiptNo').value || 'R06044';
    document.getElementById('previewReceiptNo').textContent = receiptNo;

    // Update customer name
    const customerName = document.getElementById('customerName').value || '';
    document.getElementById('previewCustomerName').textContent = customerName;

    // Update book name
    const bookName = document.getElementById('bookName').value || '';
    document.getElementById('previewBookName').textContent = bookName;

    // Update author
    const author = document.getElementById('bookAuthor').value || '';
    document.getElementById('previewAuthor').textContent = author;

    // Update publisher
    const publisher = document.getElementById('publisher').value || '';
    document.getElementById('previewPublisher').textContent = publisher;

    // Update store name
    const storeName = document.getElementById('bookStoreName').value || '';
    document.getElementById('previewStoreName').textContent = storeName;

    // Update store address
    const storeAddress = document.getElementById('storeAddress').value || '';
    document.getElementById('previewAddress').textContent = storeAddress;

    // Update payment method
    const paymentMethod = document.getElementById('paymentMethod');
    const paymentText = paymentMethod.value ? paymentMethod.options[paymentMethod.selectedIndex].text : '';
    document.getElementById('previewPayment').textContent = paymentText;

    // Update description
    const description = document.getElementById('description').value || '';
    document.getElementById('previewDescription').textContent = description;

    // Update quantity
    const quantity = document.getElementById('quantity').value || '';
    document.getElementById('previewQty').textContent = quantity;

    // Update price and calculate total
    const price = document.getElementById('bookPrice').value || '';
    const currency = document.getElementById('currency').value === 'INR' ? '₹' : 
                    document.getElementById('currency').value === 'USD' ? '$' : '€';
    
    document.getElementById('previewPrice').textContent = price ? `${currency} ${price}` : '';
    
    const total = quantity && price ? quantity * price : 0;
    document.getElementById('previewTotal').textContent = `${currency} ${total}`;
    document.getElementById('previewGrandTotal').textContent = `${currency} ${total}`;

    // Update date
    const purchaseDate = formatDate(document.getElementById('purchaseDate').value);
    document.getElementById('previewDate').textContent = purchaseDate;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
