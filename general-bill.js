document.addEventListener('DOMContentLoaded', function() {
    // Initialize form elements
    const form = document.querySelector('.form-section');
    const preview = document.getElementById('billPreview');
    const taxOptions = document.querySelectorAll('input[name="taxType"]');
    const taxInput = document.querySelector('.tax-input');
    const orderItems = document.getElementById('orderItems');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();

    // Validate form function
    function validateForm() {
        const requiredFields = [
            { field: document.getElementById('customerName'), name: 'Customer Name' },
            { field: document.getElementById('customerLocation'), name: 'Customer Location' },
            { field: document.getElementById('shippingAddress'), name: 'Shipping Address' },
            { field: document.getElementById('shopName'), name: 'Shop Name' },
            { field: document.getElementById('shopAddress'), name: 'Shop Address' },
            { field: document.getElementById('soldByDetails'), name: 'Sold By Details' },
            { field: document.getElementById('invoiceNumber'), name: 'Invoice Number' },
            { field: document.getElementById('orderNumber'), name: 'Order Number' },
            { field: document.getElementById('paymentMethod'), name: 'Payment Method' }
        ];

        for (const { field, name } of requiredFields) {
            if (!field.value.trim()) {
                alert(`Please enter ${name}`);
                field.focus();
                return false;
            }
        }

        // Validate at least one order item
        const firstRow = orderItems.querySelector('tr');
        const description = firstRow.querySelector('.item-description').value;
        const price = firstRow.querySelector('.item-price').value;
        const quantity = firstRow.querySelector('.item-quantity').value;

        if (!description || !price || !quantity) {
            alert('Please enter at least one order item with description, price, and quantity');
            return false;
        }

        return true;
    }

    // Handle tax type selection
    taxOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'none') {
                taxInput.style.display = 'none';
                taxInput.value = '';
            } else {
                taxInput.style.display = 'block';
                taxInput.placeholder = `Enter ${this.value.toUpperCase()} Number`;
            }
            updatePreview();
        });
    });

    // Handle add/remove order items
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-row')) {
            const newRow = orderItems.querySelector('tr').cloneNode(true);
            newRow.querySelectorAll('input').forEach(input => input.value = '');
            orderItems.appendChild(newRow);
            updatePreview();
        }
        if (e.target.closest('.remove-row')) {
            const row = e.target.closest('tr');
            if (orderItems.querySelectorAll('tr').length > 1) {
                row.remove();
                updatePreview();
            }
        }
    });

    // Handle input changes
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);

    // Download PDF function
    downloadBtn.addEventListener('click', () => {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        // User is logged in, proceed with validation and download
        if (!validateForm()) return;

        const element = document.getElementById('billPreview');
        const opt = {
            margin: 1,
            filename: `general-bill-${document.getElementById('invoiceNumber').value || 'invoice'}.pdf`,
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
        html2pdf().set(opt).from(element).save();
    });

    // Clear form function
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the form?')) {
            // Reset all input fields
            form.querySelectorAll('input:not([type="radio"]), select, textarea').forEach(input => {
                input.value = '';
            });
            
            // Reset radio buttons
            form.querySelectorAll('input[type="radio"]').forEach(radio => {
                if (radio.value === 'none') {
                    radio.checked = true;
                } else {
                    radio.checked = false;
                }
            });

            // Reset tax input display
            taxInput.style.display = 'none';
            
            // Keep only one empty row in order items
            const rows = orderItems.querySelectorAll('tr');
            for (let i = 1; i < rows.length; i++) {
                rows[i].remove();
            }
            rows[0].querySelectorAll('input').forEach(input => input.value = '');

            // Reset date to today
            document.getElementById('date').valueAsDate = new Date();
            
            // Update preview
            updatePreview();
        }
    });

    // Update preview function
    function updatePreview() {
        const customerName = document.getElementById('customerName').value;
        const customerLocation = document.getElementById('customerLocation').value;
        const shippingAddress = document.getElementById('shippingAddress').value;
        const shopName = document.getElementById('shopName').value;
        const shopAddress = document.getElementById('shopAddress').value;
        const soldByDetails = document.getElementById('soldByDetails').value;
        const taxType = document.querySelector('input[name="taxType"]:checked').value;
        const taxNumber = document.getElementById('taxNumber').value;
        const currency = document.getElementById('currency').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const invoiceNumber = document.getElementById('invoiceNumber').value;
        const orderNumber = document.getElementById('orderNumber').value;
        const date = document.getElementById('date').value;

        // Calculate order items
        let orderItemsHtml = '';
        let total = 0;
        orderItems.querySelectorAll('tr').forEach(row => {
            const description = row.querySelector('.item-description').value;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
            const tax = parseFloat(row.querySelector('.item-tax').value) || 0;
            const itemTotal = price * quantity * (1 + tax/100);
            total += itemTotal;

            if (description || price || quantity) {
                orderItemsHtml += `
                    <tr>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #000;">${description}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #000; text-align: right;">${currency === 'INR' ? '₹' : '$'} ${price.toFixed(2)}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #000; text-align: center;">${quantity}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #000; text-align: center;">${tax}%</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #000; text-align: right;">${currency === 'INR' ? '₹' : '$'} ${itemTotal.toFixed(2)}</td>
                    </tr>
                `;
            }
        });

        // Update preview HTML
        preview.innerHTML = `
            <div style="font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #333; font-size: 1.5rem; margin-bottom: 5px;">${shopName}</h2>
                    <p style="color: #666; margin: 0; font-size: 0.9rem;">${shopAddress}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                    <p><strong>Order Number:</strong> ${orderNumber}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: #666;">Customer Details</h3>
                        <p><strong>Name:</strong> ${customerName}</p>
                        <p><strong>Location:</strong> ${customerLocation}</p>
                        <p><strong>Shipping Address:</strong><br>${shippingAddress}</p>
                    </div>
                    <div>
                        <h3 style="color: #666;">Shop Details</h3>
                        <p><strong>Name:</strong> ${shopName}</p>
                        <p><strong>Address:</strong><br>${shopAddress}</p>
                        <p><strong>Sold By:</strong><br>${soldByDetails}</p>
                        ${taxType !== 'none' ? `<p><strong>${taxType.toUpperCase()} Number:</strong> ${taxNumber}</p>` : ''}
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'Inter', -apple-system, sans-serif;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px 15px; border-bottom: 2px solid #e9ecef; color: #000; font-weight: 600; text-align: left;">Description</th>
                            <th style="padding: 12px 15px; border-bottom: 2px solid #e9ecef; color: #000; font-weight: 600; text-align: right;">Price</th>
                            <th style="padding: 12px 15px; border-bottom: 2px solid #e9ecef; color: #000; font-weight: 600; text-align: center;">Quantity</th>
                            <th style="padding: 12px 15px; border-bottom: 2px solid #e9ecef; color: #000; font-weight: 600; text-align: center;">Tax</th>
                            <th style="padding: 12px 15px; border-bottom: 2px solid #e9ecef; color: #000; font-weight: 600; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align: right; padding: 12px 15px; border-top: 2px solid #e9ecef; color: #000; font-weight: 600;">Grand Total:</td>
                            <td style="padding: 12px 15px; border-top: 2px solid #e9ecef; color: #000; font-weight: 600; text-align: right;">${currency === 'INR' ? '₹' : '$'} ${total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 20px;">
                    <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                </div>
            </div>
        `;
    }

    // Initial preview update
    updatePreview();
    
    // Function to save form data to localStorage
    function saveFormData() {
        const formData = {
            customerName: document.getElementById('customerName').value,
            customerLocation: document.getElementById('customerLocation').value,
            shippingAddress: document.getElementById('shippingAddress').value,
            shopName: document.getElementById('shopName').value,
            shopAddress: document.getElementById('shopAddress').value,
            soldByDetails: document.getElementById('soldByDetails').value,
            taxType: document.querySelector('input[name="taxType"]:checked').value,
            taxNumber: document.getElementById('taxNumber').value,
            currency: document.getElementById('currency').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            invoiceNumber: document.getElementById('invoiceNumber').value,
            orderNumber: document.getElementById('orderNumber').value,
            date: document.getElementById('date').value,
            orderItems: []
        };
        
        // Save order items
        orderItems.querySelectorAll('tr').forEach(row => {
            formData.orderItems.push({
                description: row.querySelector('.item-description').value,
                price: row.querySelector('.item-price').value,
                quantity: row.querySelector('.item-quantity').value,
                tax: row.querySelector('.item-tax').value
            });
        });
        
        localStorage.setItem('generalBillFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('generalBillFormData');
        if (!savedData) {
            // If no saved data, set default date to today
            document.getElementById('date').valueAsDate = new Date();
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore form fields
        document.getElementById('customerName').value = formData.customerName || '';
        document.getElementById('customerLocation').value = formData.customerLocation || '';
        document.getElementById('shippingAddress').value = formData.shippingAddress || '';
        document.getElementById('shopName').value = formData.shopName || '';
        document.getElementById('shopAddress').value = formData.shopAddress || '';
        document.getElementById('soldByDetails').value = formData.soldByDetails || '';
        document.getElementById('taxNumber').value = formData.taxNumber || '';
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('paymentMethod').value = formData.paymentMethod || '';
        document.getElementById('invoiceNumber').value = formData.invoiceNumber || '';
        document.getElementById('orderNumber').value = formData.orderNumber || '';
        
        // Set date - use saved date or today if no saved date
        if (formData.date) {
            document.getElementById('date').value = formData.date;
        } else {
            document.getElementById('date').valueAsDate = new Date();
        }
        
        // Set tax type
        const taxTypeRadio = document.querySelector(`input[name="taxType"][value="${formData.taxType || 'none'}"]`);
        if (taxTypeRadio) {
            taxTypeRadio.checked = true;
            // Show/hide tax input based on selection
            if (formData.taxType !== 'none') {
                taxInput.style.display = 'block';
                taxInput.placeholder = `Enter ${formData.taxType.toUpperCase()} Number`;
            } else {
                taxInput.style.display = 'none';
            }
        }
        
        // Restore order items
        if (formData.orderItems && formData.orderItems.length > 0) {
            // Clear existing rows except the first one
            const rows = orderItems.querySelectorAll('tr');
            for (let i = 1; i < rows.length; i++) {
                rows[i].remove();
            }
            
            // Fill the first row
            const firstRow = orderItems.querySelector('tr');
            firstRow.querySelector('.item-description').value = formData.orderItems[0].description || '';
            firstRow.querySelector('.item-price').value = formData.orderItems[0].price || '';
            firstRow.querySelector('.item-quantity').value = formData.orderItems[0].quantity || '';
            firstRow.querySelector('.item-tax').value = formData.orderItems[0].tax || '';
            
            // Add additional rows if needed
            for (let i = 1; i < formData.orderItems.length; i++) {
                const newRow = firstRow.cloneNode(true);
                newRow.querySelector('.item-description').value = formData.orderItems[i].description || '';
                newRow.querySelector('.item-price').value = formData.orderItems[i].price || '';
                newRow.querySelector('.item-quantity').value = formData.orderItems[i].quantity || '';
                newRow.querySelector('.item-tax').value = formData.orderItems[i].tax || '';
                orderItems.appendChild(newRow);
            }
        }
    }
    
    // Function to set up form persistence
    function setupFormPersistence() {
        // Save form data on input changes
        form.addEventListener('input', function() {
            saveFormData();
        });
        
        form.addEventListener('change', function() {
            saveFormData();
        });
        
        // Update clear button to also clear localStorage
        const originalClearBtnClick = clearBtn.onclick;
        clearBtn.onclick = function(e) {
            if (confirm('Are you sure you want to clear the form?')) {
                // Reset all input fields
                form.querySelectorAll('input:not([type="radio"]), select, textarea').forEach(input => {
                    input.value = '';
                });
                
                // Reset radio buttons
                form.querySelectorAll('input[type="radio"]').forEach(radio => {
                    if (radio.value === 'none') {
                        radio.checked = true;
                    } else {
                        radio.checked = false;
                    }
                });

                // Reset tax input display
                taxInput.style.display = 'none';
                
                // Keep only one empty row in order items
                const rows = orderItems.querySelectorAll('tr');
                for (let i = 1; i < rows.length; i++) {
                    rows[i].remove();
                }
                rows[0].querySelectorAll('input').forEach(input => input.value = '');

                // Reset date to today
                document.getElementById('date').valueAsDate = new Date();
                
                // Clear localStorage
                localStorage.removeItem('generalBillFormData');
                
                // Update preview
                updatePreview();
            }
        };
        
        // Store current page URL in sessionStorage before redirecting to sign-in
        downloadBtn.addEventListener('click', function() {
            if (!window.authState || !window.authState.isAuthenticated) {
                // Save the current URL to return after login
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
            }
        }, true); // Use capture phase to ensure this runs before the download handler
    }
});
