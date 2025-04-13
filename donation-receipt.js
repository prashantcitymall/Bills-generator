document.addEventListener('DOMContentLoaded', function() {
    // Get form and preview elements
    const form = document.getElementById('donationForm');
    const preview = document.getElementById('receiptPreview');
    const logoUrlInput = document.getElementById('logoUrlInput');
    const logoFileInput = document.getElementById('logoFileInput');
    const logoTypeRadios = document.getElementsByName('logoType');
    
    // Template elements
    const templateRadios = document.getElementsByName('template');
    const template1Fields = document.getElementById('template1Fields');
    const template2Fields = document.getElementById('template2Fields');
    
    // Template data storage
    const templateData = {
        template1: {},
        template2: {}
    };
    
    // Load saved form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('donationReceiptFormData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Load saved template selection
                if (data.template) {
                    const templateRadio = document.querySelector(`input[name="template"][value="${data.template}"]`);
                    if (templateRadio) {
                        templateRadio.checked = true;
                        
                        // Show the appropriate template fields
                        if (data.template === 'template1') {
                            template1Fields.classList.add('active');
                            template2Fields.classList.remove('active');
                        } else {
                            template1Fields.classList.remove('active');
                            template2Fields.classList.add('active');
                        }
                    }
                }
                
                // Load template-specific data
                if (data.template === 'template1') {
                    // Load Template 1 data
                    if (data.templeName) document.getElementById('templeName').value = data.templeName;
                    if (data.trustPan) document.getElementById('trustPan').value = data.trustPan;
                    if (data.templeAddress) document.getElementById('templeAddress').value = data.templeAddress;
                    if (data.phoneNo) document.getElementById('phoneNo').value = data.phoneNo;
                    if (data.email) document.getElementById('email').value = data.email;
                    if (data.website) document.getElementById('website').value = data.website;
                    if (data.receiptNo) document.getElementById('receiptNo').value = data.receiptNo;
                    if (data.amount) document.getElementById('amount').value = data.amount;
                    if (data.receivedFrom) document.getElementById('receivedFrom').value = data.receivedFrom;
                    if (data.donatorPan) document.getElementById('donatorPan').value = data.donatorPan;
                    if (data.receivedBy) document.getElementById('receivedBy').value = data.receivedBy;
                    if (data.description) document.getElementById('description').value = data.description;
                    if (data.date) document.getElementById('date').value = data.date;
                    if (data.paymentMethod) document.getElementById('paymentMethod').value = data.paymentMethod;
                } else if (data.template === 'template2') {
                    // Load Template 2 data
                    if (data.t2ReceiptNumber) document.getElementById('t2ReceiptNumber').value = data.t2ReceiptNumber;
                    if (data.t2DonorName) document.getElementById('t2DonorName').value = data.t2DonorName;
                    if (data.t2DonorPAN) document.getElementById('t2DonorPAN').value = data.t2DonorPAN;
                    if (data.t2Purpose) document.getElementById('t2Purpose').value = data.t2Purpose;
                    if (data.t2Address) document.getElementById('t2Address').value = data.t2Address;
                    if (data.t2Mobile) document.getElementById('t2Mobile').value = data.t2Mobile;
                    if (data.t2Email) document.getElementById('t2Email').value = data.t2Email;
                    if (data.t2Amount) document.getElementById('t2Amount').value = data.t2Amount;
                    if (data.t2Date) document.getElementById('t2Date').value = data.t2Date;
                    if (data.t2PaymentMode) document.getElementById('t2PaymentMode').value = data.t2PaymentMode;
                    if (data.t2TrustPAN) document.getElementById('t2TrustPAN').value = data.t2TrustPAN;
                }
                
                // Load common fields
                if (data.terms) document.getElementById('terms').checked = data.terms;
                
                // Update preview
                updatePreview();
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        } else {
            // Set default values if no saved data
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            document.getElementById('t2Date').value = new Date().toISOString().split('T')[0];
            document.getElementById('t2Purpose').value = 'Mandir Renovation/Repair';
            document.getElementById('t2TrustPAN').value = 'AAZTS6197B';
        }
    }
    
    // Set up form persistence
    function setupFormPersistence() {
        // Save form data on input changes
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', saveFormData);
            input.addEventListener('change', saveFormData);
        });
        
        // Save form data when logo type changes
        logoTypeRadios.forEach(radio => {
            radio.addEventListener('change', saveFormData);
        });
    }
    
    // Function to save form data to localStorage
    function saveFormData() {
        const formData = {
            // Template selection
            template: document.querySelector('input[name="template"]:checked')?.value || 'template1',
            
            // Temple/Trust details
            templeName: document.getElementById('templeName').value,
            trustPan: document.getElementById('trustPan').value,
            templeAddress: document.getElementById('templeAddress').value,
            phoneNo: document.getElementById('phoneNo').value,
            email: document.getElementById('email').value,
            website: document.getElementById('website').value,
            
            // Receipt details
            receiptNo: document.getElementById('receiptNo').value,
            amount: document.getElementById('amount').value,
            receivedFrom: document.getElementById('receivedFrom').value,
            donatorPan: document.getElementById('donatorPan').value,
            receivedBy: document.getElementById('receivedBy').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            
            // Logo details
            logoType: document.querySelector('input[name="logoType"]:checked')?.value || 'url',
            logoUrl: document.getElementById('logoUrlField').value,
            
            // Terms checkbox
            terms: document.getElementById('terms').checked,
            
            // Template 2 fields
            t2ReceiptNumber: document.getElementById('t2ReceiptNumber').value,
            t2DonorName: document.getElementById('t2DonorName').value,
            t2DonorPAN: document.getElementById('t2DonorPAN').value,
            t2Purpose: document.getElementById('t2Purpose').value,
            t2Address: document.getElementById('t2Address').value,
            t2Mobile: document.getElementById('t2Mobile').value,
            t2Email: document.getElementById('t2Email').value,
            t2Amount: document.getElementById('t2Amount').value,
            t2Date: document.getElementById('t2Date').value,
            t2PaymentMode: document.getElementById('t2PaymentMode').value,
            t2TrustPAN: document.getElementById('t2TrustPAN').value
        };
        
        localStorage.setItem('donationReceiptFormData', JSON.stringify(formData));
    }
    
    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form persistence
    setupFormPersistence();

    // Handle logo input type toggle
    logoTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'url') {
                logoUrlInput.style.display = 'block';
                logoFileInput.style.display = 'none';
            } else {
                logoUrlInput.style.display = 'none';
                logoFileInput.style.display = 'block';
            }
            updatePreview();
        });
    });

    // Handle file input change
    document.getElementById('logoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle form input changes
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });

    // Function to convert number to words
    function numberToWords(num) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        
        function convertLessThanThousand(n) {
            if (n === 0) return '';
            
            let result = '';
            
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
                if (n > 0) result += 'and ';
            }
            
            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            } else if (n >= 10) {
                result += teens[n - 10] + ' ';
                return result;
            }
            
            if (n > 0) {
                result += ones[n] + ' ';
            }
            
            return result;
        }
        
        if (!num) return '';
        
        num = parseFloat(num);
        if (isNaN(num)) return '';
        
        if (num === 0) return 'Zero';
        
        let result = '';
        let crore = Math.floor(num / 10000000);
        num %= 10000000;
        let lakh = Math.floor(num / 100000);
        num %= 100000;
        let thousand = Math.floor(num / 1000);
        num %= 1000;
        
        if (crore > 0) {
            result += convertLessThanThousand(crore) + 'Crore ';
        }
        if (lakh > 0) {
            result += convertLessThanThousand(lakh) + 'Lakh ';
        }
        if (thousand > 0) {
            result += convertLessThanThousand(thousand) + 'Thousand ';
        }
        if (num > 0) {
            result += convertLessThanThousand(num);
        }
        
        return result.trim() + ' Rupees Only';
    }

    // Update preview function
    function updatePreview() {
        // Get form data
        const formData = {
            // Template selection
            template: document.querySelector('input[name="template"]:checked')?.value || 'template1',
            
            // Template 1 fields
            templeName: document.getElementById('templeName').value,
            trustPan: document.getElementById('trustPan').value,
            templeAddress: document.getElementById('templeAddress').value,
            phoneNo: document.getElementById('phoneNo').value,
            email: document.getElementById('email').value,
            website: document.getElementById('website').value,
            receiptNo: document.getElementById('receiptNo').value,
            amount: document.getElementById('amount').value,
            amountInWords: numberToWords(document.getElementById('amount').value),
            receivedFrom: document.getElementById('receivedFrom').value,
            donatorPan: document.getElementById('donatorPan').value,
            receivedBy: document.getElementById('receivedBy').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            
            // Template 2 fields
            t2ReceiptNumber: document.getElementById('t2ReceiptNumber').value,
            t2DonorName: document.getElementById('t2DonorName').value,
            t2DonorPAN: document.getElementById('t2DonorPAN').value,
            t2Purpose: document.getElementById('t2Purpose').value || 'Mandir Renovation/Repair',
            t2Address: document.getElementById('t2Address').value,
            t2Mobile: document.getElementById('t2Mobile').value,
            t2Email: document.getElementById('t2Email').value,
            t2Amount: document.getElementById('t2Amount').value,
            t2AmountInWords: numberToWords(document.getElementById('t2Amount').value),
            t2Date: document.getElementById('t2Date').value,
            t2PaymentMode: document.getElementById('t2PaymentMode').value,
            t2TrustPAN: document.getElementById('t2TrustPAN').value || 'AAZTS6197B'
        };
        
        let previewHTML;
        
        if (formData.template === 'template1') {
            // Template 1 - Original template
            previewHTML = `
                <div class="receipt-content" style="font-family: Arial, sans-serif; padding: 20px; background-color: white;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <h1 style="color: #E41B17; margin: 0; font-size: 24px; margin-bottom: 5px;">${formData.templeName}</h1>
                        <p style="color: #000; margin: 5px 0; font-size: 12px;">(Govt Regd. No. 91 of 2018)</p>
                        <p style="color: #000; margin: 5px 0; font-size: 14px;">PAN: ${formData.trustPan}</p>
                        <p style="color: #000; margin: 5px 0; font-size: 14px;">${formData.templeAddress}</p>
                        <p style="color: #000; margin: 5px 0; font-size: 14px;">Email: ${formData.email} | Website: ${formData.website}</p>
                        <p style="color: #E41B17; margin: 5px 0; font-size: 14px;">Phone: +91 ${formData.phoneNo}</p>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <h2 style="color: #000080; margin: 0; font-size: 28px; font-weight: bold; flex: 1;">DONATION RECEIPT</h2>
                        <table style="border-collapse: collapse; width: 50%;">
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px; background-color: #fff;">Receipt No.</td>
                                <td style="border: 1px solid #000; padding: 8px;">${formData.receiptNo}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px; background-color: #fff;">Date</td>
                                <td style="border: 1px solid #000; padding: 8px;">${formData.date}</td>
                            </tr>
                        </table>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 8px;">
                                <span style="font-weight: normal; color: #000;">Received From : </span>
                                ${formData.receivedFrom}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 8px;">
                                <span style="font-weight: normal; color: #000;">Donator's PAN No : </span>
                                ${formData.donatorPan}
                            </td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px; width: 25%;">
                                <span style="font-weight: normal; color: #000;">Amount</span>
                            </td>
                            <td style="border: 1px solid #000; padding: 8px; width: 45%;">
                                ${formData.amount}
                            </td>
                            <td style="border: 1px solid #000; padding: 8px; width: 30%;">
                                <span style="font-weight: normal; color: #000;">Payment Method:</span>
                                ${formData.paymentMethod}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 8px;">
                                <span style="font-weight: normal; color: #000;">The Sum of Amount in Words: </span>
                                ${formData.amountInWords}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 8px;">
                                <span style="font-weight: normal; color: #000;">Received by :</span>
                                ${formData.receivedBy}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 8px;">
                                <span style="font-weight: normal; color: #000;">Description of Donation:</span>
                                ${formData.description}
                            </td>
                        </tr>
                    </table>

                    <div style="position: relative; margin-top: 20px; min-height: 200px;">
                        <p style="text-align: center; margin-top: 20px; font-style: normal; color: #000; font-size: 14px;">
                            Thank you for your generosity, we appreciate your support
                        </p>

                        <!-- Temple Stamp -->
                        <div class="temple-stamp">
                            <div class="stamp-temple-name">${formData.templeName}</div>
                            <div class="stamp-details">
                                ${formData.templeAddress}<br>
                                Phone: +91 ${formData.phoneNo}<br>
                                Govt Regd. No. 91 of 2018
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Template 2 - Shri Ram Janmbhoomi template
            previewHTML = `
                <div class="receipt-content" style="font-family: Arial, sans-serif; padding: 20px; background-color: white; border: 1px solid #ccc;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <img src="images/ram mandir.png" alt="Shri Ram Janmbhoomi Logo" style="width: 235px; height: auto;">
                        <div style="margin-top: -10px;">
                            <h1 style="color: #FF0000; margin: 10px 0 0; font-size: 24px; text-transform: uppercase; font-family: serif;">SHRI RAM JANMBHOOMI</h1>
                            <h2 style="color: #FF0000; margin: 0 0 5px; font-size: 20px; text-transform: uppercase; font-family: serif;">TEERTH KSHETRA</h2>
                            <p style="margin: 5px 0; font-size: 14px;">
                                RAM KACHEHRI, RAMKOT, AYODHYA-<br>
                                224123 PAN: ${formData.t2TrustPAN}
                            </p>
                            <h2 style="margin: 10px 0; font-size: 24px;">E-Receipt</h2>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px; width: 40%;">Receipt Number</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2ReceiptNumber}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Name of the Donor/Institute</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2DonorName}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">PAN No. of Donor</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2DonorPAN}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Purpose of the Donation</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2Purpose}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Address of Donor</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2Address}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Mobile number of Donor</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2Mobile}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Email of Donor</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2Email}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Amount of Donation</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2Amount}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Transaction ID</td>
                            <td style="border: 1px solid #000; padding: 8px;">TXN${Math.floor(Math.random() * 10000000000000)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Transaction Date</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2Date}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Payment Status</td>
                            <td style="border: 1px solid #000; padding: 8px;">SUCCESS</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">Payment Mode</td>
                            <td style="border: 1px solid #000; padding: 8px;">${formData.t2PaymentMode}</td>
                        </tr>
                    </table>

                    <div style="font-size: 12px; margin-top: 20px;">
                        <p>*PAN of Shri Ram Janmbhoomi Teerth Kshetra is ${formData.t2TrustPAN}.</p>
                        <p>*50% of Voluntary Contribution, for the purpose of renovation/repair of Mandir, to Shri Ram Janmbhoomi Teerth Kshetra is eligible for deduction under sec 80G(2)(b), subject to other conditions mentioned under section 80G of the Income Tax Act, 1961.</p>
                        <p>*Donations made in cash exceeding Rs 2000/- are not eligible for deduction under aforesaid section.</p>
                    </div>
                </div>
            `;
        }

        // Update preview
        preview.innerHTML = previewHTML;
    }

    // Function to validate form
    function validateForm() {
        // Check which template is selected
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
        
        if (selectedTemplate === 'template1') {
            // Validate Template 1 fields
            const template1RequiredFields = [
                { field: document.getElementById('templeName'), name: 'Temple Name' },
                { field: document.getElementById('trustPan'), name: 'Trust PAN Number' },
                { field: document.getElementById('templeAddress'), name: 'Temple Address' },
                { field: document.getElementById('phoneNo'), name: 'Phone Number' },
                { field: document.getElementById('email'), name: 'Email' },
                { field: document.getElementById('receiptNo'), name: 'Receipt Number' },
                { field: document.getElementById('amount'), name: 'Amount' },
                { field: document.getElementById('receivedFrom'), name: 'Received From' },
                { field: document.getElementById('donatorPan'), name: 'Donator PAN Number' },
                { field: document.getElementById('receivedBy'), name: 'Received By' },
                { field: document.getElementById('date'), name: 'Date' },
                { field: document.getElementById('paymentMethod'), name: 'Payment Method' }
            ];
            
            for (const { field, name } of template1RequiredFields) {
                if (!field.value.trim()) {
                    alert(`Please enter ${name}`);
                    field.focus();
                    return false;
                }
            }
        } else if (selectedTemplate === 'template2') {
            // Validate Template 2 fields
            const template2RequiredFields = [
                { field: document.getElementById('t2ReceiptNumber'), name: 'Receipt Number' },
                { field: document.getElementById('t2DonorName'), name: 'Donor Name' },
                { field: document.getElementById('t2DonorPAN'), name: 'Donor PAN' },
                { field: document.getElementById('t2Purpose'), name: 'Purpose' },
                { field: document.getElementById('t2Address'), name: 'Address' },
                { field: document.getElementById('t2Mobile'), name: 'Mobile Number' },
                { field: document.getElementById('t2Email'), name: 'Email' },
                { field: document.getElementById('t2Amount'), name: 'Amount' },
                { field: document.getElementById('t2Date'), name: 'Date' },
                { field: document.getElementById('t2PaymentMode'), name: 'Payment Mode' },
                { field: document.getElementById('t2TrustPAN'), name: 'Trust PAN' }
            ];
            
            for (const { field, name } of template2RequiredFields) {
                if (!field.value.trim()) {
                    alert(`Please enter ${name}`);
                    field.focus();
                    return false;
                }
            }
        }

        if (!document.getElementById('terms').checked) {
            alert('Please accept the terms and conditions');
            return false;
        }

        return true;
    }

    // Download PDF function
    document.getElementById('downloadBtn').addEventListener('click', () => {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // Save the current URL to return after login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        // Check which template is selected
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
        
        if (!validateForm()) return;
        
        // Get the original preview element
        const element = document.getElementById('receiptPreview');
        
        // Fix signature position before generating PDF
        const signatureElement = document.querySelector('.draggable-signature');
        let originalStyles = {};
        
        if (signatureElement) {
            // Store original styles
            originalStyles = {
                left: signatureElement.style.left,
                top: signatureElement.style.top,
                transform: signatureElement.style.transform,
                width: signatureElement.style.width
            };
            
            // Hide all controls
            const handles = signatureElement.querySelectorAll('.resize-handle');
            handles.forEach(handle => handle.style.display = 'none');
            
            const toolbar = signatureElement.querySelector('.signature-toolbar');
            if (toolbar) toolbar.style.display = 'none';
            
            // Make sure the signature is visible
            signatureElement.style.opacity = '1';
            signatureElement.style.visibility = 'visible';
        }
        
        // Set PDF options
        const opt = {
            margin: 0,
            filename: selectedTemplate === 'template1' 
                ? `donation-receipt-${document.getElementById('receiptNo').value || 'receipt'}.pdf`
                : `donation-receipt-${document.getElementById('t2ReceiptNumber').value || 'receipt'}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollY: 0,
                backgroundColor: '#ffffff',
                logging: true, // Enable logging for debugging
                onclone: function(clonedDoc) {
                    // Make sure the signature is visible in the cloned document
                    const clonedSignature = clonedDoc.querySelector('.draggable-signature');
                    if (clonedSignature) {
                        // Hide all controls
                        const handles = clonedSignature.querySelectorAll('.resize-handle');
                        handles.forEach(handle => handle.style.display = 'none');
                        
                        const toolbar = clonedSignature.querySelector('.signature-toolbar');
                        if (toolbar) toolbar.style.display = 'none';
                        
                        // Make sure the signature is visible
                        clonedSignature.style.opacity = '1';
                        clonedSignature.style.visibility = 'visible';
                        clonedSignature.style.background = 'transparent';
                        
                        // Force the signature to be visible
                        const signatureImg = clonedSignature.querySelector('img');
                        if (signatureImg) {
                            signatureImg.style.display = 'block';
                            signatureImg.style.visibility = 'visible';
                            signatureImg.style.opacity = '1';
                        }
                    }
                    
                    // Make sure all content is visible
                    const previewContent = clonedDoc.querySelector('.receipt-content');
                    if (previewContent) {
                        previewContent.style.display = 'block';
                        previewContent.style.visibility = 'visible';
                        previewContent.style.backgroundColor = '#ffffff';
                    }
                }
            },
            jsPDF: { 
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        // Generate and save PDF using a simpler approach
        // First make a copy of the element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '10mm';
        tempDiv.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempDiv);
        
        // If there's a signature, copy it properly
        if (signatureElement) {
            const signatureImg = signatureElement.querySelector('img');
            if (signatureImg) {
                const signatureRect = signatureElement.getBoundingClientRect();
                const previewRect = element.getBoundingClientRect();
                
                // Create a new signature image with exact position
                const newSignature = document.createElement('img');
                newSignature.src = signatureImg.src;
                newSignature.style.position = 'absolute';
                newSignature.style.left = `${signatureRect.left - previewRect.left}px`;
                newSignature.style.top = `${signatureRect.top - previewRect.top}px`;
                newSignature.style.width = `${signatureRect.width}px`;
                newSignature.style.height = 'auto';
                newSignature.style.transform = signatureElement.style.transform;
                newSignature.style.transformOrigin = 'center center';
                newSignature.style.zIndex = '100';
                
                // Remove any existing signature in the temp div
                const oldSig = tempDiv.querySelector('.draggable-signature');
                if (oldSig) oldSig.remove();
                
                // Add the new signature
                tempDiv.appendChild(newSignature);
            }
        }
        
        // Generate PDF from the temp element
        html2pdf()
            .from(tempDiv)
            .set(opt)
            .save()
            .then(() => {
                console.log('PDF generated successfully');
                
                // Clean up
                document.body.removeChild(tempDiv);
                
                // Restore original signature styles
                if (signatureElement && Object.keys(originalStyles).length > 0) {
                    // Show controls again
                    const handles = signatureElement.querySelectorAll('.resize-handle');
                    handles.forEach(handle => handle.style.display = 'block');
                    
                    const toolbar = signatureElement.querySelector('.signature-toolbar');
                    if (toolbar) toolbar.style.display = 'flex';
                }
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                document.body.removeChild(tempDiv);
            });
    });

    // Handle template switching
    document.querySelectorAll('input[name="template"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Save current form data before switching templates
            saveFormData();
            
            if (this.value === 'template1') {
                template1Fields.classList.add('active');
                template2Fields.classList.remove('active');
            } else if (this.value === 'template2') {
                template1Fields.classList.remove('active');
                template2Fields.classList.add('active');
            }
            
            updatePreview();
        });
    });

    // Initial preview
    updatePreview();

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Here you can add code to generate the final PDF or print the receipt
        window.print();
    });

    // Handle form reset
    form.addEventListener('reset', function() {
        // Clear localStorage when form is reset
        localStorage.removeItem('donationReceiptFormData');
        setTimeout(updatePreview, 0);
    });
});
