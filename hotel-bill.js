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
    
    document.getElementById('checkInDate').value = today;
    document.getElementById('checkInTime').value = currentTime;
    document.getElementById('checkOutDate').value = today;
    document.getElementById('checkOutTime').value = currentTime;

    // Handle form inputs for live preview
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Handle room table rows
    const roomTable = document.getElementById('roomTableBody');
    
    // Add row button click handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-row')) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="room-description"></td>
                <td><input type="number" class="room-rate" value="0"></td>
                <td><input type="number" class="room-days" value="0"></td>
                <td class="room-total">₹0</td>
                <td>
                    <button class="add-row">+</button>
                    <button class="remove-row">-</button>
                </td>
            `;
            roomTable.appendChild(newRow);
            updatePreview();
        } else if (e.target.classList.contains('remove-row')) {
            if (roomTable.children.length > 1) {
                e.target.closest('tr').remove();
                updatePreview();
            }
        }
    });

    // Handle room table input changes
    roomTable.addEventListener('input', function(e) {
        if (e.target.classList.contains('room-rate') || e.target.classList.contains('room-days')) {
            const row = e.target.closest('tr');
            const rate = parseFloat(row.querySelector('.room-rate').value) || 0;
            const days = parseFloat(row.querySelector('.room-days').value) || 0;
            const total = rate * days;
            row.querySelector('.room-total').textContent = `₹${total.toFixed(2)}`;
            updatePreview();
        }
    });

    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', function() {
        // Clear text inputs and textareas
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
            input.value = '';
        });
        
        // Reset dates and times
        document.getElementById('checkInDate').value = today;
        document.getElementById('checkInTime').value = currentTime;
        document.getElementById('checkOutDate').value = today;
        document.getElementById('checkOutTime').value = currentTime;
        
        // Reset radio buttons to defaults
        document.querySelector('input[name="template"][value="1"]').checked = true;
        document.querySelector('input[name="gstType"][value="none"]').checked = true;
        document.querySelector('input[name="logoSource"][value="url"]').checked = true;
        document.querySelector('input[name="signatureSource"][value="url"]').checked = true;
        
        // Reset checkboxes
        document.getElementById('logoAuth').checked = false;
        document.getElementById('signatureAuth').checked = false;
        
        // Reset room table
        while (roomTable.children.length > 1) {
            roomTable.removeChild(roomTable.lastChild);
        }
        const firstRow = roomTable.firstElementChild;
        firstRow.querySelector('.room-description').value = '';
        firstRow.querySelector('.room-rate').value = '0';
        firstRow.querySelector('.room-days').value = '0';
        firstRow.querySelector('.room-total').textContent = '₹0';
        
        // Reset selects
        document.getElementById('currency').value = 'INR';
        document.getElementById('paymentType').value = 'Cash';
        document.getElementById('guestGender').value = 'Male';
        
        updatePreview();
    });

    // Download button functionality
    document.getElementById('downloadBtn').addEventListener('click', async function() {
        // Validate required fields
        const required = ['hotelName', 'checkInDate', 'checkOutDate'];
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
        const fileName = document.getElementById('fileName').value || 'hotel-bill';

        try {
            // Remove any transform scale before capturing
            const previewSection = document.querySelector('.preview-section');
            const originalTransform = previewSection.style.transform;
            previewSection.style.transform = 'none';

            // Convert the preview content to canvas
            const canvas = await html2canvas(previewContent, {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                logging: false,
                removeContainer: false,
                allowTaint: true,
                width: previewContent.offsetWidth,
                height: previewContent.offsetHeight
            });

            // Restore the original transform
            previewSection.style.transform = originalTransform;

            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Set up PDF with custom font
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm

            // Calculate dimensions to fit on one page
            const margin = 10; // 10mm margin
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            // Calculate scale to fit content while maintaining aspect ratio
            const scale = Math.min(
                maxWidth / canvas.width * 25.4,  // Convert px to mm
                maxHeight / canvas.height * 25.4
            );

            const scaledWidth = (canvas.width * scale) / 25.4;
            const scaledHeight = (canvas.height * scale) / 25.4;

            // Center the content
            const x = (pageWidth - scaledWidth) / 2;
            const y = (pageHeight - scaledHeight) / 2;

            // Add image to PDF with high quality
            doc.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight, undefined, 'FAST');

            // Save the PDF
            doc.save(`${fileName}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    });

    // Initial preview update
    updatePreview();
});

function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    
    // Get form values
    const hotelName = document.getElementById('hotelName').value || 'Hotel Name';
    const hotelAddress = document.getElementById('hotelAddress').value || '';
    const checkInDate = document.getElementById('checkInDate').value;
    const checkInTime = document.getElementById('checkInTime').value;
    const checkOutDate = document.getElementById('checkOutDate').value;
    const checkOutTime = document.getElementById('checkOutTime').value;
    const billNo = document.getElementById('billNo').value || '';
    const nationality = document.getElementById('nationality').value || 'Indian';
    const roomNo = document.getElementById('roomNo').value || '';
    const roomType = document.getElementById('roomType').value || '';
    const guestName = document.getElementById('guestName').value || '';
    const guestGender = document.getElementById('guestGender').value;
    const guestAge = document.getElementById('guestAge').value || '';
    const guestAddress = document.getElementById('guestAddress').value || '';

    // Calculate totals
    let subTotal = 0;
    const rooms = [];
    document.querySelectorAll('#roomTableBody tr').forEach(row => {
        const description = row.querySelector('.room-description')?.value || '';
        const rate = parseFloat(row.querySelector('.room-rate')?.value) || 0;
        const days = parseFloat(row.querySelector('.room-days')?.value) || 0;
        const total = rate * days;
        
        rooms.push({ description, rate, days, total });
        
        if (rate > 0 && days > 0) {
            subTotal += total;
        }
    });

    // Calculate tax and total
    const taxPercent = parseFloat(document.getElementById('taxPercent').value) || 0;
    const advanceAmount = parseFloat(document.getElementById('advanceAmount').value) || 0;
    const taxAmount = (subTotal * taxPercent) / 100;
    const total = subTotal + taxAmount;
    const balance = total - advanceAmount;

    // Create preview HTML
    const previewHTML = `
        <div class="preview-header">
            <h2>${hotelName}</h2>
            <p>${hotelAddress}</p>
            ${document.getElementById('gstNo').checked ? `<p>GST No: ${document.getElementById('gstNumber').value || ''}</p>` : ''}
        </div>

        <div class="preview-title">Tax Invoice</div>

        <div class="preview-details">
            <div class="preview-row">
                <div>Bill No: ${billNo}</div>
                <div>Room No: ${roomNo}</div>
            </div>
            <div class="preview-row">
                <div>Guest Name: ${guestName} (${guestGender}, ${guestAge})</div>
                <div>Room Type: ${roomType}</div>
            </div>
            <div class="preview-row">
                <div>Check In: ${checkInDate} ${checkInTime}</div>
                <div>Pay Type: ${document.getElementById('paymentType').value}</div>
            </div>
            <div class="preview-row">
                <div>Check Out: ${checkOutDate} ${checkOutTime}</div>
                <div>Nationality: ${nationality}</div>
            </div>
            <div>Address: ${guestAddress}</div>
        </div>

        <table class="preview-table">
            <thead>
                <tr>
                    <th>ROOM TYPE</th>
                    <th>ROOM DESCRIPTION</th>
                    <th>RATE</th>
                    <th>NO OF DAYS</th>
                    <th>SUBTOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${rooms.map(room => `
                    <tr>
                        <td>${roomType}</td>
                        <td>${room.description}</td>
                        <td>₹${room.rate}</td>
                        <td>${room.days}</td>
                        <td>₹${room.total.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="preview-summary">
            <p>Sub Total: ₹${subTotal.toFixed(2)}</p>
            <p>Tax (${taxPercent}%): ₹${taxAmount.toFixed(2)}</p>
            <p>Total Amount: ₹${total.toFixed(2)}</p>
            <p>Advance Amount: ₹${advanceAmount.toFixed(2)}</p>
            <p>Balance Amount: ₹${balance.toFixed(2)}</p>
        </div>

        <div class="preview-footer">
            <div style="text-align: left; margin-bottom: 30px;">
                <p>Guest Signature</p>
                <img src="${document.getElementById('signatureUrlInput').value}" class="preview-signature" onerror="this.style.display='none'">
            </div>
            <div style="text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                <p>Thank You, Visit Again!</p>
            </div>
        </div>

        <div class="preview-watermark">
            <small>Watermark will be removed from actual pdf</small>
        </div>
    `;

    previewContainer.innerHTML = `<div class="receipt-preview">${previewHTML}</div>`;
}
