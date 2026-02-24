/**
 * State Manager Module
 * Manages quiz session state and user interactions
 */

class StateManager {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map(); // questionIndex -> selectedOptionId or array of optionIds
        this.currentUser = null;
        this.startTime = null;
    }

    /**
     * Set current user
     * @param {string} username - The current user's username
     */
    setCurrentUser(username) {
        this.currentUser = username;
    }

    /**
     * Get current user
     * @returns {string|null} - The current user's username
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Start a new quiz session
     * @param {Object} quiz - The quiz data from API
     * @throws {Error} If no user is logged in
     */
    startQuiz(quiz) {
        if (!this.isUserLoggedIn()) {
            throw new Error('Cannot start quiz: No user logged in');
        }

        this.currentQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
        this.startTime = new Date();
    }

    /**
     * Record user's answer for a question
     * @param {number} questionIndex - The index of the question (0-based)
     * @param {number|number[]} answer - The ID of the selected option or array of IDs for multiple selection
     */
    recordAnswer(questionIndex, answer) {
        this.userAnswers.set(questionIndex, answer);
    }

    /**
     * Toggle selection of an option for multiple-choice questions
     * @param {number} questionIndex - The index of the question (0-based)
     * @param {number} optionId - The ID of the option to toggle
     */
    toggleAnswer(questionIndex, optionId) {
        const currentAnswer = this.userAnswers.get(questionIndex);

        if (Array.isArray(currentAnswer)) {
            // Multiple selection question - toggle the option
            const index = currentAnswer.indexOf(optionId);
            if (index > -1) {
                // Remove if already selected
                const newAnswer = currentAnswer.filter(id => id !== optionId);
                if (newAnswer.length > 0) {
                    this.userAnswers.set(questionIndex, newAnswer);
                } else {
                    this.userAnswers.delete(questionIndex);
                }
            } else {
                // Add if not selected
                this.userAnswers.set(questionIndex, [...currentAnswer, optionId]);
            }
        } else {
            // Single selection question or first selection for multiple choice
            const question = this.getCurrentQuestion();
            if (question && this.isMultipleChoiceQuestion(question)) {
                // Convert to array for multiple choice
                if (currentAnswer === optionId) {
                    // Deselect if clicking the same option
                    this.userAnswers.delete(questionIndex);
                } else if (currentAnswer) {
                    // Add to existing selection
                    this.userAnswers.set(questionIndex, [currentAnswer, optionId]);
                } else {
                    // First selection
                    this.userAnswers.set(questionIndex, [optionId]);
                }
            } else {
                // Single selection question
                if (currentAnswer === optionId) {
                    // Deselect if clicking the same option
                    this.userAnswers.delete(questionIndex);
                } else {
                    // Select new option
                    this.userAnswers.set(questionIndex, optionId);
                }
            }
        }
    }

    /**
     * Check if a question requires multiple selections
     * @param {Object} question - The question object
     * @returns {boolean} True if question requires multiple selections
     */
    isMultipleChoiceQuestion(question) {
        return question &&
               question.computed_correct_option_ids &&
               Array.isArray(question.computed_correct_option_ids) &&
               question.computed_correct_option_ids.length > 1;
    }

    /**
     * Move to the next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < 23) {
            this.currentQuestionIndex++;
        }
    }

    /**
     * Move to the previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    /**
     * Check if we can go to the previous question
     * @returns {boolean} True if not on the first question
     */
    canGoPrevious() {
        return this.currentQuestionIndex > 0;
    }
     * @returns {boolean} True if all 24 questions have been answered
     */
    isComplete() {
        return this.currentQuestionIndex >= 23 && this.userAnswers.has(23);
    }

    /**
     * Reset the quiz session to initial state
     */
    reset() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
    }

    /**
     * Get the current question
     * @returns {Object|null} The current question object or null if no quiz loaded
     */
    getCurrentQuestion() {
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            return null;
        }
        return this.currentQuiz.questions[this.currentQuestionIndex];
    }

    /**
     * Get user's answer for a specific question
     * @param {number} questionIndex - The index of the question
     * @returns {number|number[]|null} The selected option ID(s) or null if not answered
     */
    getUserAnswer(questionIndex) {
        return this.userAnswers.get(questionIndex) || null;
    }

    /**
     * Check if an option is selected for a question
     * @param {number} questionIndex - The index of the question
     * @param {number} optionId - The ID of the option to check
     * @returns {boolean} True if the option is selected
     */
    isOptionSelected(questionIndex, optionId) {
        const answer = this.userAnswers.get(questionIndex);
        if (Array.isArray(answer)) {
            return answer.includes(optionId);
        }
        return answer === optionId;
    }

    /**
     * Check if current question has been answered
     * @returns {boolean} True if current question has an answer
     */
    hasCurrentAnswer() {
        return this.userAnswers.has(this.currentQuestionIndex);
    }

    /**
     * Get total number of questions in current quiz
     * @returns {number} Total questions (should be 24)
     */
    getTotalQuestions() {
        return this.currentQuiz ? this.currentQuiz.questions.length : 0;
    }

    /**
     * Get session data for results calculation
     * @returns {Object} Session object with quiz, userAnswers, username, and timing
     */
    getSession() {
        return {
            quiz: this.currentQuiz,
            userAnswers: this.userAnswers,
            username: this.currentUser,
            startTime: this.startTime,
            endTime: new Date()
        };
    }

    /**
     * Get time taken for current quiz session in seconds
     * @returns {number} Time taken in seconds, or 0 if no quiz started
     */
    getTimeTaken() {
        if (!this.startTime) {
            return 0;
        }
        const endTime = new Date();
        return Math.floor((endTime - this.startTime) / 1000);
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if a user is set
     */
    isUserLoggedIn() {
        return this.currentUser !== null && this.currentUser !== '';
    }

    /**
     * Clear user session (logout)
     */
    clearUser() {
        this.currentUser = null;
        this.reset();
    }

    /**
     * Get quiz attempt data formatted for database storage
     * @param {Object} results - Quiz results from results calculator
     * @returns {Object} Quiz attempt object ready for database storage
     */
    getQuizAttemptData(results) {
        if (!this.currentUser || !this.currentQuiz) {
            throw new Error('Cannot create quiz attempt: Missing user or quiz data');
        }

        return {
            username: this.currentUser,
            quizId: this.currentQuiz.id,
            quizName: this.currentQuiz.name,
            score: results.correctCount,
            totalQuestions: results.totalQuestions,
            percentage: results.percentage,
            passed: results.passed,
            completedAt: new Date(),
            timeTaken: this.getTimeTaken(),
            answers: JSON.stringify(Array.from(this.userAnswers.entries()))
        };
    }
}

// Export for use in other modules
window.StateManager = StateManager;
