class CommentsApp {
    constructor() {
        this.comments = [];
        this.DELETION_PASSWORD = 'comdel';
        this.STORAGE_KEY = 'project-comments';
        
        this.initializeElements();
        this.bindEvents();
        this.loadComments();
    }

    initializeElements() {
        // Form elements
        this.commentForm = document.getElementById('commentForm');
        this.usernameInput = document.getElementById('username');
        this.commentInput = document.getElementById('comment');
        this.submitBtn = document.querySelector('.submit-btn');
        this.formMessage = document.getElementById('formMessage');
        
        // Comments elements
        this.commentsContainer = document.getElementById('commentsContainer');
        this.commentCount = document.getElementById('commentCount');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Modal elements
        this.deleteModal = document.getElementById('deleteModal');
        this.deleteForm = document.getElementById('deleteForm');
        this.deletePassword = document.getElementById('deletePassword');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.modalMessage = document.getElementById('modalMessage');
        
        // Loading
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.currentCommentId = null;
    }

    bindEvents() {
        this.commentForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.refreshBtn.addEventListener('click', () => this.loadComments());
        
        this.deleteForm.addEventListener('submit', (e) => this.handleDelete(e));
        this.cancelDelete.addEventListener('click', () => this.closeModal());
        
        // Close modal on outside click
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.closeModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.deleteModal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const commentText = this.commentInput.value.trim();
        
        if (!username || !commentText) {
            this.showFormMessage('Please fill in all fields', 'error');
            return;
        }

        if (username.length > 50) {
            this.showFormMessage('Username must be 50 characters or less', 'error');
            return;
        }

        if (commentText.length > 500) {
            this.showFormMessage('Comment must be 500 characters or less', 'error');
            return;
        }

        this.showLoading(true);
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Posting...';

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const newComment = {
                id: Date.now(), // Simple ID generation
                username,
                comment: commentText,
                created_at: new Date().toISOString()
            };
            
            this.comments.unshift(newComment);
            this.saveComments();
            this.renderComments();
            
            // Reset form
            this.commentForm.reset();
            this.showFormMessage('Comment posted successfully!', 'success');
            
            // Auto-hide success message
            setTimeout(() => {
                this.formMessage.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showFormMessage('Failed to post comment. Please try again.', 'error');
        } finally {
            this.showLoading(false);
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Post Comment';
        }
    }

    loadComments() {
        this.showLoading(true);
        this.refreshBtn.disabled = true;
        this.refreshBtn.textContent = 'Refreshing...';
        
        // Simulate loading delay
        setTimeout(() => {
            try {
                const saved = localStorage.getItem(this.STORAGE_KEY);
                this.comments = saved ? JSON.parse(saved) : [];
                
                // Sort by date (newest first)
                this.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                this.renderComments();
                this.showToast('Comments loaded successfully!', 'success');
                
            } catch (error) {
                console.error('Error loading comments:', error);
                this.comments = [];
                this.renderComments();
                this.showToast('Failed to load comments', 'error');
            } finally {
                this.showLoading(false);
                this.refreshBtn.disabled = false;
                this.refreshBtn.textContent = 'Refresh';
            }
        }, 500);
    }

    saveComments() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.comments));
        } catch (error) {
            console.error('Error saving comments:', error);
        }
    }

    renderComments() {
        this.commentsContainer.innerHTML = '';
        
        if (this.comments.length === 0) {
            this.commentsContainer.innerHTML = `
                <div class="no-comments">
                    <p>No comments yet. Be the first to share your thoughts!</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">Comments are stored locally and will reset if you clear your browser data.</p>
                </div>
            `;
            this.updateCommentCount(0);
            return;
        }

        this.comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            this.commentsContainer.appendChild(commentElement);
        });

        this.updateCommentCount(this.comments.length);
    }

    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.dataset.id = comment.id;

        const date = new Date(comment.created_at).toLocaleString();
        const escapedUsername = this.escapeHtml(comment.username);
        const escapedComment = this.escapeHtml(comment.comment);
        
        commentDiv.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${escapedUsername}</span>
                <span class="comment-date">${date}</span>
            </div>
            <div class="comment-text">${escapedComment}</div>
            <div class="comment-actions">
                <button class="delete-comment-btn" onclick="app.openDeleteModal(${comment.id})">
                    🗑️ Delete Comment
                </button>
            </div>
        `;

        // Add click handler for the entire comment (except buttons)
        const clickableArea = commentDiv.querySelector('.comment-text, .comment-header');
        if (clickableArea) {
            clickableArea.style.cursor = 'default';
        }

        return commentDiv;
    }

    openDeleteModal(commentId) {
        this.currentCommentId = commentId;
        this.deletePassword.value = '';
        this.modalMessage.style.display = 'none';
        this.deleteModal.style.display = 'flex';
        this.deletePassword.focus();
        
        // Add animation
        this.deleteModal.classList.add('show');
    }

    async handleDelete(e) {
        e.preventDefault();
        
        const password = this.deletePassword.value;
        const submitBtn = this.deleteForm.querySelector('.delete-btn');
        
        if (!password) {
            this.showModalMessage('Please enter the password', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Deleting...';

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 600));
            
            if (password !== this.DELETION_PASSWORD) {
                throw new Error('Invalid password');
            }

            // Find and remove comment
            const commentIndex = this.comments.findIndex(c => c.id === this.currentCommentId);
            if (commentIndex === -1) {
                throw new Error('Comment not found');
            }
            
            this.comments.splice(commentIndex, 1);
            this.saveComments();
            this.renderComments();
            
            this.closeModal();
            this.showToast('Comment deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting comment:', error);
            if (error.message === 'Invalid password') {
                this.showModalMessage('❌ Invalid password. The correct password is "comdel"', 'error');
                this.deletePassword.value = '';
                this.deletePassword.focus();
            } else {
                this.showModalMessage('Failed to delete comment. Please try again.', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Delete';
        }
    }

    closeModal() {
        this.deleteModal.style.display = 'none';
        this.deleteModal.classList.remove('show');
        this.currentCommentId = null;
        this.deletePassword.value = '';
        this.modalMessage.style.display = 'none';
    }

    updateCommentCount(count) {
        this.commentCount.textContent = count;
    }

    showFormMessage(message, type) {
        this.formMessage.textContent = message;
        this.formMessage.className = `form-message ${type}`;
        this.formMessage.style.display = 'block';
    }

    showModalMessage(message, type) {
        this.modalMessage.textContent = message;
        this.modalMessage.className = `modal-message ${type}`;
        this.modalMessage.style.display = 'block';
    }

    showLoading(show) {
        this.loadingOverlay.classList.toggle('show', show);
    }

    showToast(message, type) {
        // Remove existing toasts
        const existing = document.querySelectorAll('.toast');
        existing.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CommentsApp();
    
    // Add some CSS for the toast animation
    const style = document.createElement('style');
    style.textContent = `
        .modal.show {
            animation: fadeInModal 0.3s ease;
        }
        
        @keyframes fadeInModal {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});

// Service Worker for better offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
