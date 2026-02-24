/**
 * Results Calculator Module
 * Calculates quiz results and generates detailed reports
 */

class ResultsCalculator {
    /**
     * Calculate comprehensive quiz results from a completed session
     * @param {Object} session - Quiz session data containing quiz and user answers
     * @param {Object} session.quiz - The quiz data from API
     * @param {Map} session.userAnswers - Map of questionIndex -> selectedOptionId
     * @param {string} session.username - Username of the current user
     * @param {Date} session.startTime - When the quiz was started
     * @param {Date} session.endTime - When the quiz was completed
     * @returns {Object} Detailed results object
     */
    static async calculateResults(session) {
        if (!session || !session.quiz || !session.userAnswers) {
            throw new Error('Invalid session data provided');
        }

        if (!session.username) {
            throw new Error('Username is required for result calculation');
        }

        const { quiz, userAnswers, username, startTime, endTime } = session;
        const questions = quiz.questions;

        if (!questions || !Array.isArray(questions)) {
            throw new Error('Quiz data is missing questions');
        }

        // Calculate correct answers count
        let correctCount = 0;
        const questionResults = [];

        // Process each question to determine correctness and build detailed results
        for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
            const question = questions[questionIndex];
            const userAnswerId = userAnswers.get(questionIndex) || null;

            // Handle both single and multiple selection answers
            const userAnswerIds = Array.isArray(userAnswerId) ? userAnswerId : (userAnswerId !== null ? [userAnswerId] : []);

            // Find the user's selected option text(s)
            let userAnswerText = null;
            if (userAnswerIds.length > 0) {
                const selectedOptions = question.options.filter(opt => userAnswerIds.includes(opt.id));
                userAnswerText = selectedOptions.map(opt => opt.text).join(', ') || 'Invalid option(s) selected';
            }

            // Get correct answer information
            const correctAnswerIds = question.computed_correct_option_ids || [];
            const correctOptions = question.options.filter(opt =>
                correctAnswerIds.includes(opt.id)
            );
            const correctAnswerText = correctOptions.map(opt => opt.text).join(', ') || 'No correct answer defined';

            // Determine if user's answer is correct
            let isCorrect = false;
            if (userAnswerIds.length > 0 && correctAnswerIds.length > 0) {
                if (correctAnswerIds.length === 1) {
                    // Single correct answer - user must select exactly that one
                    isCorrect = userAnswerIds.length === 1 && userAnswerIds[0] === correctAnswerIds[0];
                } else {
                    // Multiple correct answers - user must select all and only the correct ones
                    isCorrect = userAnswerIds.length === correctAnswerIds.length &&
                               userAnswerIds.every(id => correctAnswerIds.includes(id)) &&
                               correctAnswerIds.every(id => userAnswerIds.includes(id));
                }
            }

            if (isCorrect) {
                correctCount++;
            }

            // Build question result object
            questionResults.push({
                questionIndex: questionIndex,
                questionText: question.text || 'Question text unavailable',
                userAnswerId: userAnswerId, // Keep original format for compatibility
                userAnswerIds: userAnswerIds, // Add array format for multiple selections
                userAnswerText: userAnswerText || 'No answer selected',
                correctAnswerIds: correctAnswerIds,
                correctAnswerText: correctAnswerText,
                isCorrect: isCorrect,
                explanation: question.explanation || 'No explanation available'
            });
        }

        // Calculate percentage and pass/fail status
        const totalQuestions = questions.length;
        const incorrectCount = totalQuestions - correctCount;
        const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        // Handle passmark - it can be either a number of correct answers required or a percentage
        let passmarkScore, passmarkPercentage;
        if (quiz.passmark) {
            if (quiz.passmark <= totalQuestions) {
                // Passmark is number of correct answers required (e.g., 18 out of 24)
                passmarkScore = quiz.passmark;
                passmarkPercentage = Math.round((passmarkScore / totalQuestions) * 100);
            } else {
                // Passmark is a percentage (e.g., 75)
                passmarkPercentage = quiz.passmark;
                passmarkScore = Math.ceil((passmarkPercentage / 100) * totalQuestions);
            }
        } else {
            // Default to 75% if not specified
            passmarkPercentage = 75;
            passmarkScore = Math.ceil((passmarkPercentage / 100) * totalQuestions);
        }

        const passed = correctCount >= passmarkScore;

        // Calculate time taken in seconds
        const timeTaken = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

        // Create comprehensive results object
        const results = {
            quizName: quiz.name || `Quiz ${quiz.id}`,
            totalQuestions: totalQuestions,
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            percentage: percentage,
            passed: passed,
            passmark: passmarkPercentage, // Show as percentage for display
            passmarkScore: passmarkScore, // Number of correct answers needed
            questionResults: questionResults,
            username: username,
            timeTaken: timeTaken
        };

        // Save quiz attempt to database
        try {
            await this.saveQuizAttempt(results, quiz, userAnswers, startTime, endTime);
        } catch (error) {
            console.error('Failed to save quiz attempt to database:', error);
            // Don't throw error - results calculation should still succeed even if database save fails
        }

        return results;
    }

    /**
     * Utility method to get a summary string of results
     * @param {Object} results - Results object from calculateResults
     * @returns {string} Human-readable summary
     */
    static getResultsSummary(results) {
        const status = results.passed ? 'PASSED' : 'FAILED';
        return `${status}: ${results.correctCount}/${results.totalQuestions} correct (${results.percentage}%)`;
    }

    /**
     * Save quiz attempt to database
     * @param {Object} results - Calculated results object
     * @param {Object} quiz - Quiz data from API
     * @param {Map} userAnswers - User's answers map
     * @param {Date} startTime - Quiz start time
     * @param {Date} endTime - Quiz end time
     */
    static async saveQuizAttempt(results, quiz, userAnswers, startTime, endTime) {
        // Ensure database service is available and initialized
        if (!window.databaseService) {
            throw new Error('Database service not available');
        }

        if (!window.databaseService.isInitialized) {
            await window.databaseService.initialize();
        }

        // Create quiz attempt object for database storage
        const quizAttempt = {
            username: results.username,
            quizId: quiz.id,
            quizName: quiz.name || `Quiz ${quiz.id}`,
            score: results.correctCount,
            totalQuestions: results.totalQuestions,
            percentage: results.percentage,
            passed: results.passed,
            completedAt: endTime || new Date(),
            timeTaken: results.timeTaken,
            answers: JSON.stringify(Array.from(userAnswers.entries()))
        };

        // Save to database
        await window.databaseService.saveQuizAttempt(quizAttempt);
    }

    /**
     * Utility method to validate session data before calculation
     * @param {Object} session - Session data to validate
     * @returns {boolean} True if session is valid for calculation
     */
    static isValidSession(session) {
        return session &&
               session.quiz &&
               session.userAnswers &&
               session.username &&
               session.quiz.questions &&
               Array.isArray(session.quiz.questions) &&
               session.quiz.questions.length > 0;
    }
}

// Export for use in other modules
window.ResultsCalculator = ResultsCalculator;
