document.addEventListener('DOMContentLoaded', function() {
    // Get form and preview elements
    const form = document.getElementById('donationForm');
    const preview = document.getElementById('receiptPreview');
    const logoUrlInput = document.getElementById('logoUrlInput');
    const logoFileInput = document.getElementById('logoFileInput');
    const logoTypeRadios = document.getElementsByName('logoType');

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
        const formData = {
            templeName: document.getElementById('templeName').value || 'The Hindu Temples Discovery and Restoration Trust',
            trustPan: document.getElementById('trustPan').value || 'AAATH1234A',
            templeAddress: document.getElementById('templeAddress').value || 'gaurakhmath uttrakhand',
            phoneNo: document.getElementById('phoneNo').value || '9548999898',
            email: document.getElementById('email').value || 'xyz@gmail.com',
            website: document.getElementById('website').value || '',
            receiptNo: document.getElementById('receiptNo').value,
            amount: document.getElementById('amount').value,
            receivedFrom: document.getElementById('receivedFrom').value,
            donatorPan: document.getElementById('donatorPan').value,
            receivedBy: document.getElementById('receivedBy').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            paymentMethod: document.getElementById('paymentMethod').value
        };

        // Format the email and website display
        const emailWebsiteDisplay = formData.website 
            ? `Email: ${formData.email} | Website: ${formData.website}`
            : `Email: ${formData.email}`;

        // Generate preview HTML
        const previewHTML = `
            <div class="receipt-content" style="font-family: Arial, sans-serif; padding: 20px; background-color: white;">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h1 style="color: #E41B17; margin: 0; font-size: 24px; margin-bottom: 5px;">${formData.templeName}</h1>
                    <p style="color: #000; margin: 5px 0; font-size: 12px;">(Govt Regd. No. 91 of 2018)</p>
                    <p style="color: #000; margin: 5px 0; font-size: 14px;">PAN: ${formData.trustPan}</p>
                    <p style="color: #000; margin: 5px 0; font-size: 14px;">${formData.templeAddress}</p>
                    <p style="color: #000; margin: 5px 0; font-size: 14px;">${emailWebsiteDisplay}</p>
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
                            ${numberToWords(formData.amount)}
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

        preview.innerHTML = previewHTML;
    }

    // Function to validate form
    function validateForm() {
        const requiredFields = [
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

        for (const { field, name } of requiredFields) {
            if (!field.value.trim()) {
                alert(`Please enter ${name}`);
                field.focus();
                return false;
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
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        if (!validateForm()) return;

        const element = document.getElementById('receiptPreview');
        
        const opt = {
            margin: 1,
            filename: `donation-receipt-${document.getElementById('receiptNo').value || 'receipt'}.pdf`,
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

        // Generate and save PDF
        html2pdf().set(opt).from(element).save();
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
        setTimeout(updatePreview, 0);
    });
});
