document.addEventListener('DOMContentLoaded', function() {
    // Initialize date field with current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseDate').value = today;

    // Download functionality
    document.getElementById('downloadBtn').addEventListener('click', async function() {
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

    // Download button functionality
    document.getElementById('downloadBtn').addEventListener('click', function() {
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
            return;
        }

        alert('PDF generation will be implemented in the next phase');
    });

    // Initial preview update
    updatePreview();
});

function updatePreview() {
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
