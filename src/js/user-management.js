/**
 * User Management Component
 * Handles username collection, validation, storage, and user switching
 */

class UserManagement {
    constructor(container) {
        this.container = container;
        this.currentUsername = null;
    }

    /**
     * Validate username according to requirements
     * Must be alphanumeric and between 3-20 characters
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return false;
        }

        // Check length (3-20 characters)
        if (username.length < 3 || username.length > 20) {
            return false;
        }

        // Check alphanumeric only (letters and numbers)
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        return alphanumericRegex.test(username);
    }

    /**
     * Get stored username from localStorage
     */
    getStoredUsername() {
        try {
            return localStorage.getItem('britizen_quiz_username');
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return null;
        }
    }

    /**
     * Store username in localStorage
     */
    storeUsername(username) {
        try {
            localStorage.setItem('britizen_quiz_username', username);
            this.currentUsername = username;
            return true;
        } catch (error) {
            console.error('Failed to write to localStorage:', error);
            return false;
        }
    }

    /**
     * Clear stored username
     */
    clearUsername() {
        try {
            localStorage.removeItem('britizen_quiz_username');
            this.currentUsername = null;
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }

    /**
     * Render user selection interface with existing users and new user option
     */
    async renderUserSelection(onSubmit, errorMessage = null) {
        try {
            // Check if database service is available and initialized
            if (!window.databaseService) {
                console.error('Database service not available');
                throw new Error('Database service not available');
            }

            // Wait for database service to be initialized if it's not ready yet
            let retries = 0;
            while (!window.databaseService.isInitialized && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (!window.databaseService.isInitialized) {
                console.error('Database service not initialized after waiting');
                throw new Error('Database service not initialized');
            }

            // Get all existing users from database
            const existingUsers = await window.databaseService.getAllUsers();

            this.container.innerHTML = `
                <div class="container">
                    <h1>Britizen Quiz</h1>
                    <div class="card">
                        <div class="user-selection-container">
                            <h2>Select User</h2>

                            ${existingUsers.length > 0 ? `
                                <div class="existing-users-section">
                                    <h3>Existing Users</h3>
                                    <p>Select from your previous users:</p>
                                    <div class="users-list">
                                        ${this.renderUsersList(existingUsers)}
                                    </div>
                                    <div class="section-divider">
                                        <span>or</span>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="new-user-section">
                                <h3>${existingUsers.length > 0 ? 'Create New User' : 'Welcome!'}</h3>
                                <p>${existingUsers.length > 0 ? 'Enter a new username:' : 'Please enter your username to get started.'}</p>

                                <form id="username-form" class="username-form">
                                    <div class="form-group">
                                        <label for="username-input" class="form-label">Username</label>
                                        <input
                                            type="text"
                                            id="username-input"
                                            class="form-input ${errorMessage ? 'input-error' : ''}"
                                            placeholder="Enter username (3-20 characters)"
                                            autocomplete="username"
                                            maxlength="20"
                                            required
                                        />
                                        ${errorMessage ? `
                                            <div class="error-message-inline">
                                                ${this.escapeHtml(errorMessage)}
                                            </div>
                                        ` : ''}
                                        <div class="form-hint">
                                            Username must be 3-20 characters long and contain only letters and numbers.
                                        </div>
                                    </div>

                                    <button type="submit" class="btn-primary btn-full-width">
                                        ${existingUsers.length > 0 ? 'Create User' : 'Start Quiz'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.attachUserSelectionListeners(onSubmit);
        } catch (error) {
            console.error('Failed to load existing users:', error);
            // Show form with empty users array instead of falling back

            this.container.innerHTML = `
                <div class="container">
                    <h1>Britizen Quiz</h1>
                    <div class="card">
                        <div class="user-selection-container">
                            <h2>Select User</h2>
                            <div class="error-message">
                                <p>⚠️ Could not load existing users. You can still create a new user below.</p>
                            </div>

                            <div class="new-user-section">
                                <h3>Welcome!</h3>
                                <p>Please enter your username to get started.</p>

                                <form id="username-form" class="username-form">
                                    <div class="form-group">
                                        <label for="username-input" class="form-label">Username</label>
                                        <input
                                            type="text"
                                            id="username-input"
                                            class="form-input ${errorMessage ? 'input-error' : ''}"
                                            placeholder="Enter username (3-20 characters)"
                                            autocomplete="username"
                                            maxlength="20"
                                            required
                                        />
                                        ${errorMessage ? `
                                            <div class="error-message-inline">
                                                ${this.escapeHtml(errorMessage)}
                                            </div>
                                        ` : ''}
                                        <div class="form-hint">
                                            Username must be 3-20 characters long and contain only letters and numbers.
                                        </div>
                                    </div>

                                    <button type="submit" class="btn-primary btn-full-width">
                                        Start Quiz
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.attachUsernameFormListeners(onSubmit);
        }
    }

    /**
     * Render username input form for first-time users (fallback)
     */
    renderUsernameForm(onSubmit, errorMessage = null) {
        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="username-form-container">
                        <h2>Welcome!</h2>
                        <p>Please enter your username to get started.</p>

                        <form id="username-form" class="username-form">
                            <div class="form-group">
                                <label for="username-input" class="form-label">Username</label>
                                <input
                                    type="text"
                                    id="username-input"
                                    class="form-input ${errorMessage ? 'input-error' : ''}"
                                    placeholder="Enter username (3-20 characters)"
                                    autocomplete="username"
                                    maxlength="20"
                                    required
                                />
                                ${errorMessage ? `
                                    <div class="error-message-inline">
                                        ${this.escapeHtml(errorMessage)}
                                    </div>
                                ` : ''}
                                <div class="form-hint">
                                    Username must be 3-20 characters long and contain only letters and numbers.
                                </div>
                            </div>

                            <button type="submit" class="btn-primary btn-full-width">
                                Start Quiz
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.attachUsernameFormListeners(onSubmit);
    }

    /**
     * Render the list of existing users
     */
    renderUsersList(users) {
        try {
            return users.map(user => `
            <div class="user-item" data-username="${this.escapeHtml(user.username)}">
                <div class="user-info">
                    <div class="user-name">
                        <span class="user-icon">👤</span>
                        ${this.escapeHtml(user.username)}
                    </div>
                    <div class="user-stats">
                        <span class="stat">${user.quizzesCompleted} quiz${user.quizzesCompleted !== 1 ? 'es' : ''}</span>
                        <span class="stat">${user.totalAttempts} attempt${user.totalAttempts !== 1 ? 's' : ''}</span>
                        <span class="stat">Avg: ${user.averageScore}%</span>
                    </div>
                    <div class="user-last-activity">
                        Last active: ${this.formatRelativeTime(new Date(user.lastActivity))}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="select-user-btn" data-username="${this.escapeHtml(user.username)}">
                        Select
                    </button>
                    <button class="delete-user-btn" data-username="${this.escapeHtml(user.username)}" title="Delete user and all quiz data">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
        } catch (error) {
            console.error('Error rendering users list:', error);
            return '<p>Error displaying users</p>';
        }
    }

    /**
     * Attach event listeners to user selection interface
     */
    attachUserSelectionListeners(onSubmit) {
        // Handle existing user selection
        const userItems = this.container.querySelectorAll('.user-item');
        const selectButtons = this.container.querySelectorAll('.select-user-btn');
        const deleteButtons = this.container.querySelectorAll('.delete-user-btn');

        userItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking action buttons
                if (e.target.classList.contains('select-user-btn') ||
                    e.target.classList.contains('delete-user-btn')) return;

                const username = item.dataset.username;
                if (username) {
                    this.selectExistingUser(username, onSubmit);
                }
            });
        });

        selectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const username = button.dataset.username;
                if (username) {
                    this.selectExistingUser(username, onSubmit);
                }
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const username = button.dataset.username;
                if (username) {
                    this.deleteUser(username, onSubmit);
                }
            });
        });

        // Handle new username form
        this.attachUsernameFormListeners(onSubmit);
    }

    /**
     * Handle selection of an existing user
     */
    selectExistingUser(username, onSubmit) {
        if (this.storeUsername(username)) {
            onSubmit(username);
        } else {
            this.renderUserSelection(onSubmit, 'Failed to select user. Please try again.');
        }
    }

    /**
     * Handle deletion of an existing user
     */
    async deleteUser(username, onSubmit) {
        const confirmMessage = `Are you sure you want to delete "${username}" and all their quiz data?\n\nThis action cannot be undone.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Show loading state
            const deleteButton = this.container.querySelector(`[data-username="${username}"].delete-user-btn`);
            if (deleteButton) {
                deleteButton.disabled = true;
                deleteButton.innerHTML = '⏳';
            }

            // Delete user from database
            await window.databaseService.deleteUser(username);

            // Show success message briefly
            if (deleteButton) {
                deleteButton.innerHTML = '✅';
            }

            // Refresh the user selection to remove the deleted user
            setTimeout(() => {
                this.renderUserSelection(onSubmit, `User "${username}" has been deleted successfully.`);
            }, 1000);

        } catch (error) {
            console.error('Failed to delete user:', error);

            // Reset button state
            const deleteButton = this.container.querySelector(`[data-username="${username}"].delete-user-btn`);
            if (deleteButton) {
                deleteButton.disabled = false;
                deleteButton.innerHTML = '🗑️';
            }

            // Show error message
            this.renderUserSelection(onSubmit, `Failed to delete user: ${error.message}`);
        }
    }

    /**
     * Attach event listeners to username form
     */
    attachUsernameFormListeners(onSubmit) {
        const form = this.container.querySelector('#username-form');
        const input = this.container.querySelector('#username-input');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = input.value.trim();

                if (this.validateUsername(username)) {
                    if (this.storeUsername(username)) {
                        onSubmit(username);
                    } else {
                        this.renderUserSelection(onSubmit, 'Failed to save username. Please try again.');
                    }
                } else {
                    this.renderUserSelection(onSubmit, 'Invalid username. Must be 3-20 alphanumeric characters.');
                }
            });
        }

        // Auto-focus the input field if no existing users
        if (input && !this.container.querySelector('.existing-users-section')) {
            input.focus();
        }
    }

    /**
     * Render user dashboard with username display and switch option
     */
    renderUserDashboard(username, onContinue, onSwitch) {
        this.currentUsername = username;

        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="user-dashboard">
                        <div class="user-welcome">
                            <h2>Welcome back, ${this.escapeHtml(username)}!</h2>
                            <p>Ready to continue your quiz journey?</p>
                        </div>

                        <div class="user-actions">
                            <button id="continue-button" class="btn-primary btn-large">
                                Continue to Quizzes
                            </button>
                            <button id="switch-user-button" class="btn-secondary">
                                Switch User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachDashboardListeners(onContinue, onSwitch);
    }

    /**
     * Attach event listeners to user dashboard
     */
    attachDashboardListeners(onContinue, onSwitch) {
        const continueButton = this.container.querySelector('#continue-button');
        const switchButton = this.container.querySelector('#switch-user-button');

        if (continueButton) {
            continueButton.addEventListener('click', () => {
                onContinue(this.currentUsername);
            });
        }

        if (switchButton) {
            switchButton.addEventListener('click', () => {
                this.clearUsername();
                onSwitch();
            });
        }
    }

    /**
     * Create user header component for display during quiz
     */
    createUserHeader(username) {
        return `
            <div class="user-header">
                <div class="user-info">
                    <span class="user-icon">👤</span>
                    <span class="user-name">${this.escapeHtml(username)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Format relative time for display
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check if user is logged in
     */
    isUserLoggedIn() {
        return this.getStoredUsername() !== null;
    }

    /**
     * Get current username
     */
    getCurrentUsername() {
        if (!this.currentUsername) {
            this.currentUsername = this.getStoredUsername();
        }
        return this.currentUsername;
    }
}
// Export for use in other modules
window.UserManagement = UserManagement;
