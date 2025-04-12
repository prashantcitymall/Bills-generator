// Sejda-style Signature Functionality
class SejdaSignature {
    constructor() {
        this.signatures = [];
        this.activeSignatureId = null;
        this.currentTab = 'type';
        this.typedText = '';
        this.selectedStyle = 'signature-style-1';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.canvas = null;
        this.ctx = null;
        this.uploadedImage = null;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = '';
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialWidth = 0;
        this.initialHeight = 0;
        this.initialLeft = 0;
        this.initialTop = 0;
        
        // Load Google Fonts for signature styles
        this.loadGoogleFonts();
        
        // Initialize
        this.init();
    }
    
    loadGoogleFonts() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script&family=Pacifico&family=Satisfy&family=Great+Vibes&family=Sacramento&family=Allura&family=Tangerine&family=Yellowtail&family=Kaushan+Script&display=swap';
        document.head.appendChild(link);
    }
    
    init() {
        // Add signature button to the form
        this.addSignatureButton();
        
        // Load saved signatures
        this.loadSignatures();
        
        // Add event listener for the preview containers
        // Check for receipt preview (donation form), bill preview (general bill form), or driver salary preview
        const receiptPreview = document.getElementById('receiptPreview');
        const billPreview = document.getElementById('billPreview');
        const driverSalaryPreview = document.getElementById('driverSalaryPreview');
        
        // Add event listeners to all possible preview containers
        [receiptPreview, billPreview, driverSalaryPreview].forEach(container => {
            if (container) {
                container.addEventListener('mousedown', this.handlePreviewMouseDown.bind(this));
                container.addEventListener('mousemove', this.handlePreviewMouseMove.bind(this));
                
                // Touch events for mobile
                container.addEventListener('touchstart', this.handlePreviewTouchStart.bind(this));
                container.addEventListener('touchmove', this.handlePreviewTouchMove.bind(this));
                container.addEventListener('touchend', this.handlePreviewTouchEnd.bind(this));
            }
        });
        
        // Add document-level mouse up event listener
        document.addEventListener('mouseup', this.handlePreviewMouseUp.bind(this));
    }
    
    addSignatureButton() {
        // For donation form - dynamically add the button if it doesn't exist
        const donationForm = document.getElementById('donationForm');
        if (donationForm) {
            // Create signature container
            const signatureContainer = document.createElement('div');
            signatureContainer.className = 'form-group signature-container';
            
            // Create signature button
            const signatureButton = document.createElement('button');
            signatureButton.type = 'button';
            signatureButton.className = 'signature-add-btn';
            signatureButton.innerHTML = '<i class="fas fa-signature"></i> Add Signature';
            signatureButton.addEventListener('click', this.openSignatureModal.bind(this));
            
            signatureContainer.appendChild(signatureButton);
            
            // Insert before the form actions
            const formActions = donationForm.querySelector('.form-actions');
            if (formActions) {
                donationForm.insertBefore(signatureContainer, formActions);
            } else {
                donationForm.appendChild(signatureContainer);
            }
        }
        
        // For general bill and other forms - find existing button and add event listener
        const existingSignatureBtn = document.getElementById('addSignatureBtn');
        if (existingSignatureBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newBtn = existingSignatureBtn.cloneNode(true);
            existingSignatureBtn.parentNode.replaceChild(newBtn, existingSignatureBtn);
            newBtn.addEventListener('click', this.openSignatureModal.bind(this));
        }
    }
    
    openSignatureModal() {
        // Remove any existing modal first to prevent duplicates
        const existingModal = document.querySelector('.signature-modal-overlay');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'signature-modal-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'signature-modal';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'signature-modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'signature-modal-title';
        modalTitle.textContent = 'Add Signature';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'signature-modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        // Initialize signature following mode
        this.isSignatureFollowingMode = false;
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'signature-modal-body';
        
        // Create tabs
        const tabs = document.createElement('div');
        tabs.className = 'signature-tabs';
        
        const typeTab = document.createElement('div');
        typeTab.className = 'signature-tab active';
        typeTab.dataset.tab = 'type';
        typeTab.textContent = 'Type';
        typeTab.addEventListener('click', () => this.switchTab('type'));
        
        const drawTab = document.createElement('div');
        drawTab.className = 'signature-tab';
        drawTab.dataset.tab = 'draw';
        drawTab.textContent = 'Draw';
        drawTab.addEventListener('click', () => this.switchTab('draw'));
        
        const uploadTab = document.createElement('div');
        uploadTab.className = 'signature-tab';
        uploadTab.dataset.tab = 'upload';
        uploadTab.textContent = 'Upload';
        uploadTab.addEventListener('click', () => this.switchTab('upload'));
        
        tabs.appendChild(typeTab);
        tabs.appendChild(drawTab);
        tabs.appendChild(uploadTab);
        
        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'signature-tab-content-container';
        
        // Type signature content
        const typeContent = this.createTypeSignatureContent();
        typeContent.className = 'signature-tab-content active';
        typeContent.dataset.tab = 'type';
        
        // Draw signature content
        const drawContent = this.createDrawSignatureContent();
        drawContent.className = 'signature-tab-content';
        drawContent.dataset.tab = 'draw';
        
        // Upload signature content
        const uploadContent = this.createUploadSignatureContent();
        uploadContent.className = 'signature-tab-content';
        uploadContent.dataset.tab = 'upload';
        
        tabContent.appendChild(typeContent);
        tabContent.appendChild(drawContent);
        tabContent.appendChild(uploadContent);
        
        // Create actions
        const actions = document.createElement('div');
        actions.className = 'signature-actions';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'signature-btn signature-btn-secondary';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        const saveButton = document.createElement('button');
        saveButton.className = 'signature-btn signature-btn-primary';
        saveButton.textContent = 'Save Signature';
        saveButton.addEventListener('click', () => {
            const signature = this.saveSignature();
            if (signature) {
                // Only remove the modal if we successfully created a signature
                document.body.removeChild(modalOverlay);
                
                // Enter signature following mode
                this.enterSignatureFollowingMode(signature);
            } else {
                alert('Could not create signature. Please try again.');
            }
        });
        
        actions.appendChild(cancelButton);
        actions.appendChild(saveButton);
        
        // Assemble modal
        modalBody.appendChild(tabs);
        modalBody.appendChild(tabContent);
        modalBody.appendChild(actions);
        
        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Initialize canvas after DOM is updated
        setTimeout(() => {
            this.initializeCanvas();
        }, 0);
    }
    
    createTypeSignatureContent() {
        const container = document.createElement('div');
        container.className = 'type-signature-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'type-signature-input';
        input.placeholder = 'Type your name';
        input.value = this.typedText;
        input.addEventListener('input', (e) => {
            this.typedText = e.target.value;
            this.updateTypeSignaturePreview();
        });
        
        const preview = document.createElement('div');
        preview.className = 'type-signature-preview';
        preview.style.minHeight = '100px';
        preview.style.display = 'flex';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';
        preview.style.border = '1px solid #e0e0e0';
        preview.style.borderRadius = '4px';
        preview.style.marginTop = '15px';
        preview.style.padding = '15px';
        
        const previewText = document.createElement('div');
        previewText.id = 'typeSignaturePreview';
        previewText.style.fontSize = '32px';
        previewText.style.color = '#000';
        previewText.style.backgroundColor = '#fff';
        previewText.style.padding = '10px';
        previewText.style.display = 'inline-block';
        previewText.style.width = 'auto';
        previewText.style.maxWidth = '100%';
        previewText.style.overflow = 'visible';
        previewText.className = this.selectedStyle;
        previewText.textContent = this.typedText || 'Your Signature';
        
        preview.appendChild(previewText);
        
        const stylesTitle = document.createElement('div');
        stylesTitle.style.marginTop = '20px';
        stylesTitle.style.marginBottom = '10px';
        stylesTitle.style.fontWeight = 'bold';
        stylesTitle.textContent = 'Select a style:';
        
        const styles = document.createElement('div');
        styles.className = 'signature-style-options';
        
        // Create 9 style options
        for (let i = 1; i <= 9; i++) {
            const style = document.createElement('div');
            style.className = `signature-style-option signature-style-${i}`;
            if (this.selectedStyle === `signature-style-${i}`) {
                style.classList.add('selected');
            }
            style.textContent = 'Signature';
            style.addEventListener('click', () => {
                document.querySelectorAll('.signature-style-option').forEach(el => {
                    el.classList.remove('selected');
                });
                style.classList.add('selected');
                this.selectedStyle = `signature-style-${i}`;
                this.updateTypeSignaturePreview();
            });
            styles.appendChild(style);
        }
        
        container.appendChild(input);
        container.appendChild(preview);
        container.appendChild(stylesTitle);
        container.appendChild(styles);
        
        return container;
    }
    
    createDrawSignatureContent() {
        const container = document.createElement('div');
        container.className = 'draw-signature-container';
        
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'draw-signature-canvas-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'drawSignatureCanvas';
        
        const clearButton = document.createElement('button');
        clearButton.className = 'draw-clear-btn';
        clearButton.textContent = 'Clear';
        clearButton.addEventListener('click', this.clearCanvas.bind(this));
        
        canvasContainer.appendChild(canvas);
        canvasContainer.appendChild(clearButton);
        
        const instructions = document.createElement('div');
        instructions.className = 'draw-signature-instructions';
        instructions.textContent = 'Draw your signature using your mouse or trackpad';
        
        container.appendChild(canvasContainer);
        container.appendChild(instructions);
        
        return container;
    }
    
    createUploadSignatureContent() {
        const container = document.createElement('div');
        container.className = 'upload-signature-container';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'signatureFileInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        const dropzone = document.createElement('div');
        dropzone.className = 'upload-signature-dropzone';
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#ff5a5f';
            dropzone.style.backgroundColor = 'rgba(255, 90, 95, 0.05)';
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = '#ccc';
            dropzone.style.backgroundColor = '';
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#ccc';
            dropzone.style.backgroundColor = '';
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                this.handleFileSelect({ target: fileInput });
            }
        });
        
        const icon = document.createElement('div');
        icon.className = 'upload-signature-dropzone-icon';
        icon.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
        
        const text = document.createElement('div');
        text.className = 'upload-signature-dropzone-text';
        text.innerHTML = 'Click to browse or drag and drop an image<br><small>JPG, PNG, GIF</small>';
        
        dropzone.appendChild(icon);
        dropzone.appendChild(text);
        
        const preview = document.createElement('div');
        preview.id = 'uploadSignaturePreview';
        preview.style.marginTop = '20px';
        preview.style.display = 'none';
        
        container.appendChild(fileInput);
        container.appendChild(dropzone);
        container.appendChild(preview);
        
        return container;
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.signature-tab').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`.signature-tab[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.signature-tab-content').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`.signature-tab-content[data-tab="${tab}"]`).classList.add('active');
        
        // Initialize canvas if switching to draw tab
        if (tab === 'draw') {
            this.initializeCanvas();
        }
    }
    
    initializeCanvas() {
        // Get the canvas element
        const canvas = document.getElementById('drawSignatureCanvas');
        if (!canvas) return;
        
        // Remove any existing event listeners to prevent duplicates
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        
        // Update references
        this.canvas = newCanvas;
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        
        // Set canvas styles
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#000';
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add event listeners
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.startDrawingTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.drawTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    }
    
    startDrawingTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        this.isDrawing = true;
        [this.lastX, this.lastY] = [offsetX, offsetY];
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
        
        [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    }
    
    drawTouch(e) {
        e.preventDefault();
        if (!this.isDrawing) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(offsetX, offsetY);
        this.ctx.stroke();
        
        [this.lastX, this.lastY] = [offsetX, offsetY];
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    clearCanvas() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPG, PNG, GIF).');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImage = e.target.result;
            
            // Show preview
            const preview = document.getElementById('uploadSignaturePreview');
            preview.style.display = 'block';
            preview.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = this.uploadedImage;
            img.className = 'upload-signature-preview';
            
            preview.appendChild(img);
        };
        
        reader.readAsDataURL(file);
    }
    
    updateTypeSignaturePreview() {
        const preview = document.getElementById('typeSignaturePreview');
        if (!preview) return;
        
        preview.textContent = this.typedText || 'Your Signature';
        preview.className = this.selectedStyle;
    }
    
    saveSignature() {
        let signatureImage = null;
        
        // Get signature based on active tab
        if (this.currentTab === 'type') {
            // Create canvas to convert typed signature to image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions based on preview
            const preview = document.getElementById('typeSignaturePreview');
            if (!preview) return; // Safety check
            
            const previewRect = preview.getBoundingClientRect();
            
            // Make canvas larger to ensure high quality
            canvas.width = Math.max(previewRect.width * 2, 400); // Minimum width
            canvas.height = Math.max(previewRect.height * 2, 200); // Minimum height
            
            // Clear canvas with full transparency
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
            
            // Ensure transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
            
            // Draw text with higher quality
            try {
                const fontStyle = window.getComputedStyle(preview).font;
                const fontSize = parseInt(window.getComputedStyle(preview).fontSize) * 2;
                const fontFamily = window.getComputedStyle(preview).fontFamily;
                
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.fillStyle = '#000'; // Ensure text is black
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Add padding around text to prevent cropping
                const padding = fontSize * 0.5;
                const textWidth = ctx.measureText(this.typedText || 'Your Signature').width;
                
                // Ensure canvas is wide enough for text
                if (textWidth + padding * 2 > canvas.width) {
                    canvas.width = textWidth + padding * 2;
                }
                
                ctx.fillText(this.typedText || 'Your Signature', canvas.width / 2, canvas.height / 2);
            } catch (e) {
                console.error('Error drawing text signature:', e);
                // Fallback to basic font with transparent background
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = '32px Arial';
                ctx.fillStyle = '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.typedText || 'Your Signature', canvas.width / 2, canvas.height / 2);
            }
            
            signatureImage = canvas.toDataURL('image/png');
        } else if (this.currentTab === 'draw') {
            // Get image from canvas with better quality
            if (!this.canvas) return; // Safety check
            signatureImage = this.canvas.toDataURL('image/png');
        } else if (this.currentTab === 'upload') {
            // Use uploaded image
            signatureImage = this.uploadedImage;
        }
        
        if (!signatureImage) {
            console.error('No signature image generated');
            return;
        }
        
        // Create new signature object
        const signature = {
            id: Date.now().toString(),
            image: signatureImage,
            type: this.currentTab,
            createdAt: new Date().toISOString()
        };
        
        // Add to signatures array
        this.signatures.push(signature);
        
        // Save to localStorage
        this.saveSignatures();
        
        // Add signature to preview - with a slight delay to ensure DOM is ready
        setTimeout(() => {
            this.addSignatureToPreview(signature);
        }, 100);
        
        // Return the signature object so it can be used if needed
        return signature;
    }
    
    saveSignatures() {
        // Don't save signatures to localStorage to prevent persistence between refreshes
        // This intentionally does nothing
        return;
    }
    
    loadSignatures() {
        // Clear any existing signatures from localStorage to ensure they don't persist
        localStorage.removeItem('donationSignatures');
        localStorage.removeItem('donationSignaturePosition');
        
        // Initialize with empty signatures array
        this.signatures = [];
    }
    
    addSignatureToPreview(signature, position = null) {
        if (!signature || !signature.image) {
            console.error('Invalid signature object provided to addSignatureToPreview');
            return;
        }
        
        // Remove existing signature if any
        this.removeSignatureFromPreview();
        
        // Check for receipt preview (donation form), bill preview (general bill form), or driver salary preview
        const receiptPreview = document.getElementById('receiptPreview');
        const billPreview = document.getElementById('billPreview');
        const driverSalaryPreview = document.getElementById('driverSalaryPreview');
        const previewContainer = receiptPreview || billPreview || driverSalaryPreview;
        
        if (!previewContainer) {
            console.error('Preview container not found');
            return;
        }
        
        // Ensure the preview container has position relative for proper signature positioning
        if (window.getComputedStyle(previewContainer).position === 'static') {
            previewContainer.style.position = 'relative';
        }
        
        // Create draggable signature element
        const signatureElement = document.createElement('div');
        signatureElement.className = 'draggable-signature';
        signatureElement.id = `signature-${signature.id}`;
        signatureElement.dataset.id = signature.id;
        signatureElement.style.position = 'absolute';
        signatureElement.style.zIndex = '100'; // Ensure it's on top
        signatureElement.style.cursor = 'move'; // Show move cursor
        signatureElement.style.display = 'block'; // Explicitly set display to block
        
        // Add a clean signature class to hide all non-essential elements
        signatureElement.classList.add('clean-signature');
        
        // Get preview container dimensions
        const previewRect = previewContainer.getBoundingClientRect();
        const previewWidth = previewRect.width;
        const previewHeight = previewRect.height;
        
        // Calculate appropriate signature size (max 30% of preview width)
        const maxSignatureWidth = Math.min(200, previewWidth * 0.3);
        
        // If a specific position is provided, use it (for following mode)
        if (position) {
            signatureElement.style.left = `${position.left}px`;
            signatureElement.style.top = `${position.top}px`;
            signatureElement.style.width = `${maxSignatureWidth}px`;
            signatureElement.style.transform = position.rotation ? `rotate(${position.rotation}deg)` : 'none';
            signatureElement.dataset.rotation = position.rotation || 0;
        } else {
            // Check if we have saved position
            const savedPosition = localStorage.getItem('donationSignaturePosition');
            if (savedPosition) {
                try {
                    const posData = JSON.parse(savedPosition);
                    // Ensure position is within bounds of the preview container
                    const left = posData.left || '50%';
                    const top = posData.top || '80%';
                    const width = posData.width || `${maxSignatureWidth}px`;
                    const rotation = posData.rotation || 0;
                    
                    // Convert percentage to pixels if needed to check bounds
                    let leftPx = left;
                    let topPx = top;
                    
                    if (typeof left === 'string' && left.endsWith('%')) {
                        const percentage = parseFloat(left) / 100;
                        leftPx = `${Math.min(Math.max(0, percentage * previewWidth), previewWidth - maxSignatureWidth)}px`;
                    }
                    
                    if (typeof top === 'string' && top.endsWith('%')) {
                        const percentage = parseFloat(top) / 100;
                        topPx = `${Math.min(Math.max(0, percentage * previewHeight), previewHeight - 50)}px`;
                    }
                    
                    signatureElement.style.left = leftPx;
                    signatureElement.style.top = topPx;
                    signatureElement.style.width = width;
                    signatureElement.style.transform = rotation ? `rotate(${rotation}deg)` : 'none';
                    signatureElement.dataset.rotation = rotation;
                } catch (e) {
                    // Fallback if JSON parsing fails
                    signatureElement.style.left = '50%';
                    signatureElement.style.top = '80%';
                    signatureElement.style.transform = 'translate(-50%, -50%)';
                    signatureElement.style.width = `${maxSignatureWidth}px`;
                    signatureElement.dataset.rotation = 0;
                }
            } else {
                // Default position - bottom center of the preview
                signatureElement.style.left = '50%';
                signatureElement.style.top = '80%';
                signatureElement.style.transform = 'translate(-50%, -50%)';
                signatureElement.style.width = `${maxSignatureWidth}px`;
                signatureElement.dataset.rotation = 0;
            }
        }
        
        // Create signature image
        const signatureImg = document.createElement('img');
        signatureImg.src = signature.image;
        signatureImg.style.width = '100%';
        signatureImg.style.height = 'auto'; // Maintain aspect ratio
        signatureImg.style.maxWidth = '100%'; // Prevent overflow
        signatureImg.style.pointerEvents = 'none'; // Prevent image from capturing events
        signatureImg.style.objectFit = 'contain'; // Ensure the image is not cropped
        signatureImg.style.background = 'transparent'; // Ensure transparent background
        
        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'signature-toolbar';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'signature-toolbar-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeSignatureFromPreview();
        });
        
        // Add rotation buttons
        const rotateLeftBtn = document.createElement('button');
        rotateLeftBtn.className = 'signature-toolbar-btn';
        rotateLeftBtn.innerHTML = '<i class="fas fa-undo"></i>';
        rotateLeftBtn.title = 'Rotate Left';
        rotateLeftBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.rotateSignature(-15); // Rotate 15 degrees counter-clockwise
        });
        
        const rotateRightBtn = document.createElement('button');
        rotateRightBtn.className = 'signature-toolbar-btn';
        rotateRightBtn.innerHTML = '<i class="fas fa-redo"></i>';
        rotateRightBtn.title = 'Rotate Right';
        rotateRightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.rotateSignature(15); // Rotate 15 degrees clockwise
        });
        
        toolbar.appendChild(rotateLeftBtn);
        toolbar.appendChild(rotateRightBtn);
        toolbar.appendChild(deleteBtn);
        
        // Create resize handles (initially hidden)
        const resizeHandleNW = document.createElement('div');
        resizeHandleNW.className = 'resize-handle resize-handle-nw';
        resizeHandleNW.dataset.direction = 'nw';
        resizeHandleNW.style.display = 'none'; // Initially hidden
        
        const resizeHandleNE = document.createElement('div');
        resizeHandleNE.className = 'resize-handle resize-handle-ne';
        resizeHandleNE.dataset.direction = 'ne';
        resizeHandleNE.style.display = 'none'; // Initially hidden
        
        const resizeHandleSW = document.createElement('div');
        resizeHandleSW.className = 'resize-handle resize-handle-sw';
        resizeHandleSW.dataset.direction = 'sw';
        resizeHandleSW.style.display = 'none'; // Initially hidden
        
        const resizeHandleSE = document.createElement('div');
        resizeHandleSE.className = 'resize-handle resize-handle-se';
        resizeHandleSE.dataset.direction = 'se';
        resizeHandleSE.style.display = 'none'; // Initially hidden
        
        signatureElement.appendChild(signatureImg);
        signatureElement.appendChild(toolbar);
        signatureElement.appendChild(resizeHandleNW);
        signatureElement.appendChild(resizeHandleNE);
        signatureElement.appendChild(resizeHandleSW);
        signatureElement.appendChild(resizeHandleSE);
        
        // Add to preview - we already checked previewContainer exists above
        previewContainer.appendChild(signatureElement);
        this.activeSignatureId = signature.id;
        
        // Make sure the signature is visible
        signatureElement.style.visibility = 'visible';
        signatureElement.style.opacity = '1';
        
        // Force a reflow to ensure the browser renders the element
        void signatureElement.offsetWidth;
        
        // Update preview
        if (typeof updatePreview === 'function') {
            try {
                updatePreview();
            } catch (e) {
                console.error('Error updating preview:', e);
            }
        }
        
        // Log success for debugging
        console.log('Signature added to preview:', signature.id);
    }
    
    removeSignatureFromPreview() {
        const existingSignature = document.querySelector('.draggable-signature');
        if (existingSignature) {
            existingSignature.remove();
            this.activeSignatureId = null;
        }
    }
    
    handlePreviewMouseDown(e) {
        const target = e.target;
        
        // Check if clicking on a resize handle
        if (target.classList.contains('resize-handle')) {
            const signatureElement = target.closest('.draggable-signature');
            if (!signatureElement) return;
            
            e.preventDefault(); // Prevent default to avoid text selection
            e.stopPropagation(); // Stop event propagation
            
            this.isResizing = true;
            this.resizeDirection = target.dataset.direction;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.initialWidth = signatureElement.offsetWidth;
            this.initialHeight = signatureElement.offsetHeight;
            this.initialLeft = signatureElement.offsetLeft;
            this.initialTop = signatureElement.offsetTop;
            this.activeSignatureId = signatureElement.dataset.id;
            
            // Add a class to indicate active dragging
            signatureElement.classList.add('signature-active');
            
            return;
        }
        
        // Check if clicking on the signature or its image
        const signatureElement = target.closest('.draggable-signature');
        if (!signatureElement) return;
        
        e.preventDefault(); // Prevent default to avoid text selection
        e.stopPropagation(); // Stop event propagation
        
        this.isDragging = true;
        this.activeSignatureId = signatureElement.dataset.id;
        
        // Show resize handles when starting to drag
        this.showResizeHandles(signatureElement);
        
        // Add a class to indicate active dragging
        signatureElement.classList.add('signature-active');
        
        const rect = signatureElement.getBoundingClientRect();
        this.dragStartX = e.clientX - rect.left;
        this.dragStartY = e.clientY - rect.top;
    }
    
    handlePreviewMouseMove(e) {
        if (this.isDragging) {
            e.preventDefault(); // Prevent default to avoid text selection
            e.stopPropagation(); // Stop event propagation
            
            const signatureElement = document.getElementById(`signature-${this.activeSignatureId}`);
            if (!signatureElement) return;
            
            // Check for receipt preview (donation form), bill preview (general bill form), or driver salary preview
            const receiptPreview = document.getElementById('receiptPreview');
            const billPreview = document.getElementById('billPreview');
            const driverSalaryPreview = document.getElementById('driverSalaryPreview');
            const previewContainer = receiptPreview || billPreview || driverSalaryPreview;
            
            if (!previewContainer) {
                console.error('Preview container not found');
                return;
            }
            
            const rect = previewContainer.getBoundingClientRect();
            
            const left = e.clientX - rect.left - this.dragStartX;
            const top = e.clientY - rect.top - this.dragStartY;
            
            // Ensure the signature stays within the preview container
            // Add padding of 5px to keep it fully visible
            const padding = 5;
            const maxLeft = previewContainer.offsetWidth - signatureElement.offsetWidth - padding;
            const maxTop = previewContainer.offsetHeight - signatureElement.offsetHeight - padding;
            
            const constrainedLeft = Math.max(padding, Math.min(left, maxLeft));
            const constrainedTop = Math.max(padding, Math.min(top, maxTop));
            
            signatureElement.style.left = `${constrainedLeft}px`;
            signatureElement.style.top = `${constrainedTop}px`;
            signatureElement.style.transform = 'none';
            
            // Update position in real-time for smoother experience
            this.saveSignaturePosition();
        } else if (this.isResizing) {
            const signatureElement = document.querySelector('.draggable-signature');
            if (!signatureElement) return;
            
            let newWidth, newHeight, newLeft, newTop;
            
            switch (this.resizeDirection) {
                case 'se':
                    newWidth = Math.max(50, this.initialWidth + (e.clientX - this.dragStartX));
                    newHeight = Math.max(50, this.initialHeight + (e.clientY - this.dragStartY));
                    signatureElement.style.width = `${newWidth}px`;
                    signatureElement.style.height = 'auto';
                    break;
                case 'sw':
                    newWidth = Math.max(50, this.initialWidth - (e.clientX - this.dragStartX));
                    newLeft = this.initialLeft + (this.initialWidth - newWidth);
                    signatureElement.style.width = `${newWidth}px`;
                    signatureElement.style.left = `${newLeft}px`;
                    signatureElement.style.height = 'auto';
                    break;
                case 'ne':
                    newWidth = Math.max(50, this.initialWidth + (e.clientX - this.dragStartX));
                    newTop = this.initialTop + (e.clientY - this.dragStartY) - this.initialHeight;
                    signatureElement.style.width = `${newWidth}px`;
                    signatureElement.style.top = `${newTop}px`;
                    signatureElement.style.height = 'auto';
                    break;
                case 'nw':
                    newWidth = Math.max(50, this.initialWidth - (e.clientX - this.dragStartX));
                    newLeft = this.initialLeft + (this.initialWidth - newWidth);
                    newTop = this.initialTop + (e.clientY - this.dragStartY) - this.initialHeight;
                    signatureElement.style.width = `${newWidth}px`;
                    signatureElement.style.left = `${newLeft}px`;
                    signatureElement.style.top = `${newTop}px`;
                    signatureElement.style.height = 'auto';
                    break;
            }
        }
    }
    
    handlePreviewMouseUp(e) {
        if (this.isDragging || this.isResizing) {
            e.preventDefault(); // Prevent default to avoid text selection
            e.stopPropagation(); // Stop event propagation
            
            // Remove active class
            const signatureElement = document.querySelector('.draggable-signature');
            if (signatureElement) {
                signatureElement.classList.remove('signature-active');
                
                // Hide resize handles when done dragging/resizing
                this.hideResizeHandles(signatureElement);
            }
            
            // Save signature position to localStorage
            this.saveSignaturePosition();
        }
        
        this.isDragging = false;
        this.isResizing = false;
    }
    
    // Helper method to show resize handles
    showResizeHandles(signatureElement) {
        if (!signatureElement) return;
        
        const handles = signatureElement.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.style.display = 'block';
        });
    }
    
    // Helper method to hide resize handles
    hideResizeHandles(signatureElement) {
        if (!signatureElement) return;
        
        const handles = signatureElement.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.style.display = 'none';
        });
    }
    
    saveSignaturePosition() {
        // Don't save signature position to localStorage to prevent persistence between refreshes
        // This intentionally does nothing
        return;
    }
    
    // Rotate the signature by the specified degrees
    rotateSignature(degrees) {
        const signatureElement = document.querySelector('.draggable-signature');
        if (!signatureElement) return;
        
        // Get current rotation
        let currentRotation = parseInt(signatureElement.dataset.rotation || 0);
        
        // Add new rotation
        currentRotation += degrees;
        
        // Update rotation
        signatureElement.dataset.rotation = currentRotation;
        signatureElement.style.transform = `rotate(${currentRotation}deg)`;
        
        // Save the new position
        this.saveSignaturePosition();
    }
    
    // Enter signature following mode where signature follows the cursor
    enterSignatureFollowingMode(signature) {
        // First, clean up any existing signatures to prevent duplicates
        this.removeSignatureFromPreview();
        
        this.isSignatureFollowingMode = true;
        this.followingSignature = signature;
        
        // Add the signature to the preview in following mode
        // Check for receipt preview (donation form), bill preview (general bill form), or driver salary preview
        const receiptPreview = document.getElementById('receiptPreview');
        const billPreview = document.getElementById('billPreview');
        const driverSalaryPreview = document.getElementById('driverSalaryPreview');
        const previewContainer = receiptPreview || billPreview || driverSalaryPreview;
        
        if (!previewContainer) return;
        
        // Create a temporary position at the center
        const rect = previewContainer.getBoundingClientRect();
        const position = {
            left: rect.width / 2,
            top: rect.height / 2,
            rotation: 0
        };
        
        // Add signature to preview
        this.addSignatureToPreview(signature, position);
        
        // Add event listeners for following mode
        previewContainer.addEventListener('mousemove', this.handleFollowingModeMove.bind(this));
        previewContainer.addEventListener('click', this.handleFollowingModeClick.bind(this));
        
        // Add instruction overlay
        const instructionOverlay = document.createElement('div');
        instructionOverlay.className = 'signature-instruction-overlay';
        instructionOverlay.textContent = 'Click to place signature';
        instructionOverlay.id = 'signatureInstructionOverlay';
        previewContainer.appendChild(instructionOverlay);
    }
    
    // Handle mouse move in following mode
    handleFollowingModeMove(e) {
        if (!this.isSignatureFollowingMode) return;
        
        const signatureElement = document.querySelector('.draggable-signature');
        if (!signatureElement) return;
        
        // Check for receipt preview (donation form), bill preview (general bill form), or driver salary preview
        const receiptPreview = document.getElementById('receiptPreview');
        const billPreview = document.getElementById('billPreview');
        const driverSalaryPreview = document.getElementById('driverSalaryPreview');
        const previewContainer = receiptPreview || billPreview || driverSalaryPreview;
        
        if (!previewContainer) return;
        
        const rect = previewContainer.getBoundingClientRect();
        const left = e.clientX - rect.left;
        const top = e.clientY - rect.top;
        
        // Update signature position to follow cursor
        signatureElement.style.left = `${left}px`;
        signatureElement.style.top = `${top}px`;
        signatureElement.style.transform = 'translate(-50%, -50%)';
        signatureElement.style.background = 'transparent';
        signatureElement.style.boxShadow = 'none';
    }
    
    // Handle click in following mode
    handleFollowingModeClick(e) {
        if (!this.isSignatureFollowingMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Exit following mode
        this.isSignatureFollowingMode = false;
        
        // Check for receipt preview (donation form), bill preview (general bill form), or driver salary preview
        const receiptPreview = document.getElementById('receiptPreview');
        const billPreview = document.getElementById('billPreview');
        const driverSalaryPreview = document.getElementById('driverSalaryPreview');
        const previewContainer = receiptPreview || billPreview || driverSalaryPreview;
        
        if (previewContainer) {
            // Remove event listeners
            previewContainer.removeEventListener('mousemove', this.handleFollowingModeMove.bind(this));
            previewContainer.removeEventListener('click', this.handleFollowingModeClick.bind(this));
            
            // Remove instruction overlay
            const instructionOverlay = document.getElementById('signatureInstructionOverlay');
            if (instructionOverlay) {
                instructionOverlay.remove();
            }
        }
        
        // Get final position
        const signatureElement = document.querySelector('.draggable-signature');
        if (signatureElement) {
            // Remove transform that was used for centering during following mode
            signatureElement.style.transform = '';
            signatureElement.style.background = 'transparent';
            signatureElement.style.boxShadow = 'none';
            
            // Hide all handles
            this.hideResizeHandles(signatureElement);
            
            // Save the final position
            this.saveSignaturePosition();
            
            // Force update the preview
            if (typeof updatePreview === 'function') {
                setTimeout(() => {
                    updatePreview();
                }, 200);
            }
        }
    }
    
    handlePreviewTouchStart(e) {
        const touch = e.touches[0];
        
        // Create a simulated mouse event
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: document.elementFromPoint(touch.clientX, touch.clientY),
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation()
        };
        
        this.handlePreviewMouseDown(mouseEvent);
    }
    
    handlePreviewTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        // Create a simulated mouse event
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => {},
            stopPropagation: () => {}
        };
        
        this.handlePreviewMouseMove(mouseEvent);
    }
    
    handlePreviewTouchEnd(e) {
        const mouseEvent = {
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation()
        };
        
        this.handlePreviewMouseUp(mouseEvent);
    }
}

// Initialize Sejda Signature when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Sejda Signature
    window.sejdaSignature = new SejdaSignature();
});
