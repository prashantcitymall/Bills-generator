// E-commerce Invoice Generator
document.addEventListener('DOMContentLoaded', function() {
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();
    // Function to convert number to words (simplified format)
    function numberToWords(num) {
        const single = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const double = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const formatTens = (num) => {
            if (num < 10) return single[num];
            if (num < 20) return double[num - 10];
            return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + single[num % 10] : '');
        };
        
        if (num === 0) return 'zero';
        
        // Split the number into whole and decimal parts
        let [wholePart, decimalPart] = parseFloat(num).toFixed(2).split('.');
        wholePart = parseInt(wholePart);
        
        let words = '';
        
        // Handle thousands
        if (wholePart >= 1000) {
            words += formatTens(Math.floor(wholePart / 1000)) + ' thousand ';
            wholePart %= 1000;
        }
        
        // Handle hundreds
        if (wholePart >= 100) {
            words += formatTens(Math.floor(wholePart / 100)) + ' hundred ';
            wholePart %= 100;
        }
        
        // Handle tens and units
        if (wholePart > 0) {
            if (words) words += ' ';
            words += formatTens(wholePart);
        }
        
        // Final formatting
        words = words.trim();
        
        return words;
    }
    const previewCard = document.getElementById('previewCard');
    const generateBtn = document.querySelector('.generate-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const addItemBtn = document.querySelector('.add-item-btn');
    const itemsTableBody = document.getElementById('itemsTableBody');
    const templateRadios = document.querySelectorAll('input[name="template"]');
    const form = document.querySelector('.input-form');

    // E-commerce logos URLs
    const amazonLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png';
    const flipkartLogoUrl = 'images/flipkart.png';
    const myntraLogoUrl = 'https://aartisto.com/wp-content/uploads/2020/11/myntra.png';

    // Initialize dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    document.getElementById('invoiceDate').value = today;

    // Add event listeners for live preview
    const inputElements = form.querySelectorAll('input, textarea, select');
    inputElements.forEach(element => {
        element.addEventListener('input', window.updatePreview);
        element.addEventListener('change', window.updatePreview);
    });

    // Add event listener for new item rows
    function setupNewItemRowListeners(row) {
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', window.updatePreview);
            input.addEventListener('change', window.updatePreview);
        });
    }

    // Make updatePreview function global
    window.updatePreview = function() {
        const previewCard = document.getElementById('previewCard');
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
        
        // Common data extraction for all templates
        const customerName = document.getElementById('customerName').value || '[Customer Name]';
        const invoiceNumber = document.getElementById('invoiceNumber').value || '[Invoice Number]';
        const orderNumber = document.getElementById('orderNumber').value || '[Order Number]';
        const soldBy = document.getElementById('soldBy').value || '[Seller Name]';
        const shippingAddress = document.getElementById('shippingAddress').value || '[Shipping Address]';
        const soldByDetails = document.getElementById('soldByDetails').value || '[Seller Details]';
        const panNo = document.getElementById('panNo').value || '[PAN Number]';
        const gstin = document.getElementById('gstin').value || '[GSTIN]';
        const placeOfSupply = document.getElementById('placeOfSupply').value || '[Place of Supply]';
        const placeOfDelivery = document.getElementById('placeOfDelivery').value || '[Place of Delivery]';
        const orderDate = document.getElementById('orderDate').value;
        const invoiceDate = document.getElementById('invoiceDate').value;
        const paymentMethod = document.getElementById('paymentMethod').value || 'Cash';

        // Get items - common for all templates
        const items = [];
        const itemEntries = document.getElementById('itemsContainer').querySelectorAll('.item-entry');
        itemEntries.forEach(entry => {
            const description = entry.querySelector('.item-description').value;
            if (description) {
                items.push({
                    description: description,
                    price: entry.querySelector('.item-price').value || '0',
                    quantity: entry.querySelector('.item-quantity').value || '1',
                    tax: entry.querySelector('.item-tax').value || '2',
                    discount: entry.querySelector('.item-discount').value || '0'
                });
            }
        });
        
        // Calculate totals - common for all templates
        const totalAmount = items.reduce((sum, item) => {
            const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
            const taxAmount = netAmount * (parseFloat(item.tax) / 100);
            return sum + netAmount + taxAmount;
        }, 0);
        
        const amountInWords = totalAmount > 0 ? numberToWords(totalAmount) + ' rupees only' : 'zero rupees only';
        
        if (selectedTemplate === 'amazon') {

            previewCard.innerHTML = `
                <div class="amazon-template">
                    <div class="amazon-header">
                        <img src="${amazonLogoUrl}" alt="Amazon" class="amazon-logo">
                        <div class="invoice-title">
                            Tax Invoice/Bill of Supply/Cash Memo<br>
                            (Original for Recipient)
                        </div>
                    </div>

                    <div class="amazon-details">
                        <div class="seller-details">
                            <strong>Sold By:</strong><br>
                            ${soldBy}<br>
                            IN<br><br>
                            <strong>PAN No:</strong> ${panNo}<br>
                            <strong>GST Registration No:</strong> ${gstin}
                        </div>
                        <div class="billing-details">
                            <strong>Billing Address:</strong><br>
                            ${customerName}<br>
                            ${shippingAddress}<br>
                            IN<br>
                            <strong>State/UT Code:</strong> ${placeOfSupply}<br><br>
                            <strong>Shipping Address:</strong><br>
                            ${customerName}<br>
                            ${shippingAddress}<br>
                            IN<br>
                            <strong>State/UT Code:</strong> ${placeOfDelivery}<br>
                            <strong>Place of Supply:</strong> ${placeOfSupply}<br>
                            <strong>Place of delivery:</strong> ${placeOfDelivery}
                        </div>
                    </div>

                    <div class="order-details">
                        <strong>Order Number:</strong> ${orderNumber}
                        <strong style="margin-left: 2rem;">Order Date:</strong> ${orderDate}
                        <div style="float: right;">
                            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                            <strong>Invoice Details:</strong> ${soldByDetails}<br>
                            <strong>Invoice Date:</strong> ${invoiceDate}
                        </div>
                    </div>

                    <div style="overflow-x: auto; width: 100%;">
                        <table class="amazon-items">
                            <thead>
                                <tr>
                                    <th>Sl.No</th>
                                    <th>Description</th>
                                    <th>Unit Price</th>
                                    <th>Discount</th>
                                    <th>Qty</th>
                                    <th>Net Amount</th>
                                    <th>Tax Rate</th>
                                    <th>Tax Type</th>
                                    <th>Tax Amount</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                        <tbody>
                            ${items.map((item, index) => {
                                const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                const totalAmount = netAmount + taxAmount;
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.description}</td>
                                        <td>₹${item.price}</td>
                                        <td>₹${item.discount}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${netAmount.toFixed(2)}</td>
                                        <td>${item.tax}%</td>
                                        <td>CGST<br>SGST</td>
                                        <td>₹${(taxAmount/2).toFixed(2)}<br>₹${(taxAmount/2).toFixed(2)}</td>
                                        <td>₹${totalAmount.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                            <tr>
                                <td colspan="9" style="text-align: right;"><strong>Total:</strong></td>
                                <td>₹${items.reduce((sum, item) => {
                                    const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                    const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                    return sum + netAmount + taxAmount;
                                }, 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>

                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div class="amount-words">
                            <strong>Amount in words</strong><br>
                            ${(() => {
                                const totalAmount = items.reduce((sum, item) => {
                                    const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                    const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                    return sum + netAmount + taxAmount;
                                }, 0);
                                return totalAmount > 0 ? numberToWords(totalAmount) + ' rupees only' : 'zero rupees only';
                            })()}
                            <div class="signature-section">
                                ${soldBy}<br>
                                Authorized Signatory
                            </div>
                        </div>

                        <div class="tax-note">
                            Whether tax is payable under reverse charge - No
                        </div>
                        
                        <div class="payment-details">
                            <table>
                                <tr>
                                    <td><strong>Payment ID:</strong> ${orderNumber}</td>
                                    <td><strong>Date:</strong> ${invoiceDate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Invoice Value:</strong> ₹${items.reduce((sum, item) => {
                                        const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                        const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                        return sum + netAmount + taxAmount;
                                    }, 0).toFixed(2)}</td>
                                    <td><strong>Payment:</strong> ${paymentMethod}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="footer-note">
                            *ABPL-Amazon Seller Services Pvt. Ltd., ARIPL-Amazon Retail India Pvt. Ltd. (only where Amazon Retail India Pvt. Ltd. fulfillment center is co-located)<br>
                            Please note that this invoice is not a demand for payment
                        </div>
                    </div>
                </div>
            `;
        } else if (selectedTemplate === 'flipkart') {
            previewCard.innerHTML = `
                <div class="flipkart-template">
                    <div class="flipkart-header">
                        <img src="${flipkartLogoUrl}" alt="Flipkart" class="flipkart-logo">
                        <div class="invoice-title">
                            Tax Invoice/Bill of Supply/Cash Memo<br>
                            (Original for Recipient)
                        </div>
                    </div>

                    <div class="flipkart-details">
                        <div class="seller-details">
                            <strong>Sold By:</strong><br>
                            ${soldBy}<br>
                            IN<br><br>
                            <strong>PAN No:</strong> ${panNo}<br>
                            <strong>GST Registration No:</strong> ${gstin}
                        </div>
                        <div class="billing-details">
                            <strong>Billing Address:</strong><br>
                            ${customerName}<br>
                            ${shippingAddress}<br>
                            IN<br>
                            <strong>State/UT Code:</strong> ${placeOfSupply}<br><br>
                            <strong>Shipping Address:</strong><br>
                            ${customerName}<br>
                            ${shippingAddress}<br>
                            IN<br>
                            <strong>State/UT Code:</strong> ${placeOfDelivery}<br>
                            <strong>Place of Supply:</strong> ${placeOfSupply}<br>
                            <strong>Place of delivery:</strong> ${placeOfDelivery}
                        </div>
                    </div>

                    <div class="order-details">
                        <strong>Order Number:</strong> ${orderNumber}
                        <strong style="margin-left: 2rem;">Order Date:</strong> ${orderDate}
                        <div style="float: right;">
                            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                            <strong>Invoice Details:</strong> ${soldByDetails}<br>
                            <strong>Invoice Date:</strong> ${invoiceDate}
                        </div>
                    </div>

                    <div style="overflow-x: auto; width: 100%;">
                        <table class="flipkart-items">
                            <thead>
                                <tr>
                                    <th>Sl.No</th>
                                    <th>Description</th>
                                    <th>Unit Price</th>
                                    <th>Discount</th>
                                    <th>Qty</th>
                                    <th>Net Amount</th>
                                    <th>Tax Rate</th>
                                    <th>Tax Type</th>
                                    <th>Tax Amount</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                        <tbody>
                            ${items.map((item, index) => {
                                const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                const totalAmount = netAmount + taxAmount;
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.description}</td>
                                        <td>₹${item.price}</td>
                                        <td>₹${item.discount}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${netAmount.toFixed(2)}</td>
                                        <td>${item.tax}%</td>
                                        <td>CGST<br>SGST</td>
                                        <td>₹${(taxAmount/2).toFixed(2)}<br>₹${(taxAmount/2).toFixed(2)}</td>
                                        <td>₹${totalAmount.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                            <tr>
                                <td colspan="9" style="text-align: right;"><strong>Total:</strong></td>
                                <td>₹${totalAmount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>

                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div class="amount-words">
                            <strong>Amount in words</strong><br>
                            ${amountInWords}
                            <div class="signature-section">
                                ${soldBy}<br>
                                Authorized Signatory
                            </div>
                        </div>

                        <div class="tax-note">
                            Whether tax is payable under reverse charge - No
                        </div>
                        
                        <div class="payment-details">
                            <table>
                                <tr>
                                    <td><strong>Payment ID:</strong> ${orderNumber}</td>
                                    <td><strong>Date:</strong> ${invoiceDate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Invoice Value:</strong> ₹${totalAmount.toFixed(2)}</td>
                                    <td><strong>Payment:</strong> ${paymentMethod}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="footer-note">
                            *Flipkart Internet Private Limited<br>
                            Please note that this invoice is not a demand for payment
                        </div>
                    </div>
                </div>
            `;
        } else if (selectedTemplate === 'myntra') {
            previewCard.innerHTML = `
                <div class="myntra-template">
                    <div class="myntra-header">
                        <img src="${myntraLogoUrl}" alt="Myntra" class="myntra-logo">
                        <div class="invoice-title">
                            Tax Invoice/Bill of Supply/Cash Memo<br>
                            (Original for Recipient)
                        </div>
                    </div>

                    <div class="myntra-details">
                        <div class="seller-details">
                            <strong>Sold By:</strong><br>
                            ${soldBy}<br>
                            IN<br><br>
                            <strong>PAN No:</strong> ${panNo}<br>
                            <strong>GST Registration No:</strong> ${gstin}
                        </div>
                        <div class="billing-details">
                            <strong>Billing Address:</strong><br>
                            ${customerName}<br>
                            ${shippingAddress}<br>
                            IN<br>
                            <strong>State/UT Code:</strong> ${placeOfSupply}<br><br>
                            <strong>Shipping Address:</strong><br>
                            ${customerName}<br>
                            ${shippingAddress}<br>
                            IN<br>
                            <strong>State/UT Code:</strong> ${placeOfDelivery}<br>
                            <strong>Place of Supply:</strong> ${placeOfSupply}<br>
                            <strong>Place of delivery:</strong> ${placeOfDelivery}
                        </div>
                    </div>

                    <div class="order-details">
                        <strong>Order Number:</strong> ${orderNumber}
                        <strong style="margin-left: 2rem;">Order Date:</strong> ${orderDate}
                        <div style="float: right;">
                            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                            <strong>Invoice Details:</strong> ${soldByDetails}<br>
                            <strong>Invoice Date:</strong> ${invoiceDate}
                        </div>
                    </div>

                    <div style="overflow-x: auto; width: 100%;">
                        <table class="myntra-items">
                            <thead>
                                <tr>
                                    <th>Sl.No</th>
                                    <th>Description</th>
                                    <th>Unit Price</th>
                                    <th>Discount</th>
                                    <th>Qty</th>
                                    <th>Net Amount</th>
                                    <th>Tax Rate</th>
                                    <th>Tax Type</th>
                                    <th>Tax Amount</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                        <tbody>
                            ${items.map((item, index) => {
                                const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                const totalAmount = netAmount + taxAmount;
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.description}</td>
                                        <td>₹${item.price}</td>
                                        <td>₹${item.discount}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${netAmount.toFixed(2)}</td>
                                        <td>${item.tax}%</td>
                                        <td>CGST<br>SGST</td>
                                        <td>₹${(taxAmount/2).toFixed(2)}<br>₹${(taxAmount/2).toFixed(2)}</td>
                                        <td>₹${totalAmount.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                            <tr>
                                <td colspan="9" style="text-align: right;"><strong>Total:</strong></td>
                                <td>₹${totalAmount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>

                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div class="amount-words">
                            <strong>Amount in words</strong><br>
                            ${amountInWords}
                            <div class="signature-section">
                                ${soldBy}<br>
                                Authorized Signatory
                            </div>
                        </div>

                        <div class="tax-note">
                            Whether tax is payable under reverse charge - No
                        </div>
                        
                        <div class="payment-details">
                            <table>
                                <tr>
                                    <td><strong>Payment ID:</strong> ${orderNumber}</td>
                                    <td><strong>Date:</strong> ${invoiceDate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Invoice Value:</strong> ₹${totalAmount.toFixed(2)}</td>
                                    <td><strong>Payment:</strong> ${paymentMethod}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="footer-note">
                            *Myntra Designs Private Limited<br>
                            Please note that this invoice is not a demand for payment
                        </div>
                    </div>
                </div>
            `;
        }
    };

    // Make addNewItemRow function global
    window.addNewItemRow = function(button) {
        // Get the items container
        const itemsContainer = document.getElementById('itemsContainer');
        
        // Get all existing item entries to determine the next item ID
        const existingItems = itemsContainer.querySelectorAll('.item-entry');
        const nextItemId = existingItems.length + 1;
        
        // Create a new item entry
        const newItemEntry = document.createElement('div');
        newItemEntry.className = 'item-entry';
        newItemEntry.dataset.itemId = nextItemId;
        
        // Create the HTML for the new item entry with two rows
        newItemEntry.innerHTML = `
            <div class="item-row">
                <div class="input-field">
                    <label>Description</label>
                    <input type="text" class="item-description" placeholder="Item description" oninput="updatePreview()">
                </div>
                <div class="input-field">
                    <label>Unit Price</label>
                    <input type="number" class="item-price" placeholder="0" min="0" oninput="updatePreview()">
                </div>
                <div class="input-field">
                    <label>Quantity</label>
                    <input type="number" class="item-quantity" placeholder="1" min="0" oninput="updatePreview()">
                </div>
            </div>
            <div class="item-row">
                <div class="input-field">
                    <label>Tax %</label>
                    <input type="number" class="item-tax" placeholder="2" min="0" oninput="updatePreview()">
                </div>
                <div class="input-field">
                    <label>Discount</label>
                    <input type="number" class="item-discount" placeholder="0" min="0" oninput="updatePreview()">
                </div>
                <div class="input-field action-field">
                    <button class="remove-item-btn" onclick="removeItemRow(this)">Remove</button>
                </div>
            </div>
        `;
        
        // Add the new item entry to the container
        itemsContainer.appendChild(newItemEntry);
        
        // If this function was called from a button, change that button's parent item to have a remove button instead of add
        if (button) {
            const parentItem = button.closest('.item-entry');
            const actionField = parentItem.querySelector('.action-field');
            actionField.innerHTML = `
                <button class="remove-item-btn" onclick="removeItemRow(this)">Remove</button>
            `;
        }
        
        updatePreview();
    };
    
    // Function to remove an item row
    window.removeItemRow = function(button) {
        const itemEntry = button.closest('.item-entry');
        itemEntry.remove();
        updatePreview();
    };

    // Make clearForm function global
    window.clearForm = function() {
        // Reset all form inputs
        const form = document.getElementById('ecommerceForm');
        
        // Reset all text inputs, textareas, and selects
        const inputs = form.querySelectorAll('input[type="text"], input[type="number"], textarea, select');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Reset radio buttons to default (first option)
        const radioGroups = {};
        form.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = [];
            }
            radioGroups[radio.name].push(radio);
        });
        
        // Select the first radio button in each group
        Object.values(radioGroups).forEach(group => {
            if (group.length > 0) {
                group[0].checked = true;
            }
        });
        
        // Reset date inputs to current date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('orderDate').value = today;
        document.getElementById('invoiceDate').value = today;
        
        // Clear all item entries except the first one
        const itemsContainer = document.getElementById('itemsContainer');
        const itemEntries = itemsContainer.querySelectorAll('.item-entry');
        
        // Keep only the first item entry and clear its inputs
        if (itemEntries.length > 0) {
            // Clear inputs in the first item entry
            const firstItemInputs = itemEntries[0].querySelectorAll('input');
            firstItemInputs.forEach(input => {
                input.value = '';
            });
            
            // Remove all other item entries
            for (let i = 1; i < itemEntries.length; i++) {
                itemEntries[i].remove();
            }
            
            // Reset the action button to Add
            const actionField = itemEntries[0].querySelector('.action-field');
            actionField.innerHTML = `
                <button class="add-item-btn" onclick="addNewItemRow(this)">Add</button>
            `;
        }
        
        // Update the preview
        updatePreview();
    };

    // Add download PDF functionality
    window.downloadPDF = function() {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // Save the current URL to return after login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        // Update preview first
        updatePreview();
        
        const element = document.getElementById('previewCard');
        const invoiceNumber = document.getElementById('invoiceNumber').value || 'invoice';
        const fileName = `ecommerce-bill-${invoiceNumber}.pdf`;

        // Configure pdf options
        const opt = {
            margin: 1,
            filename: fileName,
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

        // Generate PDF
        html2pdf().set(opt).from(element).save();
    };

    // Event Listeners
    generateBtn.addEventListener('click', window.updatePreview);
    clearBtn.addEventListener('click', window.clearForm);
    addItemBtn.addEventListener('click', window.addNewItemRow);
    templateRadios.forEach(radio => {
        radio.addEventListener('change', window.updatePreview);
    });

    // Initialize preview
    window.updatePreview();
    
    // Function to save form data to localStorage
    function saveFormData() {
        // Get items
        const items = [];
        const itemEntries = document.getElementById('itemsContainer').querySelectorAll('.item-entry');
        itemEntries.forEach(entry => {
            items.push({
                description: entry.querySelector('.item-description')?.value || '',
                price: entry.querySelector('.item-price')?.value || '0',
                quantity: entry.querySelector('.item-quantity')?.value || '1',
                tax: entry.querySelector('.item-tax')?.value || '2',
                discount: entry.querySelector('.item-discount')?.value || '0'
            });
        });
        
        const formData = {
            // Template
            template: document.querySelector('input[name="template"]:checked')?.value || 'amazon',
            
            // Customer and order details
            customerName: document.getElementById('customerName').value,
            invoiceNumber: document.getElementById('invoiceNumber').value,
            soldBy: document.getElementById('soldBy').value,
            orderNumber: document.getElementById('orderNumber').value,
            shippingAddress: document.getElementById('shippingAddress').value,
            soldByDetails: document.getElementById('soldByDetails').value,
            panNo: document.getElementById('panNo').value,
            gstin: document.getElementById('gstin').value,
            placeOfSupply: document.getElementById('placeOfSupply').value,
            placeOfDelivery: document.getElementById('placeOfDelivery').value,
            
            // Payment and dates
            paymentMethod: document.getElementById('paymentMethod').value,
            orderDate: document.getElementById('orderDate').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            
            // Terms checkbox
            termsCheckbox: document.getElementById('termsCheckbox').checked,
            
            // Items
            items: items
        };
        
        localStorage.setItem('ecommerceBillFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('ecommerceBillFormData');
        if (!savedData) {
            // If no saved data, set default date
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('orderDate').value = today;
            document.getElementById('invoiceDate').value = today;
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore template selection
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || 'amazon'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
        }
        
        // Restore customer and order details
        document.getElementById('customerName').value = formData.customerName || '';
        document.getElementById('invoiceNumber').value = formData.invoiceNumber || '';
        document.getElementById('soldBy').value = formData.soldBy || '';
        document.getElementById('orderNumber').value = formData.orderNumber || '';
        document.getElementById('shippingAddress').value = formData.shippingAddress || '';
        document.getElementById('soldByDetails').value = formData.soldByDetails || '';
        document.getElementById('panNo').value = formData.panNo || '';
        document.getElementById('gstin').value = formData.gstin || '';
        document.getElementById('placeOfSupply').value = formData.placeOfSupply || '';
        document.getElementById('placeOfDelivery').value = formData.placeOfDelivery || '';
        
        // Restore payment and dates
        document.getElementById('paymentMethod').value = formData.paymentMethod || 'Cash';
        document.getElementById('orderDate').value = formData.orderDate || new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = formData.invoiceDate || new Date().toISOString().split('T')[0];
        
        // Restore terms checkbox
        document.getElementById('termsCheckbox').checked = formData.termsCheckbox || false;
        
        // Restore items
        if (formData.items && formData.items.length > 0) {
            const itemsContainer = document.getElementById('itemsContainer');
            
            // Clear existing items
            itemsContainer.innerHTML = '';
            
            // Add items from saved data
            formData.items.forEach((item, index) => {
                const itemEntry = document.createElement('div');
                itemEntry.className = 'item-entry';
                itemEntry.dataset.itemId = index + 1;
                
                itemEntry.innerHTML = `
                    <div class="item-row">
                        <div class="input-field">
                            <label>Description</label>
                            <input type="text" class="item-description" placeholder="Item description" oninput="updatePreview()" value="${item.description || ''}">
                        </div>
                        <div class="input-field">
                            <label>Unit Price</label>
                            <input type="number" class="item-price" placeholder="0" min="0" oninput="updatePreview()" value="${item.price || '0'}">
                        </div>
                        <div class="input-field">
                            <label>Quantity</label>
                            <input type="number" class="item-quantity" placeholder="1" min="0" oninput="updatePreview()" value="${item.quantity || '1'}">
                        </div>
                    </div>
                    <div class="item-row">
                        <div class="input-field">
                            <label>Tax %</label>
                            <input type="number" class="item-tax" placeholder="2" min="0" oninput="updatePreview()" value="${item.tax || '2'}">
                        </div>
                        <div class="input-field">
                            <label>Discount</label>
                            <input type="number" class="item-discount" placeholder="0" min="0" oninput="updatePreview()" value="${item.discount || '0'}">
                        </div>
                        <div class="input-field action-field">
                            ${index === 0 ? 
                                `<button class="add-item-btn" onclick="addNewItemRow(this)">Add</button>` : 
                                `<button class="add-item-btn" onclick="addNewItemRow(this)">Add</button>
                                <button class="remove-item-btn" onclick="removeItemRow(this)">Remove</button>`
                            }
                        </div>
                    </div>
                `;
                
                itemsContainer.appendChild(itemEntry);
            });
            
            // Set up listeners for the new rows
            const rows = itemsContainer.querySelectorAll('.item-entry');
            rows.forEach(row => {
                setupNewItemRowListeners(row);
            });
        }
    }
    
    // Function to set up form persistence
    function setupFormPersistence() {
        // Get the form element
        const form = document.getElementById('ecommerceForm');
        
        // Save form data on input changes
        form.addEventListener('input', function() {
            saveFormData();
        });
        
        form.addEventListener('change', function() {
            saveFormData();
        });
        
        // Override clear form function to also clear localStorage
        const originalClearForm = window.clearForm;
        window.clearForm = function() {
            // Remove the saved form data from localStorage
            localStorage.removeItem('ecommerceBillFormData');
            
            // Call the original clearForm function
            originalClearForm();
        };
    }
});
