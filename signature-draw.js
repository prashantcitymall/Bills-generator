// Signature Drawing Functionality
class SignatureDrawing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.signatureImage = null;
        this.signatureSize = 100; // Default size percentage
        this.signatureX = 0;
        this.signatureY = 0;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.signatureWidth = 0;
        this.signatureHeight = 0;
        
        this.init();
    }
    
    init() {
        // Create signature container
        this.createSignatureUI();
        
        // Initialize canvas
        this.canvas = document.getElementById('signatureCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.resizeCanvas();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    createSignatureUI() {
        const donationForm = document.getElementById('donationForm');
        
        // Create signature container
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'form-group signature-container';
        
        // Create signature header
        const signatureHeader = document.createElement('div');
        signatureHeader.className = 'signature-header';
        
        const signatureTitle = document.createElement('div');
        signatureTitle.className = 'signature-title';
        signatureTitle.textContent = 'Draw Signature';
        
        signatureHeader.appendChild(signatureTitle);
        
        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'signature-canvas-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'signatureCanvas';
        
        canvasContainer.appendChild(canvas);
        
        // Create signature controls
        const signatureControls = document.createElement('div');
        signatureControls.className = 'signature-controls';
        
        // Size control
        const sizeControl = document.createElement('div');
        sizeControl.className = 'signature-size-control';
        
        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = 'Size:';
        
        const sizeInput = document.createElement('input');
        sizeInput.type = 'range';
        sizeInput.id = 'signatureSize';
        sizeInput.min = '10';
        sizeInput.max = '200';
        sizeInput.value = '100';
        
        sizeControl.appendChild(sizeLabel);
        sizeControl.appendChild(sizeInput);
        
        // Buttons
        const signatureButtons = document.createElement('div');
        signatureButtons.className = 'signature-buttons';
        
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'signature-btn signature-btn-secondary';
        clearBtn.id = 'clearSignature';
        clearBtn.innerHTML = '<i class="fas fa-eraser"></i> Clear';
        
        const applyBtn = document.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = 'signature-btn signature-btn-primary';
        applyBtn.id = 'applySignature';
        applyBtn.innerHTML = '<i class="fas fa-check"></i> Apply';
        
        signatureButtons.appendChild(clearBtn);
        signatureButtons.appendChild(applyBtn);
        
        signatureControls.appendChild(sizeControl);
        signatureControls.appendChild(signatureButtons);
        
        // Create position controls
        const positionControls = document.createElement('div');
        positionControls.className = 'signature-position-controls';
        positionControls.style.display = 'none'; // Initially hidden
        
        // X position
        const xPositionGroup = document.createElement('div');
        xPositionGroup.className = 'position-control-group';
        
        const xLabel = document.createElement('label');
        xLabel.textContent = 'X Position:';
        
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.id = 'signatureX';
        xInput.value = '0';
        
        xPositionGroup.appendChild(xLabel);
        xPositionGroup.appendChild(xInput);
        
        // Y position
        const yPositionGroup = document.createElement('div');
        yPositionGroup.className = 'position-control-group';
        
        const yLabel = document.createElement('label');
        yLabel.textContent = 'Y Position:';
        
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.id = 'signatureY';
        yInput.value = '0';
        
        yPositionGroup.appendChild(yLabel);
        yPositionGroup.appendChild(yInput);
        
        // Width
        const widthGroup = document.createElement('div');
        widthGroup.className = 'position-control-group';
        
        const widthLabel = document.createElement('label');
        widthLabel.textContent = 'Width:';
        
        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.id = 'signatureWidth';
        widthInput.value = '100';
        
        widthGroup.appendChild(widthLabel);
        widthGroup.appendChild(widthInput);
        
        positionControls.appendChild(xPositionGroup);
        positionControls.appendChild(yPositionGroup);
        positionControls.appendChild(widthGroup);
        
        // Assemble the signature container
        signatureContainer.appendChild(signatureHeader);
        signatureContainer.appendChild(canvasContainer);
        signatureContainer.appendChild(signatureControls);
        signatureContainer.appendChild(positionControls);
        
        // Insert before the form actions
        const formActions = document.querySelector('.form-actions');
        donationForm.insertBefore(signatureContainer, formActions);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = 150;
        
        // Set canvas styles
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#000';
    }
    
    addEventListeners() {
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.startDrawingTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.drawTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Button events
        document.getElementById('clearSignature').addEventListener('click', this.clearSignature.bind(this));
        document.getElementById('applySignature').addEventListener('click', this.applySignature.bind(this));
        
        // Size slider event
        document.getElementById('signatureSize').addEventListener('input', this.updateSignatureSize.bind(this));
        
        // Position input events
        document.getElementById('signatureX').addEventListener('input', this.updateSignaturePosition.bind(this));
        document.getElementById('signatureY').addEventListener('input', this.updateSignaturePosition.bind(this));
        document.getElementById('signatureWidth').addEventListener('input', this.updateSignatureSize.bind(this));
        
        // Window resize event
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // Add event listeners to the preview container for signature positioning
        const previewContainer = document.getElementById('receiptPreview');
        previewContainer.addEventListener('mousedown', this.startDragging.bind(this));
        previewContainer.addEventListener('mousemove', this.dragSignature.bind(this));
        previewContainer.addEventListener('mouseup', this.stopDragging.bind(this));
        
        // Touch events for mobile
        previewContainer.addEventListener('touchstart', this.startDraggingTouch.bind(this));
        previewContainer.addEventListener('touchmove', this.dragSignatureTouch.bind(this));
        previewContainer.addEventListener('touchend', this.stopDragging.bind(this));
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
    
    clearSignature() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.removeSignatureFromPreview();
    }
    
    applySignature() {
        // Convert canvas to image
        this.signatureImage = this.canvas.toDataURL('image/png');
        
        // Add signature to preview
        this.addSignatureToPreview();
        
        // Show position controls
        document.querySelector('.signature-position-controls').style.display = 'flex';
    }
    
    addSignatureToPreview() {
        // Remove existing signature if any
        this.removeSignatureFromPreview();
        
        // Create draggable signature element
        const signatureElement = document.createElement('div');
        signatureElement.className = 'draggable-signature';
        signatureElement.id = 'draggableSignature';
        signatureElement.style.position = 'absolute';
        signatureElement.style.left = this.signatureX + 'px';
        signatureElement.style.top = this.signatureY + 'px';
        signatureElement.style.width = this.signatureWidth + 'px';
        
        // Create signature image
        const signatureImg = document.createElement('img');
        signatureImg.src = this.signatureImage;
        signatureImg.style.width = '100%';
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        
        signatureElement.appendChild(signatureImg);
        signatureElement.appendChild(resizeHandle);
        
        // Add to preview
        const previewContainer = document.getElementById('receiptPreview');
        previewContainer.appendChild(signatureElement);
        
        // Update form data
        this.updateFormData();
        
        // Update preview
        updatePreview();
    }
    
    removeSignatureFromPreview() {
        const existingSignature = document.getElementById('draggableSignature');
        if (existingSignature) {
            existingSignature.remove();
        }
    }
    
    updateSignatureSize() {
        const sizeInput = document.getElementById('signatureSize');
        this.signatureSize = parseInt(sizeInput.value);
        
        // Update width input
        document.getElementById('signatureWidth').value = this.signatureSize;
        
        // Update signature element if exists
        const signatureElement = document.getElementById('draggableSignature');
        if (signatureElement) {
            signatureElement.style.width = this.signatureSize + 'px';
        }
        
        this.signatureWidth = this.signatureSize;
        this.updateFormData();
    }
    
    updateSignaturePosition() {
        this.signatureX = parseInt(document.getElementById('signatureX').value);
        this.signatureY = parseInt(document.getElementById('signatureY').value);
        
        // Update signature element if exists
        const signatureElement = document.getElementById('draggableSignature');
        if (signatureElement) {
            signatureElement.style.left = this.signatureX + 'px';
            signatureElement.style.top = this.signatureY + 'px';
        }
        
        this.updateFormData();
    }
    
    startDragging(e) {
        const signatureElement = document.getElementById('draggableSignature');
        if (!signatureElement) return;
        
        // Check if clicking on the resize handle
        const resizeHandle = signatureElement.querySelector('.resize-handle');
        const rect = resizeHandle.getBoundingClientRect();
        
        if (
            e.clientX >= rect.left && 
            e.clientX <= rect.right && 
            e.clientY >= rect.top && 
            e.clientY <= rect.bottom
        ) {
            this.isResizing = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.initialWidth = signatureElement.offsetWidth;
            return;
        }
        
        // Check if clicking on the signature
        const sigRect = signatureElement.getBoundingClientRect();
        
        if (
            e.clientX >= sigRect.left && 
            e.clientX <= sigRect.right && 
            e.clientY >= sigRect.top && 
            e.clientY <= sigRect.bottom
        ) {
            this.isDragging = true;
            this.dragStartX = e.clientX - this.signatureX;
            this.dragStartY = e.clientY - this.signatureY;
        }
    }
    
    startDraggingTouch(e) {
        const touch = e.touches[0];
        const signatureElement = document.getElementById('draggableSignature');
        if (!signatureElement) return;
        
        // Check if touching the resize handle
        const resizeHandle = signatureElement.querySelector('.resize-handle');
        const rect = resizeHandle.getBoundingClientRect();
        
        if (
            touch.clientX >= rect.left && 
            touch.clientX <= rect.right && 
            touch.clientY >= rect.top && 
            touch.clientY <= rect.bottom
        ) {
            this.isResizing = true;
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.initialWidth = signatureElement.offsetWidth;
            return;
        }
        
        // Check if touching the signature
        const sigRect = signatureElement.getBoundingClientRect();
        
        if (
            touch.clientX >= sigRect.left && 
            touch.clientX <= sigRect.right && 
            touch.clientY >= sigRect.top && 
            touch.clientY <= sigRect.bottom
        ) {
            this.isDragging = true;
            this.dragStartX = touch.clientX - this.signatureX;
            this.dragStartY = touch.clientY - this.signatureY;
        }
    }
    
    dragSignature(e) {
        if (this.isDragging) {
            const signatureElement = document.getElementById('draggableSignature');
            if (!signatureElement) return;
            
            this.signatureX = e.clientX - this.dragStartX;
            this.signatureY = e.clientY - this.dragStartY;
            
            signatureElement.style.left = this.signatureX + 'px';
            signatureElement.style.top = this.signatureY + 'px';
            
            // Update position inputs
            document.getElementById('signatureX').value = this.signatureX;
            document.getElementById('signatureY').value = this.signatureY;
            
            this.updateFormData();
        } else if (this.isResizing) {
            const signatureElement = document.getElementById('draggableSignature');
            if (!signatureElement) return;
            
            const deltaX = e.clientX - this.dragStartX;
            const newWidth = Math.max(50, this.initialWidth + deltaX);
            
            signatureElement.style.width = newWidth + 'px';
            this.signatureWidth = newWidth;
            
            // Update width input
            document.getElementById('signatureWidth').value = this.signatureWidth;
            document.getElementById('signatureSize').value = this.signatureWidth;
            
            this.updateFormData();
        }
    }
    
    dragSignatureTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        if (this.isDragging) {
            const signatureElement = document.getElementById('draggableSignature');
            if (!signatureElement) return;
            
            this.signatureX = touch.clientX - this.dragStartX;
            this.signatureY = touch.clientY - this.dragStartY;
            
            signatureElement.style.left = this.signatureX + 'px';
            signatureElement.style.top = this.signatureY + 'px';
            
            // Update position inputs
            document.getElementById('signatureX').value = this.signatureX;
            document.getElementById('signatureY').value = this.signatureY;
            
            this.updateFormData();
        } else if (this.isResizing) {
            const signatureElement = document.getElementById('draggableSignature');
            if (!signatureElement) return;
            
            const deltaX = touch.clientX - this.dragStartX;
            const newWidth = Math.max(50, this.initialWidth + deltaX);
            
            signatureElement.style.width = newWidth + 'px';
            this.signatureWidth = newWidth;
            
            // Update width input
            document.getElementById('signatureWidth').value = this.signatureWidth;
            document.getElementById('signatureSize').value = this.signatureWidth;
            
            this.updateFormData();
        }
    }
    
    stopDragging() {
        this.isDragging = false;
        this.isResizing = false;
    }
    
    updateFormData() {
        // Store signature data in form data
        const formData = {
            signatureImage: this.signatureImage,
            signatureX: this.signatureX,
            signatureY: this.signatureY,
            signatureWidth: this.signatureWidth
        };
        
        // Store in localStorage
        localStorage.setItem('donationSignatureData', JSON.stringify(formData));
    }
    
    loadSignatureData() {
        const savedData = localStorage.getItem('donationSignatureData');
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        
        this.signatureImage = data.signatureImage;
        this.signatureX = data.signatureX;
        this.signatureY = data.signatureY;
        this.signatureWidth = data.signatureWidth;
        
        // Update inputs
        document.getElementById('signatureX').value = this.signatureX;
        document.getElementById('signatureY').value = this.signatureY;
        document.getElementById('signatureWidth').value = this.signatureWidth;
        document.getElementById('signatureSize').value = this.signatureWidth;
        
        // Add signature to preview
        if (this.signatureImage) {
            this.addSignatureToPreview();
            document.querySelector('.signature-position-controls').style.display = 'flex';
        }
    }
}

// Initialize signature drawing when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize signature drawing
    window.signatureDrawing = new SignatureDrawing();
    
    // Load saved signature data
    setTimeout(() => {
        window.signatureDrawing.loadSignatureData();
    }, 500);
    
    // Modify the original updatePreview function to include signature
    const originalUpdatePreview = window.updatePreview;
    if (originalUpdatePreview) {
        window.updatePreview = function() {
            // Call the original updatePreview function
            originalUpdatePreview.apply(this, arguments);
            
            // Add signature to preview if exists
            const signatureData = localStorage.getItem('donationSignatureData');
            if (signatureData) {
                const data = JSON.parse(signatureData);
                if (data.signatureImage) {
                    // Add signature to preview
                    const signatureElement = document.getElementById('draggableSignature');
                    if (!signatureElement) {
                        window.signatureDrawing.addSignatureToPreview();
                    }
                }
            }
        };
    }
});
