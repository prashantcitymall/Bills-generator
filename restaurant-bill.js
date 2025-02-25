document.addEventListener('DOMContentLoaded', function() {
    // Handle GST radio buttons
    const gstRadios = document.querySelectorAll('input[name="gstType"]');
    const gstInput = document.querySelector('.gst-input');
    
    gstRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            gstInput.style.display = this.value === 'gst' ? 'block' : 'none';
            updatePreview();
        });
    });

    // Initialize date and time with current values
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    document.getElementById('billDate').value = today;
    document.getElementById('billTime').value = currentTime;

    // Handle form inputs for live preview
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Handle order table rows
    const orderTable = document.getElementById('orderTableBody');
    
    // Add row button click handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-row')) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="item-description"></td>
                <td><input type="number" class="item-price" value="0"></td>
                <td><input type="number" class="item-quantity" value="0"></td>
                <td class="item-total">₹0</td>
                <td>
                    <button class="add-row">+</button>
                    <button class="remove-row">-</button>
                </td>
            `;
            orderTable.appendChild(newRow);
            updatePreview();
        } else if (e.target.classList.contains('remove-row')) {
            if (orderTable.children.length > 1) {
                e.target.closest('tr').remove();
                updatePreview();
            }
        }
    });

    // Handle order table input changes
    orderTable.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-price') || e.target.classList.contains('item-quantity')) {
            const row = e.target.closest('tr');
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const total = price * quantity;
            row.querySelector('.item-total').textContent = `₹${total.toFixed(2)}`;
            updatePreview();
        }
    });

    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', function() {
        // Clear text inputs and textareas
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
            input.value = '';
        });
        
        // Reset date and time
        document.getElementById('billDate').value = today;
        document.getElementById('billTime').value = currentTime;
        
        // Reset radio buttons to defaults
        document.querySelector('input[name="template"][value="2"]').checked = true;
        document.querySelector('input[name="gstType"][value="none"]').checked = true;
        document.querySelector('input[name="logoSource"][value="url"]').checked = true;
        
        // Reset checkbox
        document.getElementById('logoAuth').checked = false;
        
        // Reset order table
        while (orderTable.children.length > 1) {
            orderTable.removeChild(orderTable.lastChild);
        }
        const firstRow = orderTable.firstElementChild;
        firstRow.querySelector('.item-description').value = '';
        firstRow.querySelector('.item-price').value = '0';
        firstRow.querySelector('.item-quantity').value = '0';
        firstRow.querySelector('.item-total').textContent = '₹0';
        
        // Reset selects
        document.getElementById('paymentMethod').value = '';
        document.getElementById('currency').value = 'INR';
        
        updatePreview();
    });

    // Download button functionality
    document.getElementById('downloadBtn').addEventListener('click', async function() {
        // Validate required fields
        const required = ['restaurantName', 'billDate', 'billTime'];
        let isValid = true;

        required.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value) {
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

        const previewContent = document.getElementById('previewContainer');
        const fileName = document.getElementById('fileName').value || 'restaurant-bill';

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

            // Add image to PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // If content fits on one page
            if (imgHeight <= pageHeight) {
                doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            } else {
                // If content needs multiple pages
                let heightLeft = imgHeight;
                let position = 0;
                let page = 1;

                while (heightLeft > 0) {
                    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                    position -= pageHeight;

                    if (heightLeft > 0) {
                        doc.addPage();
                        page++;
                    }
                }
            }

            // Save the PDF
            doc.save(`${fileName}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    });

    // Initial preview update
    updatePreview();
});

function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    
    // Get form values
    const restaurantName = document.getElementById('restaurantName').value || 'Restaurant Name';
    const restaurantAddress = document.getElementById('restaurantAddress').value || '';
    const tableNo = document.getElementById('tableNo').value || '08';
    const invoiceNo = document.getElementById('invoiceNo').value || '4413';
    const billDate = document.getElementById('billDate').value;
    const billTime = document.getElementById('billTime').value || '22:19';
    const customerName = document.getElementById('customerName').value || '';

    // Calculate totals
    let subTotal = 0;
    const items = [];
    document.querySelectorAll('#orderTableBody tr').forEach(row => {
        const description = row.querySelector('.item-description')?.value || '';
        const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
        const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
        const total = price * quantity;
        
        // Always add the item to show empty fields in preview
        items.push({ description, price, quantity, total });
        
        // Only add to subtotal if there are actual values
        if (price > 0 && quantity > 0) {
            subTotal += total;
        }
    });

    // Calculate tax
    const taxPercentage = parseFloat(document.getElementById('taxPercentage').value) || 0;
    const taxAmount = (subTotal * taxPercentage / 100);
    const total = subTotal + taxAmount;

    // Create receipt HTML
    const receiptHTML = `
        <div class="receipt-preview" style="color: #000;">
            <div class="restaurant-details">
                <div class="restaurant-name">${restaurantName}</div>
                <div class="restaurant-address">${restaurantAddress}</div>
                ${document.getElementById('gstNo').checked ? `<div class="restaurant-gst">GST No: ${document.getElementById('gstNumber').value || ''}</div>` : ''}
            </div>
            <div class="receipt-line">---------------- RECEIPT ----------------</div>
            
            <div class="receipt-header">
                <div class="header-row">
                    <div>Name: ${customerName || '-'}</div>
                    <div>Table: ${tableNo}</div>
                </div>
                <div class="header-row">
                    <div>Invoice No: ${invoiceNo}</div>
                    <div>Date: ${billDate}</div>
                </div>
            </div>
            
            <div class="receipt-line">----------------------------------------</div>
            
            <div class="table-header">
                <div class="header-cell">Item</div>
                <div class="header-cell">Price</div>
                <div class="header-cell">Qty</div>
                <div class="header-cell">Total</div>
            </div>
            
            <div class="receipt-line">----------------------------------------</div>
            
            ${items.map(item => `
                <div class="table-row">
                    <div class="table-cell">${item.description || '-'}</div>
                    <div class="table-cell">₹ ${item.price}</div>
                    <div class="table-cell">${item.quantity}</div>
                    <div class="table-cell">₹ ${item.total.toFixed(0)}</div>
                </div>
            `).join('')}
            ${items.length === 0 ? `
                <div class="table-row">
                    <div class="table-cell">-</div>
                    <div class="table-cell">₹ 0</div>
                    <div class="table-cell">0</div>
                    <div class="table-cell">₹ 0</div>
                </div>
            ` : ''}
            
            <div class="receipt-line">----------------------------------------</div>
            
            <div class="summary-section">
                <div class="summary-row">
                    <span>Sub-Total:</span>
                    <span>₹ ${subTotal.toFixed(0)}</span>
                </div>
                <div class="summary-row">
                    <span>CGST: ${taxPercentage/2}%</span>
                    <span>₹ ${(taxAmount/2).toFixed(0)}</span>
                </div>
                <div class="summary-row">
                    <span>SGST: ${taxPercentage/2}%</span>
                    <span>₹ ${(taxAmount/2).toFixed(0)}</span>
                </div>
            </div>
            
            <div class="receipt-line">----------------------------------------</div>
            
            <div class="summary-row">
                <span>Mode: ${document.getElementById('paymentMethod').value || '-'}</span>
                <span>Total: ₹ ${total.toFixed(0)}</span>
            </div>
            
            <div class="receipt-line">----------------------------------------</div>
            
            <div class="receipt-footer">
                <div class="nature-text">**SAVE PAPER SAVE NATURE !!</div>
                <div class="time-text">Time: ${billTime}</div>
            </div>
            
            <div class="receipt-line">----------------------------------------</div>
            
            <div class="receipt-watermark">
                <small>Watermark will be removed from actual pdf</small>
            </div>
        </div>
    `;

    previewContainer.innerHTML = receiptHTML;
}
