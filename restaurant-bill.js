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
    document.getElementById('downloadBtn').addEventListener('click', () => {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        if (!validateForm()) return;

        const element = document.getElementById('previewContainer');
        const watermark = element.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';

        const opt = {
            margin: 1,
            filename: `restaurant-bill-${document.getElementById('invoiceNo').value || 'RB001'}.pdf`,
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
            { field: document.getElementById('restaurantName'), name: 'Restaurant Name' },
            { field: document.getElementById('restaurantAddress'), name: 'Restaurant Address' },
            { field: document.getElementById('invoiceNo'), name: 'Invoice Number' },
            { field: document.getElementById('billDate'), name: 'Bill Date' },
            { field: document.getElementById('billTime'), name: 'Bill Time' },
            { field: document.getElementById('paymentMethod'), name: 'Payment Method' }
        ];

        // Check if at least one item is added to the order
        const orderTable = document.getElementById('orderTableBody');
        const rows = orderTable.querySelectorAll('tr');
        let hasValidItem = false;

        for (const row of rows) {
            const description = row.querySelector('.item-description').value;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;

            if (description && price > 0 && quantity > 0) {
                hasValidItem = true;
                break;
            }
        }

        if (!hasValidItem) {
            alert('Please add at least one item to the order');
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
            <div class="receipt-line"></div>
            <div style="text-align: center; margin: 10px 0;">RECEIPT</div>
            <div class="receipt-line"></div>
            
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
            
            <div class="receipt-line"></div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; margin: 10px 0; text-align: left;">
                <div>Item</div>
                <div>Price</div>
                <div>Qty</div>
                <div>Total</div>
            </div>
            
            <div class="receipt-line"></div>
            
            ${items.map(item => `
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; margin: 5px 0; text-align: left;">
                    <div>${item.description || '-'}</div>
                    <div>₹ ${item.price}</div>
                    <div>${item.quantity}</div>
                    <div>₹ ${item.total.toFixed(0)}</div>
                </div>
            `).join('')}
            ${items.length === 0 ? `
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; margin: 5px 0; text-align: left;">
                    <div>-</div>
                    <div>₹ 0</div>
                    <div>0</div>
                    <div>₹ 0</div>
                </div>
            ` : ''}
            
            <div class="receipt-line"></div>
            
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
            
            <div class="receipt-line"></div>
            
            <div class="summary-row">
                <span>Mode: ${document.getElementById('paymentMethod').value || '-'}</span>
                <span>Total: ₹ ${total.toFixed(0)}</span>
            </div>
            
            <div class="receipt-line"></div>
            
            <div class="receipt-footer">
                <div class="nature-text">**SAVE PAPER SAVE NATURE !!</div>
                <div class="time-text">Time: ${billTime}</div>
            </div>
            
            <div class="receipt-line"></div>
            
            <div class="receipt-watermark">
                <small>Watermark will be removed from actual pdf</small>
            </div>
        </div>
    `;

    previewContainer.innerHTML = receiptHTML;
}
