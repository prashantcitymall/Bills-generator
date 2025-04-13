document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Initialize elements
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const medicalServicesContainer = document.querySelector('.medical-services-container');
    
    // Template data storage for independent forms
    const templateData = {
        template1: {}, // Apollo Hospitals template data
        template2: {}  // General Hospital template data
    };
    
    // Add event listeners for template selection
    const templateRadios = document.querySelectorAll('input[name="template"]');
    templateRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Save current form data to the previous template
            const previousTemplate = radio.value === 'template1' ? 'template2' : 'template1';
            saveTemplateData(previousTemplate);
            
            // Load data for the selected template
            loadTemplateData(radio.value);
            
            // Update preview
            updatePreview();
        });
    });
    
    // Function to save template-specific data
    function saveTemplateData(templateName) {
        const data = {};
        
        // Save hospital details
        data.hospitalName = document.getElementById('hospitalName').value;
        data.hospitalAddress = document.getElementById('hospitalAddress').value;
        data.hospitalPhone = document.getElementById('hospitalPhone').value;
        data.hospitalFax = document.getElementById('hospitalFax').value;
        
        // Save patient details
        data.patientName = document.getElementById('patientName').value;
        data.billToName = document.getElementById('billToName').value;
        data.patientAddress = document.getElementById('patientAddress').value;
        data.patientPhone = document.getElementById('patientPhone').value;
        
        // Save invoice details
        data.invoiceNumber = document.getElementById('invoiceNumber').value;
        data.invoiceDate = document.getElementById('invoiceDate').value;
        data.downloadFileName = document.getElementById('downloadFileName').value;
        
        // Save medical services
        data.medicalServices = [];
        document.querySelectorAll('.medical-service-item').forEach(item => {
            data.medicalServices.push({
                description: item.querySelector('.item-description').value,
                price: item.querySelector('.item-price').value,
                quantity: item.querySelector('.item-quantity').value,
                tax: item.querySelector('.item-tax').value
            });
        });
        
        // Store in template data
        templateData[templateName] = data;
    }
    
    // Function to load template-specific data
    function loadTemplateData(templateName) {
        const data = templateData[templateName];
        if (!data || Object.keys(data).length === 0) {
            // If no data for this template yet, set defaults based on template
            if (templateName === 'template1') {
                // Apollo Hospitals template defaults
                document.getElementById('hospitalName').value = 'APOLLO HOSPITALS';
                document.getElementById('hospitalAddress').value = 'Opposite IIMB,154/11, Amalodhayi Nagar, Panduranga Nagar,Bangalore - 560076 (India)';
                document.getElementById('hospitalPhone').value = '+(91)-80-26304053 / 26304052';
                document.getElementById('hospitalFax').value = '+(91)-80-41463154';
                document.getElementById('downloadFileName').value = 'Apollo-Medical-Bill';
                
                // Set logo for Apollo template
                const logoPreview = document.getElementById('hospitalLogoPreview');
                logoPreview.src = 'images/apollo.png';
                logoPreview.alt = 'Apollo Hospitals Logo';
                
                // Clear other fields or set defaults
                document.getElementById('patientName').value = '';
                document.getElementById('billToName').value = '';
                document.getElementById('patientAddress').value = '';
                document.getElementById('patientPhone').value = '';
                document.getElementById('invoiceNumber').value = '';
                document.getElementById('invoiceDate').value = today;
            } else {
                // General Hospital template defaults
                document.getElementById('hospitalName').value = '';
                document.getElementById('hospitalAddress').value = '';
                document.getElementById('hospitalPhone').value = '';
                document.getElementById('hospitalFax').value = '';
                document.getElementById('downloadFileName').value = 'Medical-Bill';
                
                // Set logo for General Hospital template
                const logoPreview = document.getElementById('hospitalLogoPreview');
                logoPreview.src = 'images/hospital-logo3.svg';
                logoPreview.alt = 'General Hospital Logo';
                
                // Clear other fields
                document.getElementById('patientName').value = '';
                document.getElementById('billToName').value = '';
                document.getElementById('patientAddress').value = '';
                document.getElementById('patientPhone').value = '';
                document.getElementById('invoiceNumber').value = '';
                document.getElementById('invoiceDate').value = today;
            }
            
            // Reset medical services
            medicalServicesContainer.innerHTML = `
                <div class="medical-service-item">
                    <div class="service-row">
                        <div class="service-field">
                            <label>Description</label>
                            <input type="text" class="item-description" placeholder="Enter Service Description">
                        </div>
                    </div>
                    <div class="service-row">
                        <div class="service-field">
                            <label>Unit Price</label>
                            <input type="number" class="item-price" min="0" step="0.01" placeholder="Enter Unit Price">
                        </div>
                        <div class="service-field">
                            <label>Quantity</label>
                            <input type="number" class="item-quantity" min="1" value="1">
                        </div>
                        <div class="service-field">
                            <label>Tax %</label>
                            <input type="number" class="item-tax" min="0" max="100" value="0">
                        </div>
                        <div class="service-actions">
                            <label>Action</label>
                            <div class="action-buttons">
                                <button type="button" class="add-service-btn" style="background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;">+</button>
                                <button type="button" class="remove-service-btn" style="background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;">−</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Load data into form fields
        document.getElementById('hospitalName').value = data.hospitalName || '';
        document.getElementById('hospitalAddress').value = data.hospitalAddress || '';
        document.getElementById('hospitalPhone').value = data.hospitalPhone || '';
        document.getElementById('hospitalFax').value = data.hospitalFax || '';
        
        document.getElementById('patientName').value = data.patientName || '';
        document.getElementById('billToName').value = data.billToName || '';
        document.getElementById('patientAddress').value = data.patientAddress || '';
        document.getElementById('patientPhone').value = data.patientPhone || '';
        
        document.getElementById('invoiceNumber').value = data.invoiceNumber || '';
        document.getElementById('invoiceDate').value = data.invoiceDate || today;
        document.getElementById('downloadFileName').value = data.downloadFileName || '';
        
        // Load medical services
        if (data.medicalServices && data.medicalServices.length > 0) {
            medicalServicesContainer.innerHTML = '';
            data.medicalServices.forEach(service => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'medical-service-item';
                serviceItem.innerHTML = `
                    <div class="service-row">
                        <div class="service-field">
                            <label>Description</label>
                            <input type="text" class="item-description" placeholder="Enter Service Description" value="${service.description || ''}">
                        </div>
                    </div>
                    <div class="service-row">
                        <div class="service-field">
                            <label>Unit Price</label>
                            <input type="number" class="item-price" min="0" step="0.01" placeholder="Enter Unit Price" value="${service.price || ''}">
                        </div>
                        <div class="service-field">
                            <label>Quantity</label>
                            <input type="number" class="item-quantity" min="1" value="${service.quantity || '1'}">
                        </div>
                        <div class="service-field">
                            <label>Tax %</label>
                            <input type="number" class="item-tax" min="0" max="100" value="${service.tax || '0'}">
                        </div>
                        <div class="service-actions">
                            <label>Action</label>
                            <div class="action-buttons">
                                <button type="button" class="add-service-btn" style="background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;">+</button>
                                <button type="button" class="remove-service-btn" style="background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;">−</button>
                            </div>
                        </div>
                    </div>
                `;
                medicalServicesContainer.appendChild(serviceItem);
            });
        }
    }

    // Add event listeners for add/remove service buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-service-btn')) {
            addMedicalService();
        }
        if (e.target.closest('.remove-service-btn')) {
            const serviceItem = e.target.closest('.medical-service-item');
            if (document.querySelectorAll('.medical-service-item').length > 1) {
                serviceItem.remove();
                updatePreview();
                
                // Save current template data
                const currentTemplate = document.querySelector('input[name="template"]:checked').value;
                saveTemplateData(currentTemplate);
            }
        }
    });

    // Improved live preview update - Add input event listeners to the form container
    const formContainer = document.querySelector('.form-container');
    formContainer.addEventListener('input', function(e) {
        // Update preview immediately on any input change
        updatePreview();
        
        // Save template-specific data
        const currentTemplate = document.querySelector('input[name="template"]:checked').value;
        clearTimeout(formContainer.saveTimeout);
        formContainer.saveTimeout = setTimeout(() => {
            saveTemplateData(currentTemplate);
            saveFormData(); // Also save to localStorage for persistence
        }, 500);
    });
    
    // Also listen for change events (for select elements, radio buttons, etc.)
    formContainer.addEventListener('change', function(e) {
        // Don't handle template radio changes here, they're handled separately
        if (!e.target.matches('input[name="template"]')) {
            updatePreview();
            
            // Save template-specific data
            const currentTemplate = document.querySelector('input[name="template"]:checked').value;
            clearTimeout(formContainer.saveTimeout);
            formContainer.saveTimeout = setTimeout(() => {
                saveTemplateData(currentTemplate);
                saveFormData(); // Also save to localStorage for persistence
            }, 500);
        }
    });

    // Initialize with the default template
    const defaultTemplate = document.querySelector('input[name="template"]:checked').value;
    loadTemplateData(defaultTemplate);

    // Function to add a new medical service item
    function addMedicalService() {
        const serviceItem = document.querySelector('.medical-service-item').cloneNode(true);
        // Clear input values
        serviceItem.querySelectorAll('input').forEach(input => {
            if (input.classList.contains('item-quantity')) {
                input.value = '1';
            } else if (input.classList.contains('item-tax')) {
                input.value = '0';
            } else {
                input.value = '';
            }
        });
        serviceItem.querySelector('.add-service-btn').style = "background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;";
        serviceItem.querySelector('.remove-service-btn').style = "background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;";
        medicalServicesContainer.appendChild(serviceItem);
        updatePreview();
        
        // Save current template data
        const currentTemplate = document.querySelector('input[name="template"]:checked').value;
        saveTemplateData(currentTemplate);
    }

    // Calculate amounts when price or quantity changes
    medicalServicesContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-price') || 
            e.target.classList.contains('item-quantity') || 
            e.target.classList.contains('item-tax')) {
            updatePreview();
            
            // Save current template data
            const currentTemplate = document.querySelector('input[name="template"]:checked').value;
            saveTemplateData(currentTemplate);
        }
    });

    // Load saved form data from localStorage
    loadFormData();
    
    // Set up form data persistence
    setupFormPersistence();

    // Add medical item button functionality
    document.getElementById('addItemBtn').addEventListener('click', function() {
        addMedicalItem();
    });

    // Calculate amount when quantity or unit price changes
    document.addEventListener('input', function(e) {
        if (e.target.id.startsWith('itemQuantity') || e.target.id.startsWith('itemUnitPrice')) {
            const itemNumber = e.target.id.replace('itemQuantity', '').replace('itemUnitPrice', '');
            calculateAmount(itemNumber);
            updateTotals();
        }
    });

    // Download functionality - using both direct button click and custom event
    downloadBtn.addEventListener('click', handleDownload);
    document.addEventListener('medical-bill-download', handleDownload);
    
    async function handleDownload() {
        // Check if user is logged in
        if (!window.authState || !window.authState.isAuthenticated) {
            // User is not logged in, show alert
            alert('Please sign in to download bills');
            return;
        }
        
        // Validate the form
        if (!validateMedicalForm()) return;
        
        const previewContent = document.querySelector('.receipt-preview');
        const fileName = document.getElementById('downloadFileName').value || 'medical-bill';

        // Hide watermark temporarily
        const watermark = document.querySelector('.watermark');
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

            // Calculate dimensions with 5% margins
            const a4Width = 210; // A4 width in mm
            const a4Height = 297; // A4 height in mm
            
            // Calculate 5% margins
            const leftMargin = a4Width * 0.05; // 5% of width for left margin
            const topMargin = a4Height * 0.05; // 5% of height for top margin
            
            // Calculate available width after margins
            const availableWidth = a4Width * 0.9; // 90% of A4 width (100% - 5% - 5%)
            
            // Calculate image height proportionally
            const imgHeight = canvas.height * availableWidth / canvas.width;

            // Add the image to the PDF with margins
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            doc.addImage(imgData, 'JPEG', leftMargin, topMargin, availableWidth, imgHeight);

            // Save the PDF
            doc.save(`${fileName}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            // Show watermark again
            if (watermark) watermark.style.display = 'block';
        }
    }

    // Update preview when form fields change
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('input', updatePreview);
    });

    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the form?')) {
            const form = document.querySelector('.form-container');
            const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // Reset date to today
            document.getElementById('invoiceDate').value = today;
            
            // Reset radio buttons to default
            document.querySelector('input[name="template"][value="template1"]').checked = true;
            
            // Reset medical items
            const medicalServicesContainer = document.querySelector('.medical-services-container');
            medicalServicesContainer.innerHTML = '';
            
            // Add one empty service item
            const serviceItem = document.createElement('div');
            serviceItem.className = 'medical-service-item';
            serviceItem.innerHTML = `
                <div class="service-row">
                    <div class="service-field">
                        <label>Description</label>
                        <input type="text" class="item-description" placeholder="Enter Service Description">
                    </div>
                </div>
                <div class="service-row">
                    <div class="service-field">
                        <label>Unit Price</label>
                        <input type="number" class="item-price" min="0" step="0.01" placeholder="Enter Unit Price">
                    </div>
                    <div class="service-field">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" min="1" value="1">
                    </div>
                    <div class="service-field">
                        <label>Tax %</label>
                        <input type="number" class="item-tax" min="0" max="100" value="0">
                    </div>
                    <div class="service-actions">
                        <label>Action</label>
                        <div class="action-buttons">
                            <button type="button" class="add-service-btn" style="background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;">+</button>
                            <button type="button" class="remove-service-btn" style="background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;">−</button>
                        </div>
                    </div>
                </div>
            `;
            medicalServicesContainer.appendChild(serviceItem);
            
            updatePreview();
            localStorage.removeItem('medicalBillFormData');
        }
    });

    // Add first medical item if none exists
    if (document.querySelectorAll('.medical-service-item').length === 0) {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'medical-service-item';
        serviceItem.innerHTML = `
            <div class="service-row">
                <div class="service-field">
                    <label>Description</label>
                    <input type="text" class="item-description" placeholder="Enter Service Description">
                </div>
            </div>
            <div class="service-row">
                <div class="service-field">
                    <label>Unit Price</label>
                    <input type="number" class="item-price" min="0" step="0.01" placeholder="Enter Unit Price">
                </div>
                <div class="service-field">
                    <label>Quantity</label>
                    <input type="number" class="item-quantity" min="1" value="1">
                </div>
                <div class="service-field">
                    <label>Tax %</label>
                    <input type="number" class="item-tax" min="0" max="100" value="0">
                </div>
                <div class="service-actions">
                    <label>Action</label>
                    <div class="action-buttons">
                        <button type="button" class="add-service-btn" style="background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;">+</button>
                        <button type="button" class="remove-service-btn" style="background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;">−</button>
                    </div>
                </div>
            </div>
        `;
        medicalServicesContainer.appendChild(serviceItem);
    }

    // Initial preview update
    updatePreview();
    
    // Function to calculate amount for a row
    function calculateRowAmount(row) {
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
        const taxPercent = parseFloat(row.querySelector('.item-tax').value) || 0;
        
        const subtotal = price * quantity;
        const taxAmount = subtotal * (taxPercent / 100);
        const total = subtotal + taxAmount;
        
        // We don't have a direct amount field in the row, but we'll use this for the preview
        row.dataset.amount = total.toFixed(2);
    }

    // Function to save form data to localStorage
    function saveFormData() {
        const medicalItemsData = [];
        document.querySelectorAll('.medical-service-item').forEach(item => {
            medicalItemsData.push({
                description: item.querySelector('.item-description').value || '',
                unitPrice: item.querySelector('.item-price').value || '',
                quantity: item.querySelector('.item-quantity').value || '1',
                tax: item.querySelector('.item-tax').value || '0'
            });
        });
        
        const formData = {
            hospitalName: document.getElementById('hospitalName').value,
            hospitalAddress: document.getElementById('hospitalAddress').value,
            hospitalPhone: document.getElementById('hospitalPhone').value,
            hospitalFax: document.getElementById('hospitalFax').value,
            patientName: document.getElementById('patientName').value,
            billToName: document.getElementById('billToName').value,
            patientAddress: document.getElementById('patientAddress').value,
            patientPhone: document.getElementById('patientPhone').value,
            invoiceNumber: document.getElementById('invoiceNumber').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            downloadFileName: document.getElementById('downloadFileName').value,
            template: document.querySelector('input[name="template"]:checked').value,
            medicalItems: medicalItemsData
        };
        
        localStorage.setItem('medicalBillFormData', JSON.stringify(formData));
    }
    
    // Function to load form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('medicalBillFormData');
        if (!savedData) return;
        
        const formData = JSON.parse(savedData);
        
        // Populate form fields
        document.getElementById('hospitalName').value = formData.hospitalName || '';
        document.getElementById('hospitalAddress').value = formData.hospitalAddress || '';
        document.getElementById('hospitalPhone').value = formData.hospitalPhone || '';
        document.getElementById('hospitalFax').value = formData.hospitalFax || '';
        document.getElementById('patientName').value = formData.patientName || '';
        document.getElementById('billToName').value = formData.billToName || '';
        document.getElementById('patientAddress').value = formData.patientAddress || '';
        document.getElementById('patientPhone').value = formData.patientPhone || '';
        document.getElementById('invoiceNumber').value = formData.invoiceNumber || '';
        document.getElementById('invoiceDate').value = formData.invoiceDate || today;
        document.getElementById('downloadFileName').value = formData.downloadFileName || '';
        
        // Set template
        if (formData.template) {
            document.querySelector(`input[name="template"][value="${formData.template}"]`).checked = true;
        }
        
        // Clear existing medical items
        const medicalServicesContainer = document.querySelector('.medical-services-container');
        medicalServicesContainer.innerHTML = '';
        
        // Add saved medical items
        if (formData.medicalItems && formData.medicalItems.length > 0) {
            formData.medicalItems.forEach(item => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'medical-service-item';
                serviceItem.innerHTML = `
                    <div class="service-row">
                        <div class="service-field">
                            <label>Description</label>
                            <input type="text" class="item-description" placeholder="Enter Service Description" value="${item.description || ''}">
                        </div>
                    </div>
                    <div class="service-row">
                        <div class="service-field">
                            <label>Unit Price</label>
                            <input type="number" class="item-price" min="0" step="0.01" placeholder="Enter Unit Price" value="${item.unitPrice || ''}">
                        </div>
                        <div class="service-field">
                            <label>Quantity</label>
                            <input type="number" class="item-quantity" min="1" value="${item.quantity || '1'}">
                        </div>
                        <div class="service-field">
                            <label>Tax %</label>
                            <input type="number" class="item-tax" min="0" max="100" value="${item.tax || '0'}">
                        </div>
                        <div class="service-actions">
                            <label>Action</label>
                            <div class="action-buttons">
                                <button type="button" class="add-service-btn" style="background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;">+</button>
                                <button type="button" class="remove-service-btn" style="background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;">−</button>
                            </div>
                        </div>
                    </div>
                `;
                medicalServicesContainer.appendChild(serviceItem);
            });
        } else {
            // Add one empty service item
            const serviceItem = document.createElement('div');
            serviceItem.className = 'medical-service-item';
            serviceItem.innerHTML = `
                <div class="service-row">
                    <div class="service-field">
                        <label>Description</label>
                        <input type="text" class="item-description" placeholder="Enter Service Description">
                    </div>
                </div>
                <div class="service-row">
                    <div class="service-field">
                        <label>Unit Price</label>
                        <input type="number" class="item-price" min="0" step="0.01" placeholder="Enter Unit Price">
                    </div>
                    <div class="service-field">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" min="1" value="1">
                    </div>
                    <div class="service-field">
                        <label>Tax %</label>
                        <input type="number" class="item-tax" min="0" max="100" value="0">
                    </div>
                    <div class="service-actions">
                        <label>Action</label>
                        <div class="action-buttons">
                            <button type="button" class="add-service-btn" style="background-color: #ff5a5f; color: white; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: none;">+</button>
                            <button type="button" class="remove-service-btn" style="background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e0e0e0;">−</button>
                        </div>
                    </div>
                </div>
            `;
            medicalServicesContainer.appendChild(serviceItem);
        }
        
        // Update preview
        updatePreview();
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
        
        // Update the download button to store current page URL before redirecting to login
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', function() {
            if (!window.authState || !window.authState.isAuthenticated) {
                // Store the current URL to return after login
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
            }
        });
    }

    // Function to add a new medical item
    function addMedicalItem() {
        const medicalItemsContainer = document.getElementById('medicalItemsContainer');
        const itemCount = medicalItemsContainer.querySelectorAll('.medical-item').length + 1;
        
        const medicalItem = document.createElement('div');
        medicalItem.className = 'medical-item';
        medicalItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="itemDescription${itemCount}">Description</label>
                    <input type="text" id="itemDescription${itemCount}" placeholder="Enter Service Description">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="itemQuantity${itemCount}">Quantity</label>
                    <input type="number" id="itemQuantity${itemCount}" value="1" min="1">
                </div>
                <div class="form-group">
                    <label for="itemUnitPrice${itemCount}">Unit Price</label>
                    <input type="number" id="itemUnitPrice${itemCount}" placeholder="Enter Unit Price" step="0.01">
                </div>
                <div class="form-group">
                    <label for="itemAmount${itemCount}">Amount</label>
                    <input type="number" id="itemAmount${itemCount}" placeholder="0.00" readonly>
                </div>
            </div>
        `;
        
        // Add remove button for all items except the first one
        if (itemCount > 1) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-item';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.addEventListener('click', function() {
                medicalItem.remove();
                updatePreview();
                saveFormData();
            });
            medicalItem.appendChild(removeButton);
        }
        
        medicalItemsContainer.appendChild(medicalItem);
        updatePreview();
    }

    // Function to calculate amount for a medical item
    function calculateAmount(itemNumber) {
        const quantityInput = document.getElementById(`itemQuantity${itemNumber}`);
        const unitPriceInput = document.getElementById(`itemUnitPrice${itemNumber}`);
        const amountInput = document.getElementById(`itemAmount${itemNumber}`);
        
        if (quantityInput && unitPriceInput && amountInput) {
            const quantity = parseInt(quantityInput.value) || 0;
            const unitPrice = parseFloat(unitPriceInput.value) || 0;
            const amount = quantity * unitPrice;
            amountInput.value = amount.toFixed(2);
        }
    }

    // Function to update totals
    function updateTotals() {
        let totalAmount = 0;
        
        document.querySelectorAll('.medical-item').forEach((item, index) => {
            const itemNumber = index + 1;
            const amountInput = document.getElementById(`itemAmount${itemNumber}`);
            
            if (amountInput) {
                const amount = parseFloat(amountInput.value) || 0;
                totalAmount += amount;
            }
        });
        
        // Update preview total
        document.getElementById('totalAmount').textContent = `Rs. ${totalAmount.toFixed(0)}`;
    }

    // Validation function for required fields
    function validateMedicalForm() {
        // Get all required fields
        const requiredFields = [
            { id: 'hospitalName', name: 'Hospital Name' },
            { id: 'hospitalAddress', name: 'Hospital Address' },
            { id: 'hospitalPhone', name: 'Hospital Phone' },
            { id: 'patientName', name: 'Patient Name' },
            { id: 'billToName', name: 'Bill To Name' },
            { id: 'patientAddress', name: 'Patient Address' },
            { id: 'invoiceNumber', name: 'Invoice Number' },
            { id: 'invoiceDate', name: 'Invoice Date' }
        ];
        
        // Check if any required field is empty
        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                alert(`${field.name} is required`);
                if (element) element.focus();
                return false;
            }
        }
        
        // Check if at least one medical service item has description and price
        const serviceItems = document.querySelectorAll('.medical-service-item');
        let hasValidItem = false;
        
        for (const item of serviceItems) {
            const description = item.querySelector('.item-description').value.trim();
            const price = parseFloat(item.querySelector('.item-price').value) || 0;
            
            if (description && price > 0) {
                hasValidItem = true;
                break;
            }
        }
        
        if (!hasValidItem) {
            alert('At least one medical service with description and price is required');
            return false;
        }
        
        return true;
    }

    // Function to update preview
    function updatePreview() {
        // Get the current template
        const template = document.querySelector('input[name="template"]:checked').value;
        
        // Set hospital logo based on template
        const logoPreview = document.getElementById('hospitalLogoPreview');
        
        if (template === 'template1') {
            // Apollo Hospitals Template
            logoPreview.src = 'images/apollo.png';
            logoPreview.alt = 'Apollo Hospitals Logo';
            
            // Update hospital details for Apollo template
            document.getElementById('previewHospitalName').textContent = 'APOLLO HOSPITALS';
            document.getElementById('previewHospitalAddress').textContent = 'Opposite IIMB,154/11, Amalodhayi Nagar, Panduranga Nagar,Bangalore - 560076 (India)';
            document.getElementById('previewHospitalContact').textContent = 'Tel.: +(91)-80-26304053 / 26304052 Fax: +(91)-80-41463154';
            
            // Only update patient and invoice details from form inputs
            document.getElementById('previewPatientName').textContent = document.getElementById('patientName').value || 'Krishnappa';
            document.getElementById('previewBillToName').textContent = document.getElementById('billToName').value || 'Sagar R';
            document.getElementById('previewPatientAddress').textContent = document.getElementById('patientAddress').value || '#4726, Vijayanag 4th stage, Mysore 570032';
            document.getElementById('previewPatientPhone').textContent = document.getElementById('patientPhone').value || '9972515926';
            document.getElementById('previewInvoiceNumber').textContent = document.getElementById('invoiceNumber').value || '2001321';
            document.getElementById('previewInvoiceDate').textContent = formatDate(document.getElementById('invoiceDate').value) || '2/6/2022';
        } else {
            // General Hospital Template
            logoPreview.src = 'images/hospital-logo3.svg';
            logoPreview.alt = 'General Hospital Logo';
            
            // Update all details from form inputs for general template
            document.getElementById('previewHospitalName').textContent = document.getElementById('hospitalName').value || 'GENERAL HOSPITAL';
            document.getElementById('previewHospitalAddress').textContent = document.getElementById('hospitalAddress').value || 'Hospital Address, City - Pincode';
            
            const hospitalPhone = document.getElementById('hospitalPhone').value || 'Phone Number';
            const hospitalFax = document.getElementById('hospitalFax').value || 'Fax Number';
            document.getElementById('previewHospitalContact').textContent = `Tel.: ${hospitalPhone} Fax: ${hospitalFax}`;
            
            document.getElementById('previewPatientName').textContent = document.getElementById('patientName').value || 'Patient Name';
            document.getElementById('previewBillToName').textContent = document.getElementById('billToName').value || 'Bill To Name';
            document.getElementById('previewPatientAddress').textContent = document.getElementById('patientAddress').value || 'Patient Address';
            document.getElementById('previewPatientPhone').textContent = document.getElementById('patientPhone').value || 'Phone Number';
            document.getElementById('previewInvoiceNumber').textContent = document.getElementById('invoiceNumber').value || 'Invoice Number';
            document.getElementById('previewInvoiceDate').textContent = formatDate(document.getElementById('invoiceDate').value) || formatDate(today);
        }
        
        // Update medical items table (common for both templates)
        updateMedicalItemsTable();
    }

    // Function to update medical items table
    function updateMedicalItemsTable() {
        const tableBody = document.getElementById('medicalItemsTableBody');
        tableBody.innerHTML = '';
        
        let totalAmount = 0;
        
        // Get all service items from the form
        const serviceItems = document.querySelectorAll('.medical-service-item');
        
        serviceItems.forEach(item => {
            const description = item.querySelector('.item-description').value;
            const unitPrice = parseFloat(item.querySelector('.item-price').value) || 0;
            const quantity = parseInt(item.querySelector('.item-quantity').value) || 0;
            const taxPercent = parseFloat(item.querySelector('.item-tax').value) || 0;
            
            // Skip empty rows
            if (!description && unitPrice === 0) return;
            
            const subtotal = unitPrice * quantity;
            const taxAmount = subtotal * (taxPercent / 100);
            const total = subtotal + taxAmount;
            
            totalAmount += total;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${description}</td>
                <td>${quantity}</td>
                <td>₹ ${unitPrice.toFixed(2)}</td>
                <td>₹ ${total.toFixed(2)}</td>
            `;
            
            tableBody.appendChild(tr);
        });
        
        // Update total amount
        document.getElementById('totalAmount').textContent = `₹ ${totalAmount.toFixed(2)}`;
    }

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        }).replace(/\//g, '/');
    }
});
