/**
 * Database Service for Britizen Quiz Application
 * Handles database operations via REST API calls to the server
 */

class DatabaseService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.isInitialized = false;
    }

    /**
     * Initialize the database service
     * No longer needs to initialize SQL.js - just marks as ready
     */
    async initialize() {
        try {
            // Test server connection
            const response = await fetch(`${this.baseUrl}/api/users`);

            if (!response.ok && response.status !== 404) {
                throw new Error(`Server not responding: ${response.status}`);
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize database service:', error);
            throw error;
        }
    }

    /**
     * Save a quiz attempt to the database
     */
    async saveQuizAttempt(attempt) {
        if (!this.isInitialized) {
            throw new Error('Database service not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/quiz-attempts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: attempt.username,
                    quizId: attempt.quizId,
                    quizName: attempt.quizName,
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: attempt.percentage,
                    passed: attempt.passed,
                    completedAt: attempt.completedAt.toISOString(),
                    timeTaken: attempt.timeTaken,
                    answers: attempt.answers
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving quiz attempt:', error);
            throw error;
        }
    }

    /**
     * Get quiz history for a specific user and quiz
     */
    async getQuizHistory(username, quizId) {
        if (!this.isInitialized) {
            throw new Error('Database service not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/quiz-history/${encodeURIComponent(username)}/${quizId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching quiz history:', error);
            throw error;
        }
    }

    /**
     * Get the best score for a specific user and quiz
     */
    async getBestScore(username, quizId) {
        if (!this.isInitialized) {
            throw new Error('Database service not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/best-score/${encodeURIComponent(username)}/${quizId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.bestScore;
        } catch (error) {
            console.error('Error fetching best score:', error);
            throw error;
        }
    }

    /**
     * Get all quiz statuses for a user (with caching)
     */
    async getAllQuizStatuses(username) {
        if (!this.isInitialized) {
            throw new Error('Database service not initialized');
        }

        // Check cache first
        const cacheKey = `quiz_statuses_${username}`;
        const cached = this.getFromCache(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
            return cached.data;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/quiz-statuses/${encodeURIComponent(username)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching quiz statuses:', error);
            throw error;
        }
    }

    /**
     * Simple in-memory cache for API responses
     */
    getFromCache(key) {
        if (!this.cache) this.cache = new Map();
        return this.cache.get(key);
    }

    setCache(key, data) {
        if (!this.cache) this.cache = new Map();
        this.cache.set(key, { data, timestamp: Date.now() });

        // Limit cache size
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clearCache(pattern = null) {
        if (!this.cache) return;
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get all users who have taken quizzes
     */
    async getAllUsers() {
        if (!this.isInitialized) {
            return [];
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/users`);

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return [];
            }

            const users = await response.json();
            return users || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    /**
     * Delete a user and all their quiz attempts
     */
    async deleteUser(username) {
        if (!this.isInitialized) {
            throw new Error('Database service not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(username)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

}

// Create a singleton instance
const databaseService = new DatabaseService();

// Export for use in other modules
window.DatabaseService = DatabaseService;
window.databaseService = databaseService;
