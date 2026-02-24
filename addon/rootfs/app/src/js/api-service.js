/**
 * API Service Module
 * Handles loading quiz data from local JSON files
 */

class APIService {
    constructor() {
        this.localDataPath = 'src/quiz-data';
        this.timeout = 5000; // 5 seconds timeout for local file loading
        this.quizCache = new Map(); // Cache for loaded quizzes
        this.cacheTimeout = 300000; // 5 minutes cache timeout
    }

    /**
     * Validate quiz ID is within acceptable range
     * @param {number} quizId - The quiz ID to validate
     * @throws {Error} If quiz ID is invalid
     */
    validateQuizId(quizId) {
        if (!Number.isInteger(quizId) || quizId < 1 || quizId > 102) {
            throw new Error('Quiz ID must be an integer between 1 and 102');
        }
    }

    /**
     * Fetch quiz data from local JSON files
     * @param {number} quizId - The ID of the quiz to fetch (1-102)
     * @returns {Promise<Object>} Promise that resolves to quiz data
     * @throws {Error} For validation errors, file loading errors, or data errors
     */
    async fetchQuiz(quizId) {
        // Validate quiz ID first
        this.validateQuizId(quizId);

        // Check cache first
        const cacheKey = `quiz_${quizId}`;
        const cached = this.quizCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const filePath = `${this.localDataPath}/quiz-${quizId}.json`;

        try {
            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(filePath, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            // Clear timeout if request completes
            clearTimeout(timeoutId);

            // Check if response is ok
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Quiz file for ID ${quizId} not found. Make sure quiz-${quizId}.json exists in the quiz-data folder.`);
                } else {
                    throw new Error(`Error loading quiz file: ${response.status}`);
                }
            }

            // Parse JSON response
            const quizData = await response.json();

            // Validate that we received valid quiz data
            if (!quizData || typeof quizData !== 'object') {
                throw new Error('Invalid quiz data in local file');
            }

            // Validate essential quiz properties
            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                throw new Error('Quiz data is missing questions');
            }

            if (quizData.questions.length === 0) {
                throw new Error('Quiz contains no questions');
            }

            // Cache the quiz data
            this.quizCache.set(cacheKey, {
                data: quizData,
                timestamp: Date.now()
            });

            // Limit cache size to prevent memory issues
            if (this.quizCache.size > 10) {
                const oldestKey = this.quizCache.keys().next().value;
                this.quizCache.delete(oldestKey);
            }

            return quizData;

        } catch (error) {
            // Handle different types of errors
            if (error.name === 'AbortError') {
                throw new Error('File loading timed out. Please try again.');
            } else if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Error loading local quiz file. Make sure the quiz-data folder exists.');
            } else if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in quiz file for ID ${quizId}`);
            } else {
                // Re-throw other errors (including our custom validation errors)
                throw error;
            }
        }
    }

    /**
     * Check if local quiz data is available (optional utility method)
     * @returns {Promise<boolean>} True if local quiz data is accessible
     */
    async isLocalDataAvailable() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            // Test if we can load quiz 1 as a connectivity check
            const response = await fetch(`${this.localDataPath}/quiz-1.json`, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get list of available quiz IDs from local data
     * @returns {Promise<number[]>} Array of available quiz IDs
     */
    async getAvailableQuizIds() {
        const availableIds = [];

        for (let i = 1; i <= 102; i++) {
            try {
                const response = await fetch(`${this.localDataPath}/quiz-${i}.json`, {
                    method: 'HEAD'
                });
                if (response.ok) {
                    availableIds.push(i);
                }
            } catch (error) {
                // Skip unavailable quizzes
                continue;
            }
        }

        return availableIds;
    }

    /**
     * Clear the quiz cache
     * @param {number} quizId - Optional specific quiz ID to clear, or clear all if not provided
     */
    clearCache(quizId = null) {
        if (quizId) {
            this.quizCache.delete(`quiz_${quizId}`);
        } else {
            this.quizCache.clear();
        }
    }

    /**
     * Get cache statistics for debugging
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.quizCache.size,
            keys: Array.from(this.quizCache.keys())
        };
    }
}

// Export for use in other modules
window.APIService = APIService;
