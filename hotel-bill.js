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
    document.getElementById('downloadBtn').addEventListener('click', () => {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // Save the current URL to return after login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
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
            filename: `hotel-bill-${document.getElementById('billNo').value || 'HB001'}.pdf`,
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
            { field: document.getElementById('hotelName'), name: 'Hotel Name' },
            { field: document.getElementById('hotelAddress'), name: 'Hotel Address' },
            { field: document.getElementById('billNo'), name: 'Bill Number' },
            { field: document.getElementById('checkInDate'), name: 'Check In Date' },
            { field: document.getElementById('checkInTime'), name: 'Check In Time' },
            { field: document.getElementById('checkOutDate'), name: 'Check Out Date' },
            { field: document.getElementById('checkOutTime'), name: 'Check Out Time' },
            { field: document.getElementById('roomNo'), name: 'Room Number' },
            { field: document.getElementById('roomType'), name: 'Room Type' }
        ];

        // Check if at least one room is added
        const roomTable = document.getElementById('roomTableBody');
        const rows = roomTable.querySelectorAll('tr');
        let hasValidRoom = false;

        for (const row of rows) {
            const description = row.querySelector('.room-description').value;
            const rate = parseFloat(row.querySelector('.room-rate').value) || 0;
            const days = parseFloat(row.querySelector('.room-days').value) || 0;

            if (description && rate > 0 && days > 0) {
                hasValidRoom = true;
                break;
            }
        }

        if (!hasValidRoom) {
            alert('Please add at least one room with valid rate and days');
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
        // Get room table items
        const roomItems = [];
        const roomRows = document.querySelectorAll('#roomTableBody tr');
        roomRows.forEach(row => {
            roomItems.push({
                description: row.querySelector('.room-description')?.value || '',
                rate: row.querySelector('.room-rate')?.value || '0',
                days: row.querySelector('.room-days')?.value || '0'
            });
        });
        
        const formData = {
            // Hotel details
            hotelName: document.getElementById('hotelName').value,
            hotelAddress: document.getElementById('hotelAddress').value,
            checkInDate: document.getElementById('checkInDate').value,
            checkInTime: document.getElementById('checkInTime').value,
            checkOutDate: document.getElementById('checkOutDate').value,
            checkOutTime: document.getElementById('checkOutTime').value,
            billNo: document.getElementById('billNo').value,
            nationality: document.getElementById('nationality').value,
            roomNo: document.getElementById('roomNo').value,
            roomType: document.getElementById('roomType').value,
            
            // GST details
            gstType: document.querySelector('input[name="gstType"]:checked')?.value || 'none',
            gstNumber: document.getElementById('gstNumber').value,
            
            // Logo details
            logoSource: document.querySelector('input[name="logoSource"]:checked')?.value || 'url',
            logoUrl: document.getElementById('logoUrlInput').value,
            logoAuth: document.getElementById('logoAuth').checked,
            
            // Room details
            roomItems: roomItems,
            
            // Payment details
            currency: document.getElementById('currency').value,
            paymentType: document.getElementById('paymentType').value,
            taxPercent: document.getElementById('taxPercent').value,
            advanceAmount: document.getElementById('advanceAmount').value,
            
            // Signature details
            signatureSource: document.querySelector('input[name="signatureSource"]:checked')?.value || 'url',
            signatureUrl: document.getElementById('signatureUrlInput').value,
            signatureAuth: document.getElementById('signatureAuth').checked,
            
            // Guest details
            guestName: document.getElementById('guestName').value,
            guestGender: document.getElementById('guestGender').value,
            guestAge: document.getElementById('guestAge').value,
            guestAddress: document.getElementById('guestAddress').value,
            
            // File details
            fileName: document.getElementById('fileName').value,
            
            // Template
            template: document.querySelector('input[name="template"]:checked')?.value || '1'
        };
        
        localStorage.setItem('hotelBillFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('hotelBillFormData');
        if (!savedData) {
            // If no saved data, set default date and time
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];
            
            document.getElementById('checkInDate').value = today;
            document.getElementById('checkInTime').value = currentTime;
            document.getElementById('checkOutDate').value = today;
            document.getElementById('checkOutTime').value = currentTime;
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Restore hotel details
        document.getElementById('hotelName').value = formData.hotelName || '';
        document.getElementById('hotelAddress').value = formData.hotelAddress || '';
        document.getElementById('billNo').value = formData.billNo || '';
        document.getElementById('nationality').value = formData.nationality || 'Indian';
        document.getElementById('roomNo').value = formData.roomNo || '';
        document.getElementById('roomType').value = formData.roomType || 'AC';
        
        // Restore dates and times
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];
        document.getElementById('checkInDate').value = formData.checkInDate || today;
        document.getElementById('checkInTime').value = formData.checkInTime || currentTime;
        document.getElementById('checkOutDate').value = formData.checkOutDate || today;
        document.getElementById('checkOutTime').value = formData.checkOutTime || currentTime;
        
        // Restore GST details
        const gstTypeRadio = document.querySelector(`input[name="gstType"][value="${formData.gstType || 'none'}"]`);
        if (gstTypeRadio) {
            gstTypeRadio.checked = true;
            // Show/hide GST input field based on selection
            const gstInput = document.querySelector('.gst-input');
            gstInput.style.display = formData.gstType === 'gst' ? 'block' : 'none';
        }
        document.getElementById('gstNumber').value = formData.gstNumber || '';
        
        // Restore logo details
        const logoSourceRadio = document.querySelector(`input[name="logoSource"][value="${formData.logoSource || 'url'}"]`);
        if (logoSourceRadio) {
            logoSourceRadio.checked = true;
        }
        document.getElementById('logoUrlInput').value = formData.logoUrl || '';
        document.getElementById('logoAuth').checked = formData.logoAuth || false;
        
        // Restore payment details
        document.getElementById('currency').value = formData.currency || 'INR';
        document.getElementById('paymentType').value = formData.paymentType || 'Cash';
        document.getElementById('taxPercent').value = formData.taxPercent || '0';
        document.getElementById('advanceAmount').value = formData.advanceAmount || '0';
        
        // Restore signature details
        const signatureSourceRadio = document.querySelector(`input[name="signatureSource"][value="${formData.signatureSource || 'url'}"]`);
        if (signatureSourceRadio) {
            signatureSourceRadio.checked = true;
        }
        document.getElementById('signatureUrlInput').value = formData.signatureUrl || '';
        document.getElementById('signatureAuth').checked = formData.signatureAuth || false;
        
        // Restore guest details
        document.getElementById('guestName').value = formData.guestName || '';
        document.getElementById('guestGender').value = formData.guestGender || 'Male';
        document.getElementById('guestAge').value = formData.guestAge || '';
        document.getElementById('guestAddress').value = formData.guestAddress || '';
        
        // Restore file details
        document.getElementById('fileName').value = formData.fileName || '';
        
        // Restore template
        const templateRadio = document.querySelector(`input[name="template"][value="${formData.template || '1'}"]`);
        if (templateRadio) {
            templateRadio.checked = true;
        }
        
        // Restore room items
        if (formData.roomItems && formData.roomItems.length > 0) {
            const roomTable = document.getElementById('roomTableBody');
            
            // Clear existing rows except the first one
            while (roomTable.children.length > 1) {
                roomTable.removeChild(roomTable.lastChild);
            }
            
            // Populate the first row
            const firstRow = roomTable.firstElementChild;
            if (firstRow && formData.roomItems[0]) {
                firstRow.querySelector('.room-description').value = formData.roomItems[0].description || '';
                firstRow.querySelector('.room-rate').value = formData.roomItems[0].rate || '0';
                firstRow.querySelector('.room-days').value = formData.roomItems[0].days || '0';
                
                const rate = parseFloat(formData.roomItems[0].rate) || 0;
                const days = parseFloat(formData.roomItems[0].days) || 0;
                const total = rate * days;
                firstRow.querySelector('.room-total').textContent = `₹${total.toFixed(2)}`;
            }
            
            // Add additional rows if needed
            for (let i = 1; i < formData.roomItems.length; i++) {
                const item = formData.roomItems[i];
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td><input type="text" class="room-description" value="${item.description || ''}"></td>
                    <td><input type="number" class="room-rate" value="${item.rate || '0'}"></td>
                    <td><input type="number" class="room-days" value="${item.days || '0'}"></td>
                    <td class="room-total">₹${((parseFloat(item.rate) || 0) * (parseFloat(item.days) || 0)).toFixed(2)}</td>
                    <td>
                        <button class="add-row">+</button>
                        <button class="remove-row">-</button>
                    </td>
                `;
                roomTable.appendChild(newRow);
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
        
        // Save form data when room table changes
        const roomTable = document.getElementById('roomTableBody');
        roomTable.addEventListener('input', function() {
            saveFormData();
        });
        
        // Update clear button to also clear localStorage
        const clearBtn = document.getElementById('clearBtn');
        const originalClearBtnClick = clearBtn.onclick;
        clearBtn.onclick = function(e) {
            // Remove the saved form data from localStorage
            localStorage.removeItem('hotelBillFormData');
            
            // Reset dates and times to current values
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];
            
            document.getElementById('checkInDate').value = today;
            document.getElementById('checkInTime').value = currentTime;
            document.getElementById('checkOutDate').value = today;
            document.getElementById('checkOutTime').value = currentTime;
            
            // Reset radio buttons to defaults
            document.querySelector('input[name="template"][value="1"]').checked = true;
            document.querySelector('input[name="gstType"][value="none"]').checked = true;
            document.querySelector('input[name="logoSource"][value="url"]').checked = true;
            document.querySelector('input[name="signatureSource"][value="url"]').checked = true;
            
            // Hide GST input
            document.querySelector('.gst-input').style.display = 'none';
            
            // Reset checkboxes
            document.getElementById('logoAuth').checked = false;
            document.getElementById('signatureAuth').checked = false;
            
            // Reset room table
            const roomTable = document.getElementById('roomTableBody');
            while (roomTable.children.length > 1) {
                roomTable.removeChild(roomTable.lastChild);
            }
            const firstRow = roomTable.firstElementChild;
            firstRow.querySelector('.room-description').value = '';
            firstRow.querySelector('.room-rate').value = '0';
            firstRow.querySelector('.room-days').value = '0';
            firstRow.querySelector('.room-total').textContent = '₹0';
            
            // Reset other form fields
            document.getElementById('hotelName').value = '';
            document.getElementById('hotelAddress').value = '';
            document.getElementById('billNo').value = '';
            document.getElementById('nationality').value = 'Indian';
            document.getElementById('roomNo').value = '';
            document.getElementById('roomType').value = 'AC';
            document.getElementById('gstNumber').value = '';
            document.getElementById('logoUrlInput').value = '';
            document.getElementById('signatureUrlInput').value = '';
            document.getElementById('currency').value = 'INR';
            document.getElementById('paymentType').value = 'Cash';
            document.getElementById('taxPercent').value = '0';
            document.getElementById('advanceAmount').value = '0';
            document.getElementById('guestName').value = '';
            document.getElementById('guestGender').value = 'Male';
            document.getElementById('guestAge').value = '';
            document.getElementById('guestAddress').value = '';
            document.getElementById('fileName').value = '';
            
            updatePreview();
            return false; // Prevent the original click handler from running
        };
    }
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
