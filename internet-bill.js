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
        // Clear text, number inputs and selects
        document.querySelectorAll('input[type="text"], input[type="number"], select').forEach(input => {
            input.value = '';
        });
        
        // Reset date to today
        document.getElementById('billingDate').value = today;
        
        // Reset radio buttons to defaults
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (radio.defaultChecked) {
                radio.checked = true;
            } else {
                radio.checked = false;
            }
        });
        
        // Reset checkbox
        document.getElementById('logoAuthorization').checked = false;
        
        // Update preview
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

        const element = document.querySelector('.preview-container');
        const watermark = element.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';

        const opt = {
            margin: 1,
            filename: `internet-bill-${document.getElementById('invoiceNo').value || 'IN6584'}.pdf`,
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
            { field: document.getElementById('providerName'), name: 'Provider Name' },
            { field: document.getElementById('providerAddress'), name: 'Provider Address' },
            { field: document.getElementById('accountNumber'), name: 'Account Number' },
            { field: document.getElementById('customerName'), name: 'Customer Name' },
            { field: document.getElementById('customerAddress'), name: 'Customer Address' },
            { field: document.getElementById('planSpeed'), name: 'Plan Speed' },
            { field: document.getElementById('planPackage'), name: 'Plan Package' },
            { field: document.getElementById('tarrifPlan'), name: 'Tarrif Plan' },
            { field: document.getElementById('planAmount'), name: 'Plan Amount' }
        ];

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
    
    // Get selected template
    const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
    
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

    let previewHTML = '';
    
    if (selectedTemplate === '1') {
        // Template 1 (Airtel)
        previewHTML = `
        <div style="background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative;">
            <div style="text-align: right; margin-bottom: 20px;">
                <span style="color: #666;">(Receipt for the Recipient)</span>
            </div>
            
            <div style="margin-top: 30px; margin-bottom: 40px; color: #000;">
                <div style="float: left;">
                    <img src="images/airtel.png" alt="Airtel Logo" style="width: 80px; margin-bottom: 10px; display: block;"><br>
                    <strong style="font-weight: bold; color: #000000;">${providerName}</strong><br>
                    <span style="font-weight: bold; color: #000000;">${providerAddress}</span>
                </div>
                <div style="float: right; text-align: right;">
                    <div>Name: <span style="font-weight: bold; color: #000000;">${customerName}</span></div>
                    <div>Account No: <span style="font-weight: bold; color: #000000;">${accountNumber}</span></div>
                </div>
                <div style="float: right; text-align: right; margin-right: 50px;">
                    <div>Invoice No: <span style="font-weight: bold; color: #000000;">${invoiceNo}</span></div>
                    <div>Account No: <span style="font-weight: bold; color: #000000;">${accountNumber}</span></div>
                    <div>Bill Date: <span style="font-weight: bold; color: #000000;">${formattedDate}</span></div>
                </div>
                <div style="clear: both;"></div>
            </div>

            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 24px; color: #666;">
                Bill Generator
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ff9800;">
                <tr style="background: #fff;">
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">Taxable Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">CGST Rate%</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">CGST Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">SGST Rate%</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">SGST Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">Payments Received ₹</th>
                </tr>
                <tr style="color: #000;">
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${taxableAmount.toFixed(2)}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${cgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${cgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${sgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${sgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${totalAmount}</td>
                </tr>
            </table>

            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Service Plan Summary</span>
                    <span></span>
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
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${planSpeed}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${planPackage}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${tarrifPlan || '-'}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">0</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">₹${planAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Receipt Details</span>
                    <span></span>
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ff9800;">
                    <tr style="background: #fff;">
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Invoice No.</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Internet Service Description</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Amount Incl. Tax</th>
                    </tr>
                    <tr style="color: #000;">
                        <td style="border: 1px solid #ff9800; padding: 8px; font-weight: bold; color: #000000; text-align: center;">${invoiceNo}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; font-weight: bold; color: #000000; text-align: center;">${description}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; font-weight: bold; color: #000000; text-align: center;">₹${totalAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 20px 0; color: #000;">
                Registered office address: <span style="font-weight: bold; color: #000000;">${providerAddress}</span>
            </div>

            <div style="margin: 20px 0;">
                <div style="background: #ff9800; color: white; padding: 10px; border-radius: 5px;">
                    Terms and Conditions
                </div>
                <ol style="color: #666; margin-top: 10px;">
                    <li>Cheques to be in favour of "<span style="font-weight: bold; color: #000000;">${providerName}</span>"</li>
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
                        <td style="text-align: center;">AccountNo : <span style="font-weight: bold; color: #000000;">${accountNumber}</span></td>
                        <td style="text-align: center;">Subscriber Name : <span style="font-weight: bold; color: #000000;">${customerName}</span></td>
                        <td style="text-align: center;">Payment Method : <span style="font-weight: bold; color: #000000;">${paymentMethod}</span></td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">Invoice No : <span style="font-weight: bold; color: #000000;">${invoiceNo}</span></td>
                        <td colspan="2" style="text-align: center;"><span style="font-weight: bold; color: #000000;">${description}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        </div>
    `;

    } else if (selectedTemplate === '2') {
        // Template 2 (Jio)
        previewHTML = `
        <div style="background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative;">
            <div style="text-align: right; margin-bottom: 20px;">
                <span style="color: #666;">(Receipt for the Recipient)</span>
            </div>
            
            <div style="margin-top: 30px; margin-bottom: 40px; color: #000;">
                <div style="float: left;">
                    <img src="images/jio.png" alt="Jio Logo" style="width: 80px; margin-bottom: 10px; display: block;"><br>
                    <strong style="font-weight: bold; color: #000000;">${providerName}</strong><br>
                    <span style="font-weight: bold; color: #000000;">${providerAddress}</span>
                </div>
                <div style="float: right; text-align: right;">
                    <div>Name: <span style="font-weight: bold; color: #000000;">${customerName}</span></div>
                    <div>Account No: <span style="font-weight: bold; color: #000000;">${accountNumber}</span></div>
                </div>
                <div style="float: right; text-align: right; margin-right: 50px;">
                    <div>Invoice No: <span style="font-weight: bold; color: #000000;">${invoiceNo}</span></div>
                    <div>Account No: <span style="font-weight: bold; color: #000000;">${accountNumber}</span></div>
                    <div>Bill Date: <span style="font-weight: bold; color: #000000;">${formattedDate}</span></div>
                </div>
                <div style="clear: both;"></div>
            </div>

            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 24px; color: #666;">
                Bill Generator
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #020b17;">
                <tr style="background: #f5f5f5;">
                    <th style="border: 1px solid #020b17; padding: 8px; text-align: center; color: #000;">Taxable Amount ₹</th>
                    <th style="border: 1px solid #020b17; padding: 8px; text-align: center; color: #000;">CGST Rate%</th>
                    <th style="border: 1px solid #020b17; padding: 8px; text-align: center; color: #000;">CGST Amount ₹</th>
                    <th style="border: 1px solid #020b17; padding: 8px; text-align: center; color: #000;">SGST Rate%</th>
                    <th style="border: 1px solid #020b17; padding: 8px; text-align: center; color: #000;">SGST Amount ₹</th>
                    <th style="border: 1px solid #020b17; padding: 8px; text-align: center; color: #000;">Payments Received ₹</th>
                </tr>
                <tr style="color: #000;">
                    <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${taxableAmount.toFixed(2)}</td>
                    <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${cgstRate}%</td>
                    <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${cgstAmount}</td>
                    <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${sgstRate}%</td>
                    <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${sgstAmount}</td>
                    <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${totalAmount}</td>
                </tr>
            </table>

            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Service Plan Summary</span>
                    <span></span>
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #020b17;">
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Plan Speed</th>
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Plan Package</th>
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Plan Validity</th>
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Discount</th>
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Plan Amount</th>
                    </tr>
                    <tr style="color: #000;">
                        <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${planSpeed}</td>
                        <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${planPackage}</td>
                        <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${tarrifPlan || '-'}</td>
                        <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">0</td>
                        <td style="border: 1px solid #020b17; padding: 8px; text-align: center; font-weight: bold; color: #000000;">₹${planAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Receipt Details</span>
                    <span></span>
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #020b17;">
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Invoice No.</th>
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Internet Service Description</th>
                        <th style="border: 1px solid #020b17; padding: 8px; color: #000;">Amount Incl. Tax</th>
                    </tr>
                    <tr style="color: #000;">
                        <td style="border: 1px solid #020b17; padding: 8px; font-weight: bold; color: #000000; text-align: center;">${invoiceNo}</td>
                        <td style="border: 1px solid #020b17; padding: 8px; font-weight: bold; color: #000000; text-align: center;">${description}</td>
                        <td style="border: 1px solid #020b17; padding: 8px; font-weight: bold; color: #000000; text-align: center;">₹${totalAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 20px 0; color: #000;">
                Registered office address: <span style="font-weight: bold; color: #000000;">${providerAddress}</span>
            </div>

            <div style="margin: 20px 0;">
                <div style="background: #ff5a5f; color: white; padding: 10px; border-radius: 5px;">
                    Terms and Conditions
                </div>
                <ol style="color: #666; margin-top: 10px;">
                    <li>Cheques to be in favour of "<span style="font-weight: bold; color: #000000;">${providerName}</span>"</li>
                    <li>In case of cheque bounce, ₹ 500/- penalty will be applicable.</li>
                    <li>Service provider shall levy late fee charge in case the bill is paid after the due date</li>
                    <li>In case of overdue, the right to deactivate your services is reserved.</li>
                    <li>This invoice is system generated hence signature and stamp is not required</li>
                </ol>
            </div>

            <div style="margin-top: 20px;">
                <div style="background: #ff5a5f; color: white; padding: 10px; border-radius: 5px;">
                    Acknowledgement Slip
                </div>
                <table style="width: 100%; margin-top: 10px; color: #000;">
                    <tr>
                        <td style="text-align: center;">AccountNo : <span style="font-weight: bold; color: #000000;">${accountNumber}</span></td>
                        <td style="text-align: center;">Subscriber Name : <span style="font-weight: bold; color: #000000;">${customerName}</span></td>
                        <td style="text-align: center;">Payment Method : <span style="font-weight: bold; color: #000000;">${paymentMethod}</span></td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">Invoice No : <span style="font-weight: bold; color: #000000;">${invoiceNo}</span></td>
                        <td colspan="2" style="text-align: center;"><span style="font-weight: bold; color: #000000;">${description}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        </div>
        `;
    } else if (selectedTemplate === '3') {
        // Template 3 (Vi) - Same as Template 1 but with Vi logo
        previewHTML = `
        <div style="background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative;">
            <div style="text-align: right; margin-bottom: 20px;">
                <span style="color: #666;">(Receipt for the Recipient)</span>
            </div>
            
            <div style="margin-top: 30px; margin-bottom: 40px; color: #000;">
                <div style="float: left;">
                    <img src="images/vi.png" alt="Vi Logo" style="width: 80px; margin-bottom: 10px; display: block;"><br>
                    <strong style="font-weight: bold; color: #000000;">${providerName}</strong><br>
                    <span style="font-weight: bold; color: #000000;">${providerAddress}</span>
                </div>
                <div style="float: right; text-align: right;">
                    <div>Name: <span style="font-weight: bold; color: #000000;">${customerName}</span></div>
                    <div>Account No: <span style="font-weight: bold; color: #000000;">${accountNumber}</span></div>
                </div>
                <div style="float: right; text-align: right; margin-right: 50px;">
                    <div>Invoice No: <span style="font-weight: bold; color: #000000;">${invoiceNo}</span></div>
                    <div>Account No: <span style="font-weight: bold; color: #000000;">${accountNumber}</span></div>
                    <div>Bill Date: <span style="font-weight: bold; color: #000000;">${formattedDate}</span></div>
                </div>
                <div style="clear: both;"></div>
            </div>

            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 24px; color: #666;">
                Bill Generator
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ff9800;">
                <tr style="background: #fff;">
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">Taxable Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">CGST Rate%</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">CGST Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">SGST Rate%</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">SGST Amount ₹</th>
                    <th style="border: 1px solid #ff9800; padding: 8px; text-align: center; color: #000;">Payments Received ₹</th>
                </tr>
                <tr style="color: #000;">
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${taxableAmount.toFixed(2)}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${cgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${cgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${sgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${sgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${totalAmount}</td>
                </tr>
            </table>

            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Service Plan Summary</span>
                    <span></span>
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
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${planSpeed}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${planPackage}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">${tarrifPlan || '-'}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">0</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center; font-weight: bold; color: #000000;">₹${planAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000;">
                    <span>Receipt Details</span>
                    <span></span>
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ff9800;">
                    <tr style="background: #fff;">
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Invoice No.</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Internet Service Description</th>
                        <th style="border: 1px solid #ff9800; padding: 8px; color: #000;">Amount Incl. Tax</th>
                    </tr>
                    <tr style="color: #000;">
                        <td style="border: 1px solid #ff9800; padding: 8px; font-weight: bold; color: #000000; text-align: center;">${invoiceNo}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; font-weight: bold; color: #000000; text-align: center;">${description}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; font-weight: bold; color: #000000; text-align: center;">₹${totalAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 20px 0; color: #000;">
                Registered office address: <span style="font-weight: bold; color: #000000;">${providerAddress}</span>
            </div>

            <div style="margin: 20px 0;">
                <div style="background: #ff9800; color: white; padding: 10px; border-radius: 5px;">
                    Terms and Conditions
                </div>
                <ol style="color: #666; margin-top: 10px;">
                    <li>Cheques to be in favour of "<span style="font-weight: bold; color: #000000;">${providerName}</span>"</li>
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
                        <td style="text-align: center;">AccountNo : <span style="font-weight: bold; color: #000000;">${accountNumber}</span></td>
                        <td style="text-align: center;">Subscriber Name : <span style="font-weight: bold; color: #000000;">${customerName}</span></td>
                        <td style="text-align: center;">Payment Method : <span style="font-weight: bold; color: #000000;">${paymentMethod}</span></td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">Invoice No : <span style="font-weight: bold; color: #000000;">${invoiceNo}</span></td>
                        <td colspan="2" style="text-align: center;"><span style="font-weight: bold; color: #000000;">${description}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        </div>
        `;
    }

    previewContainer.innerHTML = previewHTML;
}
