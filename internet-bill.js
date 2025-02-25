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
    document.getElementById('downloadBtn').addEventListener('click', async function() {
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

        const previewContent = document.getElementById('previewContainer');
        const fileName = document.getElementById('fileName').value || 'internet-bill';

        // Hide watermark temporarily
        const watermark = previewContent.querySelector('div[style*="opacity: 0.1"]');
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
        } finally {
            // Show watermark again
            if (watermark) watermark.style.display = 'block';
        }
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
        <div style="background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative;">
            <div style="text-align: right; margin-bottom: 20px;">
                <span style="color: #666;">(Receipt for the Recipient)</span>
            </div>
            
            <div style="margin-top: 30px; margin-bottom: 40px; color: #000;">
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
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${taxableAmount.toFixed(2)}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${cgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${cgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${sgstRate}%</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${sgstAmount}</td>
                    <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${totalAmount}</td>
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
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${planSpeed}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${planPackage}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">${tarrifPlan || '-'}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">0</td>
                        <td style="border: 1px solid #ff9800; padding: 8px; text-align: center;">₹${planAmount}</td>
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
                        <td style="border: 1px solid #ff9800; padding: 8px;">${invoiceNo}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px;">${description}</td>
                        <td style="border: 1px solid #ff9800; padding: 8px;">₹${totalAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 20px 0; color: #000;">
                Registered office address: ${providerAddress}
            </div>

            <div style="margin: 20px 0;">
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
