/**
 * Progress Calculator Module
 * Calculates and formats quiz progress information
 */

class ProgressCalculator {
    /**
     * Calculate progress information for quiz navigation
     * @param {number} currentIndex - Current question index (0-based)
     * @param {number} total - Total number of questions
     * @returns {Object} Progress information with percentage and display string
     */
    static calculateProgress(currentIndex, total) {
        // Validate inputs
        if (!Number.isInteger(currentIndex) || currentIndex < 0) {
            throw new Error('Current index must be a non-negative integer');
        }

        if (!Number.isInteger(total) || total <= 0) {
            throw new Error('Total must be a positive integer');
        }

        if (currentIndex >= total) {
            throw new Error('Current index cannot be greater than or equal to total');
        }

        // Calculate percentage (current question number / total * 100)
        // Note: currentIndex is 0-based, so we add 1 for display purposes
        const currentQuestionNumber = currentIndex + 1;
        const percentage = Math.round((currentQuestionNumber / total) * 100);

        // Create display string in format "X of Y"
        const displayString = `${currentQuestionNumber} of ${total}`;

        return {
            percentage: percentage,
            displayString: displayString,
            currentQuestionNumber: currentQuestionNumber,
            totalQuestions: total
        };
    }

    /**
     * Get progress bar width as a percentage string for CSS
     * @param {number} currentIndex - Current question index (0-based)
     * @param {number} total - Total number of questions
     * @returns {string} Percentage string for CSS (e.g., "25%")
     */
    static getProgressBarWidth(currentIndex, total) {
        const progress = this.calculateProgress(currentIndex, total);
        return `${progress.percentage}%`;
    }

    /**
     * Check if quiz is at the beginning
     * @param {number} currentIndex - Current question index (0-based)
     * @returns {boolean} True if at first question
     */
    static isAtStart(currentIndex) {
        return currentIndex === 0;
    }

    /**
     * Check if quiz is at the end
     * @param {number} currentIndex - Current question index (0-based)
     * @param {number} total - Total number of questions
     * @returns {boolean} True if at last question
     */
    static isAtEnd(currentIndex, total) {
        return currentIndex === total - 1;
    }

    /**
     * Get progress information for display in UI components
     * @param {number} currentIndex - Current question index (0-based)
     * @param {number} total - Total number of questions
     * @returns {Object} Complete progress information for UI rendering
     */
    static getProgressInfo(currentIndex, total) {
        const progress = this.calculateProgress(currentIndex, total);

        return {
            ...progress,
            progressBarWidth: this.getProgressBarWidth(currentIndex, total),
            isAtStart: this.isAtStart(currentIndex),
            isAtEnd: this.isAtEnd(currentIndex, total)
        };
    }
}

// Export for use in other modules
window.ProgressCalculator = ProgressCalculator;
