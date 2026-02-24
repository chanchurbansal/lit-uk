/**
 * Britizen Quiz Application
 * Main entry point for the quiz application
 */

// Results Report Component
class ResultsReport {
    constructor(container, results, onRetry, onSelectDifferent, onViewHistory = null) {
        this.container = container;
        this.results = results;
        this.onRetry = onRetry;
        this.onSelectDifferent = onSelectDifferent;
        this.onViewHistory = onViewHistory;
    }

    /**
     * Render the results report
     */
    async render() {
        // Get user's previous attempts for context
        let previousAttempts = [];
        let bestScore = null;

        if (this.results.username && window.databaseService && window.databaseService.isInitialized) {
            try {
                // Get quiz ID from results (we'll need to pass this)
                const quizId = this.getQuizIdFromResults();
                if (quizId) {
                    previousAttempts = await window.databaseService.getQuizHistory(this.results.username, quizId);
                    bestScore = await window.databaseService.getBestScore(this.results.username, quizId);
                }
            } catch (error) {
                console.error('Failed to load previous attempts:', error);
            }
        }

        const userContext = this.renderUserContext(previousAttempts, bestScore);

        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="results-header">
                        <h2>Quiz Results</h2>
                        ${userContext}
                        <div class="results-summary">
                            <div class="score-display">
                                <div class="score-number">${this.results.correctCount}/${this.results.totalQuestions}</div>
                                <div class="score-percentage">${this.results.percentage}%</div>
                            </div>
                            <div class="pass-status ${this.results.passed ? 'passed' : 'failed'}">
                                ${this.results.passed ? '✓ PASSED' : '✗ FAILED'}
                            </div>
                            <div class="passmark-info">
                                Pass mark: ${this.results.passmarkScore}/${this.results.totalQuestions} (${this.results.passmark}%)
                            </div>
                        </div>
                    </div>

                    <div class="results-actions">
                        <button id="retry-button" class="btn-primary">Retry Quiz</button>
                        <button id="select-different-button" class="btn-primary">Select Different Quiz</button>
                        ${previousAttempts.length > 1 && this.onViewHistory ? `
                            <button id="view-history-button" class="btn-secondary">View All Attempts</button>
                        ` : ''}
                    </div>

                    <div class="results-details">
                        <h3>Question by Question Results</h3>
                        <div class="question-results">
                            ${this.renderQuestionResults()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Render user-specific context information
     */
    renderUserContext(previousAttempts, bestScore) {
        if (!this.results.username) {
            return `
                <div class="user-context">
                    <div class="user-info">
                        <span class="user-icon">👤</span>
                        <span class="user-name">Guest</span>
                        <span class="attempt-info">First attempt at this quiz</span>
                    </div>
                </div>
            `;
        }

        // previousAttempts includes the current attempt that was just saved
        const totalAttempts = previousAttempts.length;
        const attemptNumber = totalAttempts;

        // If this is the first attempt, show appropriate message
        if (totalAttempts === 1) {
            return `
                <div class="user-context">
                    <div class="user-info">
                        <span class="user-icon">👤</span>
                        <span class="user-name">${this.escapeHtml(this.results.username)}</span>
                        <span class="attempt-info">First attempt at this quiz</span>
                    </div>
                </div>
            `;
        }

        const isNewBest = bestScore !== null && this.results.correctCount > bestScore;

        return `
            <div class="user-context">
                <div class="user-info">
                    <span class="user-icon">👤</span>
                    <span class="user-name">${this.escapeHtml(this.results.username)}</span>
                    <span class="attempt-info">Attempt #${attemptNumber}</span>
                </div>
                <div class="performance-context">
                    ${isNewBest ? `
                        <div class="new-best-score">
                            🎉 New personal best! Previous best: ${bestScore}/24
                        </div>
                    ` : bestScore !== null ? `
                        <div class="previous-best">
                            Personal best: ${bestScore}/24
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Extract quiz ID from results (this is a workaround since we don't pass quiz ID directly)
     */
    getQuizIdFromResults() {
        if (this.results.quizName) {
            // Try to extract quiz ID from quiz name - handle multiple patterns:
            // Pattern 1: "Quiz X" (fallback format)
            let match = this.results.quizName.match(/Quiz (\d+)/);
            if (match) {
                return parseInt(match[1]);
            }

            // Pattern 2: "Life in the UK Test X" (actual format from quiz data)
            match = this.results.quizName.match(/Life in the UK Test (\d+)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return null;
    }

    /**
     * Render individual question results
     */
    renderQuestionResults() {
        return this.results.questionResults.map((result, index) => `
            <div class="question-result ${result.isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-result-header">
                    <span class="question-number">Question ${index + 1}</span>
                    <span class="result-indicator ${result.isCorrect ? 'correct' : 'incorrect'}">
                        ${result.isCorrect ? '✓' : '✗'}
                    </span>
                </div>
                <div class="question-result-content">
                    <p class="question-text">${this.escapeHtml(result.questionText)}</p>
                    <div class="answer-comparison">
                        <div class="user-answer">
                            <strong>Your answer:</strong>
                            <span class="${result.isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                                ${this.escapeHtml(result.userAnswerText)}
                            </span>
                        </div>
                        ${!result.isCorrect ? `
                            <div class="correct-answer">
                                <strong>Correct answer:</strong>
                                <span class="correct-answer">${this.escapeHtml(result.correctAnswerText)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${result.explanation ? `
                        <div class="explanation">
                            <strong>Explanation:</strong> ${this.escapeHtml(result.explanation)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const retryButton = this.container.querySelector('#retry-button');
        const selectDifferentButton = this.container.querySelector('#select-different-button');
        const viewHistoryButton = this.container.querySelector('#view-history-button');

        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.onRetry();
            });
        }

        if (selectDifferentButton) {
            selectDifferentButton.addEventListener('click', () => {
                this.onSelectDifferent();
            });
        }

        if (viewHistoryButton && this.onViewHistory) {
            viewHistoryButton.addEventListener('click', () => {
                const quizId = this.getQuizIdFromResults();
                if (quizId) {
                    this.onViewHistory(quizId);
                }
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
}

// Progress Bar Component
class ProgressBar {
    constructor(container, currentIndex, totalQuestions) {
        this.container = container;
        this.currentIndex = currentIndex;
        this.totalQuestions = totalQuestions;
    }

    /**
     * Render the progress bar
     */
    render() {
        const progressInfo = ProgressCalculator.getProgressInfo(this.currentIndex, this.totalQuestions);

        this.container.innerHTML = `
            <div class="progress-container">
                <div class="progress-text">
                    Question ${progressInfo.displayString}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressInfo.progressBarWidth}"></div>
                </div>
                <div class="progress-percentage">
                    ${progressInfo.percentage}% Complete
                </div>
            </div>
        `;
    }

    /**
     * Update progress to new values
     */
    updateProgress(currentIndex) {
        this.currentIndex = currentIndex;
        this.render();
    }
}

// Question Display Component
class QuestionDisplay {
    constructor(container, stateManager, onOptionSelect, onNext) {
        this.container = container;
        this.stateManager = stateManager;
        this.onOptionSelect = onOptionSelect;
        this.onNext = onNext;
    }

    /**
     * Render the question display interface
     */
    render() {
        const question = this.stateManager.getCurrentQuestion();
        const questionNumber = this.stateManager.currentQuestionIndex + 1;
        const totalQuestions = this.stateManager.getTotalQuestions();

        if (!question) {
            this.container.innerHTML = '<div class="error">No question available</div>';
            return;
        }

        const isMultipleChoice = this.stateManager.isMultipleChoiceQuestion(question);
        const hasAnswer = this.stateManager.hasCurrentAnswer();

        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div id="progress-bar-container"></div>
                <div class="card">
                    <div class="question-header">
                        <h2>Question ${questionNumber} of ${totalQuestions}</h2>
                        ${isMultipleChoice ? '<p class="multiple-choice-hint">Select all correct answers</p>' : ''}
                    </div>
                    <div class="question-content">
                        <p class="question-text">${this.escapeHtml(question.text)}</p>
                        <div class="options-container">
                            ${this.renderOptions(question.options, isMultipleChoice)}
                        </div>
                        <div class="question-actions">
                            <button id="next-button" class="btn-primary" ${!hasAnswer ? 'disabled' : ''}>
                                ${questionNumber === totalQuestions ? 'Finish Quiz' : 'Next Question'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Clear DOM cache since we're re-rendering
        this.clearDOMCache();

        // Render progress bar
        const progressContainer = this.container.querySelector('#progress-bar-container');
        const progressBar = new ProgressBar(progressContainer, this.stateManager.currentQuestionIndex, totalQuestions);
        progressBar.render();

        this.attachEventListeners();
    }

    /**
     * Render option buttons
     */
    renderOptions(options, isMultipleChoice) {
        const questionIndex = this.stateManager.currentQuestionIndex;

        return options.map(option => {
            const isSelected = this.stateManager.isOptionSelected(questionIndex, option.id);
            const selectionClass = isSelected ? 'selected' : '';
            const multipleChoiceClass = isMultipleChoice ? 'multiple-choice' : '';

            return `
                <button class="option-button ${selectionClass} ${multipleChoiceClass}"
                        data-option-id="${option.id}">
                    ${isMultipleChoice ? '<span class="checkbox-indicator"></span>' : ''}
                    ${this.escapeHtml(option.text)}
                </button>
            `;
        }).join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Option selection
        const optionButtons = this.container.querySelectorAll('.option-button');
        optionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Handle clicks on nested elements by finding the button
                let target = e.target;
                while (target && !target.dataset.optionId) {
                    target = target.parentElement;
                }

                if (target && target.dataset.optionId) {
                    const optionId = parseInt(target.dataset.optionId);
                    this.handleOptionSelect(optionId);
                }
            });
        });

        // Next button
        const nextButton = this.container.querySelector('#next-button');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.handleNext();
            });
        }
    }

    /**
     * Handle option selection
     */
    handleOptionSelect(optionId) {
        const questionIndex = this.stateManager.currentQuestionIndex;

        // Toggle the selection
        this.stateManager.toggleAnswer(questionIndex, optionId);

        // Update visual selection
        this.updateVisualSelection();

        // Enable/disable next button based on whether any answer is selected
        const nextButton = this.container.querySelector('#next-button');
        if (nextButton) {
            nextButton.disabled = !this.stateManager.hasCurrentAnswer();
        }

        // Call callback
        this.onOptionSelect(optionId);
    }

    /**
     * Update visual selection for all options (optimized to avoid unnecessary DOM queries)
     */
    updateVisualSelection() {
        const questionIndex = this.stateManager.currentQuestionIndex;

        // Cache the buttons if not already cached
        if (!this.cachedOptionButtons) {
            this.cachedOptionButtons = this.container.querySelectorAll('.option-button');
        }

        this.cachedOptionButtons.forEach(button => {
            const optionId = parseInt(button.dataset.optionId);
            const isSelected = this.stateManager.isOptionSelected(questionIndex, optionId);

            // Only modify DOM if state actually changed
            const hasSelectedClass = button.classList.contains('selected');
            if (isSelected && !hasSelectedClass) {
                button.classList.add('selected');
            } else if (!isSelected && hasSelectedClass) {
                button.classList.remove('selected');
            }
        });
    }

    /**
     * Clear cached DOM elements when rendering new question
     */
    clearDOMCache() {
        this.cachedOptionButtons = null;
    }

    /**
     * Handle next button click
     */
    handleNext() {
        if (this.stateManager.hasCurrentAnswer()) {
            this.onNext();
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
}

// Quiz History Component
class QuizHistory {
    constructor(container, onBack, onStartQuiz) {
        this.container = container;
        this.onBack = onBack;
        this.onStartQuiz = onStartQuiz;
    }

    /**
     * Render quiz attempt history for a specific quiz
     */
    async render(quizId, username) {
        try {
            const attempts = await databaseService.getQuizHistory(username, quizId);

            this.container.innerHTML = `
                <div class="container">
                    <h1>Britizen Quiz</h1>
                    <div class="card">
                        <div class="history-header">
                            <button id="back-button" class="btn-secondary">← Back to Quiz Selection</button>
                            <h2>Quiz ${quizId} - Attempt History</h2>
                            <p>Your previous attempts for this quiz</p>
                        </div>

                        ${attempts.length > 0 ? `
                            <div class="history-summary">
                                <div class="summary-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Total Attempts:</span>
                                        <span class="stat-value">${attempts.length}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Best Score:</span>
                                        <span class="stat-value">${Math.max(...attempts.map(a => a.score))}/24 (${Math.round(Math.max(...attempts.map(a => a.percentage)))}%)</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Pass Rate:</span>
                                        <span class="stat-value">${Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)}%</span>
                                    </div>
                                </div>
                                <button id="start-new-attempt" class="btn-primary">Start New Attempt</button>
                            </div>

                            <div class="attempts-list">
                                <h3>All Attempts</h3>
                                ${this.renderAttemptsList(attempts)}
                            </div>
                        ` : `
                            <div class="no-attempts">
                                <p>No attempts found for this quiz.</p>
                                <button id="start-first-attempt" class="btn-primary">Start First Attempt</button>
                            </div>
                        `}
                    </div>
                </div>
            `;

            this.attachEventListeners(quizId);
        } catch (error) {
            console.error('Failed to load quiz history:', error);
            this.renderError();
        }
    }

    /**
     * Render the list of attempts
     */
    renderAttemptsList(attempts) {
        return attempts.map((attempt, index) => `
            <div class="attempt-item ${attempt.passed ? 'passed' : 'failed'}">
                <div class="attempt-header">
                    <div class="attempt-number">Attempt #${attempts.length - index}</div>
                    <div class="attempt-date">${this.formatDate(attempt.completedAt)}</div>
                    <div class="attempt-result ${attempt.passed ? 'passed' : 'failed'}">
                        ${attempt.passed ? '✓ PASSED' : '✗ FAILED'}
                    </div>
                </div>
                <div class="attempt-details">
                    <div class="score-info">
                        <span class="score">${attempt.score}/24</span>
                        <span class="percentage">(${Math.round(attempt.percentage)}%)</span>
                    </div>
                    <div class="time-info">
                        <span class="time-taken">Time: ${this.formatTime(attempt.timeTaken)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render error state
     */
    renderError() {
        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="error-message">
                        <p class="text-error">Failed to load quiz history. Please try again.</p>
                        <button id="back-button" class="btn-primary">Back to Quiz Selection</button>
                    </div>
                </div>
            </div>
        `;
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners(quizId = null) {
        const backButton = this.container.querySelector('#back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.onBack();
            });
        }

        const startNewButton = this.container.querySelector('#start-new-attempt');
        if (startNewButton && quizId) {
            startNewButton.addEventListener('click', () => {
                this.onStartQuiz(quizId);
            });
        }

        const startFirstButton = this.container.querySelector('#start-first-attempt');
        if (startFirstButton && quizId) {
            startFirstButton.addEventListener('click', () => {
                this.onStartQuiz(quizId);
            });
        }
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Format time duration in seconds to readable format
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    }
}

// Quiz Selector Component
class QuizSelector {
    constructor(container, onQuizSelect, currentUser = null, onUserSwitch = null, onViewHistory = null) {
        this.container = container;
        this.onQuizSelect = onQuizSelect;
        this.currentUser = currentUser;
        this.onUserSwitch = onUserSwitch;
        this.onViewHistory = onViewHistory;
        this.isLoading = false;
        this.quizStatuses = new Map(); // Store quiz completion statuses
    }

    /**
     * Load and set quiz statuses for the current user
     */
    async loadQuizStatuses() {
        if (!this.currentUser) {
            this.quizStatuses.clear();
            return;
        }

        try {
            const statuses = await databaseService.getAllQuizStatuses(this.currentUser);
            this.quizStatuses.clear();

            // Convert array to Map for easier lookup
            statuses.forEach(status => {
                this.quizStatuses.set(status.quizId, status);
            });
        } catch (error) {
            console.error('Failed to load quiz statuses:', error);
            this.quizStatuses.clear();
        }
    }

    /**
     * Render the quiz selector interface
     */
    async render() {
        // Load quiz statuses first
        await this.loadQuizStatuses();

        const userHeader = this.currentUser ? this.renderUserHeader() : '';

        // Generate quiz buttons HTML
        const quizButtonsHTML = await this.renderQuizButtons();

        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                ${userHeader}
                <div class="card">
                    <h2>Select a Quiz</h2>
                    <p>Choose from 102 available quizzes to test your knowledge.</p>
                    <div id="quiz-grid" class="quiz-grid">
                        ${quizButtonsHTML}
                    </div>
                    <div id="loading-indicator" class="loading-container hidden">
                        <div class="loading"></div>
                        <p>Loading quiz...</p>
                    </div>
                    <div id="error-message" class="error-message hidden">
                        <p class="text-error">Failed to load quiz. Please try again.</p>
                        <button id="retry-button" class="btn-primary">Retry</button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Render user header with switch option
     */
    renderUserHeader() {
        return `
            <div class="user-header">
                <div class="user-info">
                    <span class="user-icon">👤</span>
                    <span class="user-name">${this.escapeHtml(this.currentUser)}</span>
                    ${this.onUserSwitch ? `
                        <button id="switch-user-header" class="btn-secondary btn-small">
                            Switch User
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get the selector ID (1-102) for a given actual quiz ID by checking quiz files
     * Uses lazy loading - only loads the specific quiz file when needed
     */
    async getQuizSelectorId(actualQuizId) {
        // Initialize cache if not exists
        if (!this.quizIdMappingCache) {
            this.quizIdMappingCache = new Map();
        }

        // Check cache first
        if (this.quizIdMappingCache.has(actualQuizId)) {
            return this.quizIdMappingCache.get(actualQuizId);
        }

        // Try to find the selector ID by checking quiz files one by one
        // This is more efficient than loading all 102 files upfront
        for (let selectorId = 1; selectorId <= 102; selectorId++) {
            try {
                const response = await fetch(`src/quiz-data/quiz-${selectorId}.json`, {
                    method: 'HEAD'
                });
                if (response.ok) {
                    const dataResponse = await fetch(`src/quiz-data/quiz-${selectorId}.json`);
                    const quizData = await dataResponse.json();

                    // Cache this mapping for future use
                    this.quizIdMappingCache.set(quizData.id, selectorId);

                    // If this is the quiz we're looking for, return it
                    if (quizData.id === actualQuizId) {
                        return selectorId;
                    }
                }
            } catch (error) {
                // Skip files that don't exist or can't be loaded
                continue;
            }
        }

        return null;
    }

    /**
     * Generate HTML for quiz selection buttons with completion status (optimized)
     */
    async renderQuizButtons() {
        // Use array and join for better performance than string concatenation
        const buttonElements = [];

        for (let i = 1; i <= 102; i++) {
            // Simple approach: only show completion status if we have it readily available
            // This avoids the expensive mapping operation on every load
            let statusClass = 'not-completed';
            let statusInfo = '';

            // Look for quiz status by trying common patterns first
            let matchingStatus = null;

            // Try to find status by checking common quiz ID patterns
            for (const [actualQuizId, status] of this.quizStatuses) {
                // Check if this might be the quiz we're looking for
                // Use heuristics to avoid expensive file loading
                if (status.quizName && status.quizName.includes(`Test ${i}`)) {
                    matchingStatus = status;
                    break;
                }
                // For quizzes without clear naming, we'll show them as not completed
                // This is more efficient than loading all quiz files
            }

            if (matchingStatus && matchingStatus.isCompleted) {
                if (matchingStatus.lastAttemptPassed === false) {
                    statusClass = 'last-failed';
                } else if (matchingStatus.lastAttemptPassed === true) {
                    statusClass = 'last-passed';
                } else {
                    statusClass = 'completed';
                }

                const lastAttemptIcon = matchingStatus.lastAttemptPassed === false ? '✗' : '✓';
                const lastAttemptClass = matchingStatus.lastAttemptPassed === false ? 'failed-indicator' : 'completion-indicator';

                statusInfo = `
                    <div class="quiz-status">
                        <div class="${lastAttemptClass}">${lastAttemptIcon}</div>
                        <div class="best-score">Best: ${matchingStatus.bestScore}/24 (${Math.round(matchingStatus.bestPercentage)}%)</div>
                        <div class="attempt-count">${matchingStatus.totalAttempts} attempt${matchingStatus.totalAttempts !== 1 ? 's' : ''}</div>
                    </div>
                `;
            }

            buttonElements.push(`
                <div class="quiz-button-container ${statusClass}">
                    <button class="quiz-button" data-quiz-id="${i}" ${this.isLoading ? 'disabled' : ''}>
                        <div class="quiz-title">Quiz ${i}</div>
                        ${statusInfo}
                    </button>
                    ${matchingStatus && matchingStatus.isCompleted && this.onViewHistory ? `
                        <button class="view-history-btn" data-quiz-id="${matchingStatus.quizId}" title="View attempt history">
                            📊
                        </button>
                    ` : ''}
                </div>
            `);
        }

        return buttonElements.join('');
    }

    /**
     * Attach event listeners to quiz buttons
     */
    attachEventListeners() {
        const quizButtons = this.container.querySelectorAll('.quiz-button');
        quizButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Handle clicks on nested elements
                let target = e.target;
                while (target && !target.dataset.quizId) {
                    target = target.parentElement;
                }

                if (target && target.dataset.quizId) {
                    const quizId = parseInt(target.dataset.quizId);
                    this.handleQuizSelection(quizId);
                }
            });
        });

        // View history buttons
        const historyButtons = this.container.querySelectorAll('.view-history-btn');
        historyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering quiz selection
                const quizId = parseInt(e.target.dataset.quizId);
                if (this.onViewHistory) {
                    this.onViewHistory(quizId);
                }
            });
        });

        const retryButton = this.container.querySelector('#retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.hideError();
            });
        }

        // User switch button
        const switchUserButton = this.container.querySelector('#switch-user-header');
        if (switchUserButton && this.onUserSwitch) {
            switchUserButton.addEventListener('click', () => {
                this.onUserSwitch();
            });
        }
    }

    /**
     * Handle quiz selection and show loading state
     */
    async handleQuizSelection(quizId) {
        if (this.isLoading) return;

        this.showLoading();

        try {
            await this.onQuizSelect(quizId);
        } catch (error) {
            this.showError();
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.isLoading = true;
        const loadingIndicator = this.container.querySelector('#loading-indicator');
        const quizGrid = this.container.querySelector('#quiz-grid');
        const errorMessage = this.container.querySelector('#error-message');

        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (quizGrid) quizGrid.classList.add('hidden');
        if (errorMessage) errorMessage.classList.add('hidden');

        // Disable all quiz buttons
        const quizButtons = this.container.querySelectorAll('.quiz-button');
        quizButtons.forEach(button => {
            button.disabled = true;
        });
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.isLoading = false;
        const loadingIndicator = this.container.querySelector('#loading-indicator');
        const quizGrid = this.container.querySelector('#quiz-grid');

        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (quizGrid) quizGrid.classList.remove('hidden');

        // Re-enable all quiz buttons
        const quizButtons = this.container.querySelectorAll('.quiz-button');
        quizButtons.forEach(button => {
            button.disabled = false;
        });
    }

    /**
     * Show error message
     */
    showError() {
        this.isLoading = false;
        const loadingIndicator = this.container.querySelector('#loading-indicator');
        const quizGrid = this.container.querySelector('#quiz-grid');
        const errorMessage = this.container.querySelector('#error-message');

        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (quizGrid) quizGrid.classList.add('hidden');
        if (errorMessage) errorMessage.classList.remove('hidden');
    }

    /**
     * Hide error message and return to quiz selection
     */
    hideError() {
        const errorMessage = this.container.querySelector('#error-message');
        const quizGrid = this.container.querySelector('#quiz-grid');

        if (errorMessage) errorMessage.classList.add('hidden');
        if (quizGrid) quizGrid.classList.remove('hidden');

        // Re-enable all quiz buttons
        const quizButtons = this.container.querySelectorAll('.quiz-button');
        quizButtons.forEach(button => {
            button.disabled = false;
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Enhanced Application Controller with User Management
const app = {
    container: null,
    stateManager: null,
    apiService: null,
    userManagement: null,
    currentComponent: null,
    currentUser: null,
    isInitialized: false,

    // Initialize the application
    async init() {
        try {
            this.container = document.getElementById('app');
            if (!this.container) {
                console.error('App container not found');
                return;
            }

            // Show loading state
            this.showLoadingState('Initializing application...');

            // Initialize services
            this.stateManager = new StateManager();
            this.apiService = new APIService();
            this.userManagement = new UserManagement(this.container);

            // Initialize database service
            await this.initializeDatabase();

            // Check for existing user or show username form
            await this.initializeUser();

            this.isInitialized = true;

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showInitializationError(error);
        }
    },

    // Initialize database service
    async initializeDatabase() {
        try {
            if (!window.databaseService.isInitialized) {
                await window.databaseService.initialize();
            }
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw new Error('Failed to initialize local storage. Please refresh the page and try again.');
        }
    },

    // Show loading state during initialization
    showLoadingState(message) {
        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="loading-container">
                        <div class="loading"></div>
                        <p>${message}</p>
                    </div>
                </div>
            </div>
        `;
    },

    // Show initialization error
    showInitializationError(error) {
        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="error-message">
                        <h2>Initialization Failed</h2>
                        <p class="text-error">${error.message || 'An unexpected error occurred during initialization.'}</p>
                        <button id="retry-init" class="btn-primary">Retry</button>
                    </div>
                </div>
            </div>
        `;

        const retryButton = this.container.querySelector('#retry-init');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                location.reload();
            });
        }
    },

    // Initialize user management flow
    async initializeUser() {
        const storedUsername = this.userManagement.getStoredUsername();

        if (storedUsername && this.userManagement.validateUsername(storedUsername)) {
            // User exists, show dashboard
            this.currentUser = storedUsername;
            this.stateManager.setCurrentUser(storedUsername);
            await this.showUserDashboard(storedUsername);
        } else {
            // No valid user, show user selection
            this.showUserSelection();
        }
    },

    // Show user selection interface
    showUserSelection(errorMessage = null) {
        this.userManagement.renderUserSelection(
            (username) => this.handleUsernameSubmit(username),
            errorMessage
        );
    },

    // Handle username submission
    async handleUsernameSubmit(username) {
        try {
            // Validate and store username
            if (!this.userManagement.validateUsername(username)) {
                this.showUserSelection('Invalid username. Must be 3-20 alphanumeric characters.');
                return;
            }

            if (!this.userManagement.storeUsername(username)) {
                this.showUserSelection('Failed to save username. Please try again.');
                return;
            }

            // Set current user in application and state manager
            this.currentUser = username;
            this.stateManager.setCurrentUser(username);

            // Navigate directly to quiz selector (Requirements 1.3)
            await this.showQuizSelector();

        } catch (error) {
            console.error('Failed to handle username submission:', error);
            this.showUserSelection('An error occurred. Please try again.');
        }
    },

    // Show user dashboard
    async showUserDashboard(username) {
        this.userManagement.renderUserDashboard(
            username,
            (user) => this.handleContinueToQuizzes(user),
            () => this.handleUserSwitch()
        );
    },

    // Handle continue to quizzes from dashboard
    async handleContinueToQuizzes(username) {
        this.currentUser = username;
        this.stateManager.setCurrentUser(username);
        await this.showQuizSelector();
    },

    // Handle user switch (Requirements 1.5)
    handleUserSwitch() {
        // Clear current user data
        this.currentUser = null;
        this.stateManager.clearUser();

        // Show user selection for new user
        this.showUserSelection();
    },

    // Show quiz selector component
    async showQuizSelector() {
        try {
            this.currentComponent = new QuizSelector(
                this.container,
                (quizId) => this.handleQuizSelection(quizId),
                this.currentUser,
                () => this.handleUserSwitch(),
                (quizId) => this.handleViewHistory(quizId)
            );
            await this.currentComponent.render();
        } catch (error) {
            console.error('Failed to show quiz selector:', error);
            this.showError('Failed to load quiz selection. Please try again.');
        }
    },

    // Handle viewing quiz history (Requirements 8.3, 8.4)
    handleViewHistory(quizId) {
        this.showQuizHistory(quizId);
    },

    // Show quiz history component
    showQuizHistory(quizId) {
        this.currentComponent = new QuizHistory(
            this.container,
            () => this.showQuizSelector(),
            (quizId) => this.handleQuizSelection(quizId)
        );
        this.currentComponent.render(quizId, this.currentUser);
    },

    // Handle quiz selection
    async handleQuizSelection(quizId) {
        try {
            // Ensure user is logged in
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const quiz = await this.apiService.fetchQuiz(quizId);
            this.stateManager.startQuiz(quiz);

            // Navigate to question display
            this.showQuestionDisplay();

        } catch (error) {
            console.error('Failed to load quiz:', error);
            throw error; // Re-throw to trigger error display in QuizSelector
        }
    },

    // Show question display component
    showQuestionDisplay() {
        this.currentComponent = new QuestionDisplay(
            this.container,
            this.stateManager,
            (optionId) => this.handleOptionSelection(optionId),
            () => this.handleNextQuestion()
        );
        this.currentComponent.render();
    },

    // Handle option selection
    handleOptionSelection(optionId) {
        // The StateManager.toggleAnswer is already called in QuestionDisplay.handleOptionSelect
        // No additional action needed here since the toggle logic is handled in the state manager
    },

    // Handle next question
    async handleNextQuestion() {
        if (this.stateManager.isComplete()) {
            // Navigate to results
            await this.showResults();
        } else {
            this.stateManager.nextQuestion();
            this.showQuestionDisplay();
        }
    },

    // Show results report component with database integration
    async showResults() {
        try {
            const session = this.stateManager.getSession();
            const results = await ResultsCalculator.calculateResults(session);

            // Note: Database saving is handled by ResultsCalculator.calculateResults()
            // This ensures proper integration and avoids duplication

            this.currentComponent = new ResultsReport(
                this.container,
                results,
                () => this.handleRetryQuiz(),
                () => this.handleSelectDifferentQuiz(),
                (quizId) => this.handleViewHistory(quizId)
            );
            await this.currentComponent.render();

        } catch (error) {
            console.error('Failed to show results:', error);
            this.showError('Failed to calculate results. Please try again.');
        }
    },

    // Handle retry quiz (Requirements 6.3)
    handleRetryQuiz() {
        const currentQuiz = this.stateManager.currentQuiz;
        this.stateManager.reset();
        this.stateManager.startQuiz(currentQuiz);
        this.showQuestionDisplay();
    },

    // Handle select different quiz (Requirements 6.4)
    async handleSelectDifferentQuiz() {
        this.stateManager.reset();
        await this.showQuizSelector();
    },

    // Show generic error message
    showError(message) {
        this.container.innerHTML = `
            <div class="container">
                <h1>Britizen Quiz</h1>
                <div class="card">
                    <div class="error-message">
                        <p class="text-error">${message}</p>
                        <button id="back-to-selection" class="btn-primary">Back to Quiz Selection</button>
                    </div>
                </div>
            </div>
        `;

        const backButton = this.container.querySelector('#back-to-selection');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showQuizSelector();
            });
        }
    },

    // Get current application state for debugging
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentUser: this.currentUser,
            hasCurrentQuiz: !!this.stateManager?.currentQuiz,
            currentQuestionIndex: this.stateManager?.currentQuestionIndex,
            databaseInitialized: window.databaseService?.isInitialized
        };
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});
