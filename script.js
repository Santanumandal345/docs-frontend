const API_URL = 'http://localhost:5000/api/documents';


let currentDocuments = [];

// Load documents on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    
    // Setup form submission
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    
    // Setup search and filter
    document.getElementById('searchInput').addEventListener('input', filterDocuments);
    document.getElementById('categoryFilter').addEventListener('change', filterDocuments);
});

async function loadDocuments() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to load documents');
        currentDocuments = await response.json();
        renderDocuments(currentDocuments);
    } catch (error) {
        console.error('Error loading documents:', error);
        document.getElementById('documentsList').innerHTML = 
            '<div class="error-message">Failed to load documents. Make sure the backend server is running.</div>';
    }
}

function renderDocuments(documents) {
    const container = document.getElementById('documentsList');
    
    if (documents.length === 0) {
        container.innerHTML = '<div class="loading">No documents found. Upload your first document!</div>';
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="document-card" data-id="${doc._id}">
            <div class="document-title">
                <i class="fas fa-file-pdf"></i> ${escapeHtml(doc.title)}
            </div>
            <div class="document-description">${escapeHtml(doc.description || 'No description')}</div>
            <div class="document-meta">
                <span><i class="fas fa-tag"></i> ${doc.category}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(doc.uploadedAt).toLocaleDateString()}</span>
                <span><i class="fas fa-download"></i> ${doc.downloadCount} downloads</span>
            </div>
            <div class="document-actions">
                <button class="btn-download" onclick="downloadDocument('${doc._id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn-delete" onclick="deleteDocument('${doc._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('titleInput');
    const descInput = document.getElementById('descInput');
    const categoryInput = document.getElementById('categoryInput');
    const messageDiv = document.getElementById('uploadMessage');
    
    if (!fileInput.files[0]) {
        showMessage(messageDiv, 'Please select a file', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
        showMessage(messageDiv, 'File size must be less than 10MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', titleInput.value);
    formData.append('description', descInput.value);
    formData.append('category', categoryInput.value);
    
    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        showMessage(messageDiv, 'Document uploaded successfully!', 'success');
        
        // Reset form
        fileInput.value = '';
        titleInput.value = '';
        descInput.value = '';
        categoryInput.value = 'General';
        
        // Reload documents
        await loadDocuments();
        
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    } catch (error) {
        showMessage(messageDiv, error.message, 'error');
    }
}

async function downloadDocument(id) {
    try {
        window.open(`${API_URL}/download/${id}`, '_blank');
        // Refresh to update download count
        setTimeout(() => loadDocuments(), 1000);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download document');
    }
}

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Delete failed');
        
        await loadDocuments();
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete document');
    }
}

function filterDocuments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    const filtered = currentDocuments.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm) || 
                             doc.description.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'All' || doc.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderDocuments(filtered);
}

function showMessage(element, message, type) {
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}