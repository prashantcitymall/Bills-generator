document.addEventListener('DOMContentLoaded', function() {
    // Initialize date input with current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('billingDate').value = today;

    // Handle logo source selection
    const urlInput = document.getElementById('urlInput');
    const fileInput = document.getElementById('fileInput');
    const logoSourceInputs = document.getElementsByName('logoSource');

    logoSourceInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'url') {
                urlInput.style.display = 'block';
                fileInput.style.display = 'none';
            } else if (this.value === 'device') {
                urlInput.style.display = 'none';
                fileInput.style.display = 'block';
            } else {
                urlInput.style.display = 'none';
                fileInput.style.display = 'none';
            }
        });
    });

    // Handle form inputs for live preview
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', function() {
        // Clear text inputs and selects
        document.querySelectorAll('input[type="text"], input[type="number"], select').forEach(input => {
            input.value = '';
            input.style.borderColor = ''; // Reset any error styling
        });

        // Reset date to today
        document.getElementById('billingDate').value = today;

        // Reset radio buttons to defaults
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = radio.defaultChecked;
        });

        // Uncheck authorization checkbox
        document.getElementById('logoAuthorization').checked = false;

        // Reset file input if exists
        const fileInput = document.getElementById('logoFile');
        if (fileInput) fileInput.value = '';

        // Show URL input, hide file input
        document.getElementById('urlInput').style.display = 'block';
        document.getElementById('fileInput').style.display = 'none';

        // Update the preview
        updatePreview();
    });

    // Download button functionality
    document.getElementById('downloadBtn').addEventListener('click', function() {
        // Validate required fields
        const required = ['providerName', 'accountNumber', 'customerName', 'planSpeed', 'planPackage', 'tarrifPlan', 'planAmount'];
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

        // Get file name from input or use default
        const fileName = document.getElementById('fileName').value || 'internet_bill';

        // Get the preview container
        const element = document.getElementById('previewContainer');

        // Configure PDF options
        const opt = {
            margin: 10,
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff',
                onrendered: function(canvas) {
                    document.body.appendChild(canvas);
                }
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };

        // Generate PDF
        // First clone the element to avoid modifying the display version
        const printElement = element.cloneNode(true);
        document.body.appendChild(printElement);
        
        // Make sure the element is visible
        printElement.style.display = 'block';
        printElement.style.width = '210mm';
        printElement.style.margin = '0';
        printElement.style.padding = '10mm';
        printElement.style.visibility = 'visible';
        
        // Generate PDF
        html2pdf()
            .from(printElement)
            .set(opt)
            .save()
            .then(() => {
                // Clean up the temporary element
                document.body.removeChild(printElement);
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF. Please try again.');
                // Clean up on error too
                if (document.body.contains(printElement)) {
                    document.body.removeChild(printElement);
                }
            });
    });

    // Initial preview update
    updatePreview();
});

function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    
    // Get all form values with defaults
    const providerName = document.getElementById('providerName').value || 'Provider Name';
    const providerAddress = document.getElementById('providerAddress').value || 'Provider Address';
    const description = document.getElementById('description').value || '';
    const accountNumber = document.getElementById('accountNumber').value || '';
    const billingDate = document.getElementById('billingDate').value;
    const formattedDate = billingDate || new Date().toISOString().split('T')[0];
    const customerName = document.getElementById('customerName').value || 'Customer Name';
    const customerAddress = document.getElementById('customerAddress').value || '';
    const planSpeed = document.getElementById('planSpeed').value || '-';
    const planPackage = document.getElementById('planPackage').value || '-';
    const tarrifPlan = document.getElementById('tarrifPlan').value || '';
    const paymentMethod = document.getElementById('paymentMethod').value || '';
    const planAmount = parseFloat(document.getElementById('planAmount').value) || 0;
    const invoiceNo = document.getElementById('invoiceNo').value || 'IN6584';

    // Calculate GST
    const cgstRate = 9;
    const sgstRate = 9;
    const taxableAmount = planAmount;
    const cgstAmount = (taxableAmount * cgstRate / 100).toFixed(2);
    const sgstAmount = (taxableAmount * sgstRate / 100).toFixed(2);
    const totalAmount = (taxableAmount + parseFloat(cgstAmount) + parseFloat(sgstAmount)).toFixed(2);

    const previewHTML = `
        <div style="background: white; padding: 15px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; width: 100%; max-width: 800px; margin: 0 auto; page-break-inside: avoid;">
            <div style="text-align: right; margin-bottom: 20px;">
                <span style="color: #666;">(Receipt for the Recipient)</span>
            </div>
            
            <div style="margin-top: 20px; margin-bottom: 20px; color: #000;">
                <div style="float: left;">
                    <strong>${providerName}</strong><br>
                    ${providerAddress}
                </div>
                <div style="float: right; text-align: right;">
                    <div>Name: ${customerName}</div>
                    <div>Account No: ${accountNumber}</div>
                </div>
                <div style="float: right; text-align: right; margin-right: 50px;">
                    <div>Invoice No: ${invoiceNo}</div>
                    <div>Account No: ${accountNumber}</div>
                    <div>Bill Date: ${formattedDate}</div>
                </div>
                <div style="clear: both;"></div>
            </div>

            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 24px; color: #666;">
                Bill Generator
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #ff9800;">
                <tr style="background: #fff;">
                    <th style="border: 1px solid #ff9800; padding: 6px; text-align: center; color: #000;">Taxable Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 6px; text-align: center; color: #000;">CGST Rate%</th>
                    <th style="border: 1px solid #ff9800; padding: 6px; text-align: center; color: #000;">CGST Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 6px; text-align: center; color: #000;">SGST Rate%</th>
                    <th style="border: 1px solid #ff9800; padding: 6px; text-align: center; color: #000;">SGST Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 6px; text-align: center; color: #000;">Payments Received ₹</th>
                </tr>
                <tr style="color: #000;">
                    <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${taxableAmount.toFixed(2)}</td>
                    <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${cgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${cgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${sgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${sgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${totalAmount}</td>
                </tr>
            </table>

            <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Service Plan Summary</span>
                    <span>Account No: ${accountNumber} User Name: ${customerName}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ff9800;">
                    <tr style="background: #fff;">
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Plan Speed</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Plan Package</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Plan Validity</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Discount</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Plan Amount</th>
                    </tr>
                    <tr style="color: #000;">
                        <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${planSpeed}</td>
                        <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${planPackage}</td>
                        <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">${tarrifPlan || '-'}</td>
                        <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">0</td>
                        <td style="border: 1px solid #ff9800; padding: 6px; text-align: center;">₹${planAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Receipt Details</span>
                    <span>Account No: ${accountNumber} User Name: ${customerName}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ff9800;">
                    <tr style="background: #fff;">
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Invoice No.</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Internet Service Description</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Amount Incl. Tax</th>
                    </tr>
                    <tr style="color: #000;">
                        <td style="border: 1px solid #ff9800; padding: 8px;">${invoiceNo}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px;">${description}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px;">₹${totalAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 20px 0; color: #000;">
                Registered office address: ${providerAddress}
            </div>

            <div style="margin: 15px 0;">
                <div style="background: #ff9800; color: white; padding: 10px; border-radius: 5px;">
                    Terms and Conditions
                </div>
                <ol style="color: #666; margin-top: 10px;">
                    <li>Cheques to be in favour of "${providerName}"</li>
                    <li>In case of cheque bounce, ₹ 500/- penalty will be applicable.</li>
                    <li>Service provider shall levy late fee charge in case the bill is paid after the due date</li>
                    <li>In case of overdue, the right to deactivate your services is reserved.</li>
                    <li>This invoice is system generated hence signature and stamp is not required</li>
                </ol>
            </div>

            <div style="margin-top: 20px;">
                <div style="background: #ff9800; color: white; padding: 10px; border-radius: 5px;">
                    Acknowledgement Slip
                </div>
                <table style="width: 100%; margin-top: 10px; color: #000;">
                    <tr>
                        <td>AccountNo : ${accountNumber}</td>
                        <td>Subscriber Name : ${customerName}</td>
                        <td>Payment Method : ${paymentMethod}</td>
                    </tr>
                    <tr>
                        <td>Invoice No : ${invoiceNo}</td>
                        <td colspan="2">${description}</td>
                    </tr>
                </table>
            </div>
        </div>
        </div>
    `;

    previewContainer.innerHTML = previewHTML;
}
