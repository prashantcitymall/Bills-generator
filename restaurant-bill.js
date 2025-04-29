document.addEventListener('DOMContentLoaded', function() {
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();
    
    // Handle GST radio buttons
    const gstRadios = document.querySelectorAll('input[name="gstType"]');
    const gstInput = document.querySelector('.gst-input');
    
    gstRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            gstInput.style.display = this.value === 'gst' ? 'block' : 'none';
            updatePreview();
        });
    });

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
    
    // Function to save form data to localStorage
    function saveFormData() {
        // Get order table items
        const orderItems = [];
        const orderRows = document.querySelectorAll('#orderTableBody tr');
        orderRows.forEach(row => {
            orderItems.push({
                description: row.querySelector('.item-description')?.value || '',
                price: row.querySelector('.item-price')?.value || '0',
                quantity: row.querySelector('.item-quantity')?.value || '0'
            });
        });
        
        const formData = {
            restaurantName: document.getElementById('restaurantName').value,
            restaurantAddress: document.getElementById('restaurantAddress').value,
            gstType: document.querySelector('input[name="gstType"]:checked')?.value || 'none',
            gstNumber: document.getElementById('gstNumber').value,
            tableNo: document.getElementById('tableNo').value,
            invoiceNo: document.getElementById('invoiceNo').value,
            billDate: document.getElementById('billDate').value,
            billTime: document.getElementById('billTime').value,
            customerName: document.getElementById('customerName').value,
            logoSource: document.querySelector('input[name="logoSource"]:checked')?.value || 'url',
            logoUrl: document.getElementById('logoUrl').value,
            logoAuth: document.getElementById('logoAuth').checked,
            currency: document.getElementById('currency').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            taxPercentage: document.getElementById('taxPercentage').value,
            fileName: document.getElementById('fileName').value,
            template: document.querySelector('input[name="template"]:checked')?.value || '2',
            orderItems: orderItems
        };
        
        localStorage.setItem('restaurantBillFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('restaurantBillFormData');
        if (!savedData) {
            // If no saved data, set default date and time
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];
            
            document.getElementById('billDate').value = today;
            document.getElementById('billTime').value = currentTime;
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        document.getElementById('restaurantName').value = formData.restaurantName || '';
        document.getElementById('restaurantAddress').value = formData.restaurantAddress || '';
        document.getElementById('gstNumber').value = formData.gstNumber || '';
        document.getElementById('tableNo').value = formData.tableNo || '';
        document.getElementById('invoiceNo').value = formData.invoiceNo || '';
        document.getElementById('customerName').value = formData.customerName || '';
        document.getElementById('logoUrl').value = formData.logoUrl || '';
        document.getElementById('logoAuth').checked = formData.logoAuth || false;
        document.getElementById('paymentMethod').value = formData.paymentMethod || '';
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('taxPercentage').value = formData.taxPercentage || '0';
        document.getElementById('fileName').value = formData.fileName || '';
        
        // Set date and time - use saved values or defaults
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];
        document.getElementById('billDate').value = formData.billDate || today;
        document.getElementById('billTime').value = formData.billTime || currentTime;
        
        // Set GST type
        const gstTypeRadio = document.querySelector(`input[name="gstType"][value="${formData.gstType || 'none'}"]`);
        if (gstTypeRadio) {
            gstTypeRadio.checked = true;
            // Show/hide GST input field based on selection
            const gstInput = document.querySelector('.gst-input');
            gstInput.style.display = formData.gstType === 'gst' ? 'block' : 'none';
        }
        
        // Set template
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || '2'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
        }
        
        // Set logo source
        const logoSourceRadio = document.querySelector(`input[name="logoSource"][value="${formData.logoSource || 'url'}"]`);
        if (logoSourceRadio) {
            logoSourceRadio.checked = true;
        }
        
        // Restore order items
        if (formData.orderItems && formData.orderItems.length > 0) {
            const orderTable = document.getElementById('orderTableBody');
            
            // Clear existing rows except the first one
            while (orderTable.children.length > 1) {
                orderTable.removeChild(orderTable.lastChild);
            }
            
            // Populate the first row
            const firstRow = orderTable.firstElementChild;
            if (firstRow && formData.orderItems[0]) {
                firstRow.querySelector('.item-description').value = formData.orderItems[0].description || '';
                firstRow.querySelector('.item-price').value = formData.orderItems[0].price || '0';
                firstRow.querySelector('.item-quantity').value = formData.orderItems[0].quantity || '0';
                
                const price = parseFloat(formData.orderItems[0].price) || 0;
                const quantity = parseFloat(formData.orderItems[0].quantity) || 0;
                const total = price * quantity;
                firstRow.querySelector('.item-total').textContent = `₹${total.toFixed(2)}`;
            }
            
            // Add additional rows if needed
            for (let i = 1; i < formData.orderItems.length; i++) {
                const item = formData.orderItems[i];
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td><input type="text" class="item-description" value="${item.description || ''}"></td>
                    <td><input type="number" class="item-price" value="${item.price || '0'}"></td>
                    <td><input type="number" class="item-quantity" value="${item.quantity || '0'}"></td>
                    <td class="item-total">₹${((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}</td>
                    <td>
                        <button class="add-row">+</button>
                        <button class="remove-row">-</button>
                    </td>
                `;
                orderTable.appendChild(newRow);
            }
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
        
        // Save form data when order table changes
        const orderTable = document.getElementById('orderTableBody');
        orderTable.addEventListener('input', function() {
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
            localStorage.removeItem('restaurantBillFormData');
            
            // Reset date and time to current values
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];
            
            document.getElementById('billDate').value = today;
            document.getElementById('billTime').value = currentTime;
            
            // Reset radio buttons to defaults
            document.querySelector('input[name="template"][value="2"]').checked = true;
            document.querySelector('input[name="gstType"][value="none"]').checked = true;
            document.querySelector('input[name="logoSource"][value="url"]').checked = true;
            
            // Hide GST input
            document.querySelector('.gst-input').style.display = 'none';
            
            // Reset checkbox
            document.getElementById('logoAuth').checked = false;
            
            // Reset order table
            const orderTable = document.getElementById('orderTableBody');
            while (orderTable.children.length > 1) {
                orderTable.removeChild(orderTable.lastChild);
            }
            const firstRow = orderTable.firstElementChild;
            firstRow.querySelector('.item-description').value = '';
            firstRow.querySelector('.item-price').value = '0';
            firstRow.querySelector('.item-quantity').value = '0';
            firstRow.querySelector('.item-total').textContent = '₹0';
            
            // Reset other form fields
            document.getElementById('restaurantName').value = '';
            document.getElementById('restaurantAddress').value = '';
            document.getElementById('gstNumber').value = '';
            document.getElementById('tableNo').value = '';
            document.getElementById('invoiceNo').value = '';
            document.getElementById('customerName').value = '';
            document.getElementById('logoUrl').value = '';
            document.getElementById('paymentMethod').value = '';
            document.getElementById('taxPercentage').value = '0';
            document.getElementById('fileName').value = '';
            
            updatePreview();
            return false; // Prevent the original click handler from running
        };
    }
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
                <div class="restaurant-name premium-input">${restaurantName}</div>
                <div class="restaurant-address premium-input" style="display: block; margin-top: 5px; color: #666;">${restaurantAddress}</div>
                ${document.getElementById('gstNo').checked ? `<div class="restaurant-gst">GST No: <span class="premium-input">${document.getElementById('gstNumber').value || ''}</span></div>` : ''}
            </div>
            <div class="receipt-line"></div>
            <div style="text-align: center; margin: 10px 0;">RECEIPT</div>
            <div class="receipt-line"></div>
            
            <div class="receipt-header">
                <div class="header-row">
                    <div><span class="label">Name:</span> <span class="premium-input">${customerName || '-'}</span></div>
                    <div><span class="label">Table:</span> <span class="premium-input">${tableNo}</span></div>
                </div>
                <div class="header-row">
                    <div><span class="label">Invoice No:</span> <span class="premium-input">${invoiceNo}</span></div>
                    <div><span class="label">Date:</span> <span class="premium-input">${billDate}</span></div>
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
                    <span class="label">Sub-Total:</span>
                    <span class="premium-input">₹ ${subTotal.toFixed(0)}</span>
                </div>
                <div class="summary-row">
                    <span class="label">CGST: ${taxPercentage/2}%</span>
                    <span class="premium-input">₹ ${(taxAmount/2).toFixed(0)}</span>
                </div>
                <div class="summary-row">
                    <span class="label">SGST: ${taxPercentage/2}%</span>
                    <span class="premium-input">₹ ${(taxAmount/2).toFixed(0)}</span>
                </div>
            </div>
            
            <div class="receipt-line"></div>
            
            <div class="summary-row">
                <span class="label">Mode:</span> <span class="premium-input">${document.getElementById('paymentMethod').value || '-'}</span>
                <span class="label">Total:</span> <span class="premium-input">₹ ${total.toFixed(0)}</span>
            </div>
            
            <div class="receipt-line"></div>
            
            <div class="receipt-footer">
                <div class="nature-text">**SAVE PAPER SAVE NATURE !!</div>
                <div class="time-text"><span class="label">Time:</span> <span class="premium-input">${billTime}</span></div>
            </div>
            
            <div class="receipt-line"></div>
            
            <div class="receipt-watermark">
                <small>Watermark will be removed from actual pdf</small>
            </div>
        </div>
    `;

    previewContainer.innerHTML = receiptHTML;
    
    // Apply premium input styling to filled elements
    applyPremiumInputStyling();
}

// Helper function to toggle premium input class based on content
function togglePremiumInputClass(element) {
    if (!element) return;
    
    const content = element.textContent;
    if (content && content.trim() !== '' && content !== '-') {
        element.classList.add('filled');
    } else {
        element.classList.remove('filled');
    }
}

// Apply premium input styling to all premium input elements
function applyPremiumInputStyling() {
    const premiumInputs = document.querySelectorAll('.premium-input');
    premiumInputs.forEach(element => {
        togglePremiumInputClass(element);
    });
}
