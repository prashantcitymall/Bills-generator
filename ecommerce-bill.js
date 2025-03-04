// E-commerce Invoice Generator
document.addEventListener('DOMContentLoaded', function() {
    const previewCard = document.getElementById('previewCard');
    const generateBtn = document.querySelector('.generate-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const addItemBtn = document.querySelector('.add-item-btn');
    const itemsTableBody = document.getElementById('itemsTableBody');
    const templateRadios = document.querySelectorAll('input[name="template"]');
    const form = document.querySelector('.input-form');

    // Amazon logo URL
    const amazonLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png';

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
        
        if (selectedTemplate === 'amazon') {
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

            // Get items
            const items = [];
            const rows = document.getElementById('itemsTableBody').querySelectorAll('tr');
            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                if (inputs[0].value) {
                    items.push({
                        description: inputs[0].value,
                        price: inputs[1].value || '0',
                        quantity: inputs[2].value || '1',
                        tax: inputs[3].value || '2',
                        discount: inputs[4].value || '0'
                    });
                }
            });

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

                    <table class="amazon-items">
                        <thead>
                            <tr>
                                <th>Sl.<br>No</th>
                                <th>Description</th>
                                <th>Unit<br>Price</th>
                                <th>Discount</th>
                                <th>Qty</th>
                                <th>Net<br>Amount</th>
                                <th>Tax<br>Rate</th>
                                <th>Tax<br>Type</th>
                                <th>Tax<br>Amount</th>
                                <th>Total<br>Amount</th>
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

                    <div class="amount-words">
                        <strong>Amount in words</strong><br>
                        Only
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
                                <td><strong>Payment Transaction ID:</strong> ${orderNumber}</td>
                                <td><strong>Date & Time:</strong> ${invoiceDate}</td>
                                <td><strong>Invoice Value:</strong> ₹${items.reduce((sum, item) => {
                                    const netAmount = parseFloat(item.price) * parseFloat(item.quantity);
                                    const taxAmount = netAmount * (parseFloat(item.tax) / 100);
                                    return sum + netAmount + taxAmount;
                                }, 0).toFixed(2)}</td>
                                <td><strong>Mode of Payment:</strong> ${paymentMethod}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="footer-note">
                        *ABPL-Amazon Seller Services Pvt. Ltd., ARIPL-Amazon Retail India Pvt. Ltd. (only where Amazon Retail India Pvt. Ltd. fulfillment center is co-located)<br>
                        Please note that this invoice is not a demand for payment
                    </div>
                </div>
            `;
        }
    };

    // Make addNewItemRow function global
    window.addNewItemRow = function() {
        const itemsTableBody = document.getElementById('itemsTableBody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" placeholder="Item description" oninput="updatePreview()"></td>
            <td><input type="number" placeholder="0" min="0" oninput="updatePreview()"></td>
            <td><input type="number" placeholder="1" min="0" oninput="updatePreview()"></td>
            <td><input type="number" placeholder="2" min="0" oninput="updatePreview()"></td>
            <td><input type="number" placeholder="0" min="0" oninput="updatePreview()"></td>
            <td>
                <button class="add-item-btn" onclick="addNewItemRow()">Add</button>
                <button class="remove-item-btn" onclick="this.closest('tr').remove(); updatePreview()" style="background: #f44336; margin-left: 0.5rem;">Remove</button>
            </td>
        `;
        itemsTableBody.appendChild(newRow);
        updatePreview();
    };

    // Make clearForm function global
    window.clearForm = function() {
        document.getElementById('ecommerceForm').reset();
        const itemsTableBody = document.getElementById('itemsTableBody');
        while (itemsTableBody.children.length > 1) {
            itemsTableBody.removeChild(itemsTableBody.lastChild);
        }
        const firstRowInputs = itemsTableBody.querySelector('tr').querySelectorAll('input');
        firstRowInputs.forEach(input => input.value = '');
        updatePreview();
    };

    // Add download PDF functionality
    window.downloadPDF = function() {
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
});
