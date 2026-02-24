const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Initialize SQLite database
// Support DATABASE_PATH for Home Assistant, fallback to DB_PATH for backward compatibility
const dbPath = process.env.DATABASE_PATH || process.env.DB_PATH || './quiz_database.db';
console.log(`Attempting to open database at: ${dbPath}`);
console.log(`Current working directory: ${process.cwd()}`);

// Check if directory exists and is writable
const dbDir = path.dirname(dbPath);
try {
    if (!fs.existsSync(dbDir)) {
        console.log(`Creating directory: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
    }
    console.log(`Directory ${dbDir} exists and is accessible`);
} catch (error) {
    console.error(`Error with directory ${dbDir}:`, error.message);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        console.error('Database path:', dbPath);
        console.error('Directory exists:', fs.existsSync(dbDir));
        console.error('Directory permissions:', fs.statSync(dbDir).mode.toString(8));
    } else {
        console.log(`Database connected at: ${dbPath}`);
        initializeDatabase();
    }
});

// Create database schema
function initializeDatabase() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            quizId INTEGER NOT NULL,
            quizName TEXT NOT NULL,
            score INTEGER NOT NULL,
            totalQuestions INTEGER NOT NULL,
            percentage REAL NOT NULL,
            passed BOOLEAN NOT NULL,
            completedAt TEXT NOT NULL,
            timeTaken INTEGER NOT NULL,
            answers TEXT NOT NULL
        )
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            // Create indexes for better query performance
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_username ON quiz_attempts(username)',
                'CREATE INDEX IF NOT EXISTS idx_quiz_id ON quiz_attempts(quizId)',
                'CREATE INDEX IF NOT EXISTS idx_username_quiz ON quiz_attempts(username, quizId)',
                'CREATE INDEX IF NOT EXISTS idx_completed_at ON quiz_attempts(completedAt)'
            ];

            indexes.forEach(indexSQL => {
                db.run(indexSQL, (err) => {
                    if (err) {
                        console.error('Error creating index:', err.message);
                    }
                });
            });
        }
    });
}

// API Routes

// Save quiz attempt
app.post('/api/quiz-attempts', (req, res) => {
    const { username, quizId, quizName, score, totalQuestions, percentage, passed, completedAt, timeTaken, answers } = req.body;

    const insertSQL = `
        INSERT INTO quiz_attempts
        (username, quizId, quizName, score, totalQuestions, percentage, passed, completedAt, timeTaken, answers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertSQL, [
        username,
        quizId,
        quizName,
        score,
        totalQuestions,
        percentage,
        passed ? 1 : 0,
        completedAt,
        timeTaken,
        JSON.stringify(answers)
    ], function(err) {
        if (err) {
            console.error('Error saving quiz attempt:', err.message);
            res.status(500).json({ error: 'Failed to save quiz attempt' });
        } else {
            res.json({ id: this.lastID, message: 'Quiz attempt saved successfully' });
        }
    });
});

// Get quiz history for a user and quiz
app.get('/api/quiz-history/:username/:quizId', (req, res) => {
    const { username, quizId } = req.params;

    const selectSQL = `
        SELECT * FROM quiz_attempts
        WHERE username = ? AND quizId = ?
        ORDER BY completedAt DESC
    `;

    db.all(selectSQL, [username, quizId], (err, rows) => {
        if (err) {
            console.error('Error fetching quiz history:', err.message);
            res.status(500).json({ error: 'Failed to fetch quiz history' });
        } else {
            const results = rows.map(row => ({
                id: row.id,
                username: row.username,
                quizId: row.quizId,
                quizName: row.quizName,
                score: row.score,
                totalQuestions: row.totalQuestions,
                percentage: row.percentage,
                passed: row.passed === 1,
                completedAt: new Date(row.completedAt),
                timeTaken: row.timeTaken,
                answers: JSON.parse(row.answers)
            }));
            res.json(results);
        }
    });
});

// Get best score for a user and quiz
app.get('/api/best-score/:username/:quizId', (req, res) => {
    const { username, quizId } = req.params;

    const selectSQL = `
        SELECT MAX(score) as bestScore
        FROM quiz_attempts
        WHERE username = ? AND quizId = ?
    `;

    db.get(selectSQL, [username, quizId], (err, row) => {
        if (err) {
            console.error('Error fetching best score:', err.message);
            res.status(500).json({ error: 'Failed to fetch best score' });
        } else {
            res.json({ bestScore: row ? row.bestScore : null });
        }
    });
});

// Get all quiz statuses for a user (optimized with single query)
app.get('/api/quiz-statuses/:username', (req, res) => {
    const { username } = req.params;

    // Optimized single query using window functions
    const selectSQL = `
        SELECT
            quizId,
            MAX(quizName) as quizName,
            COUNT(*) as totalAttempts,
            MAX(score) as bestScore,
            MAX(percentage) as bestPercentage,
            MAX(completedAt) as lastAttemptDate,
            (
                SELECT passed
                FROM quiz_attempts qa2
                WHERE qa2.username = qa1.username
                AND qa2.quizId = qa1.quizId
                ORDER BY qa2.completedAt DESC
                LIMIT 1
            ) as lastAttemptPassed
        FROM quiz_attempts qa1
        WHERE username = ?
        GROUP BY quizId
    `;

    db.all(selectSQL, [username], (err, rows) => {
        if (err) {
            console.error('Error fetching quiz statuses:', err.message);
            res.status(500).json({ error: 'Failed to fetch quiz statuses' });
        } else {
            const statuses = rows.map(row => ({
                quizId: row.quizId,
                quizName: row.quizName,
                isCompleted: true,
                bestScore: row.bestScore,
                bestPercentage: row.bestPercentage,
                totalAttempts: row.totalAttempts,
                lastAttemptDate: new Date(row.lastAttemptDate),
                lastAttemptPassed: row.lastAttemptPassed === 1
            }));

            res.json(statuses);
        }
    });
});

// Get all users
app.get('/api/users', (req, res) => {
    const selectSQL = `
        SELECT
            username,
            COUNT(*) as totalAttempts,
            COUNT(DISTINCT quizId) as quizzesCompleted,
            MAX(completedAt) as lastActivity,
            AVG(percentage) as averageScore
        FROM quiz_attempts
        GROUP BY username
        ORDER BY lastActivity DESC
    `;

    db.all(selectSQL, [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err.message);
            res.status(500).json({ error: 'Failed to fetch users' });
        } else {
            const users = rows.map(row => ({
                username: row.username,
                totalAttempts: row.totalAttempts,
                quizzesCompleted: row.quizzesCompleted,
                lastActivity: new Date(row.lastActivity),
                averageScore: Math.round(row.averageScore)
            }));
            res.json(users);
        }
    });
});

// Delete user and all their quiz attempts
app.delete('/api/users/:username', (req, res) => {
    const { username } = req.params;

    const deleteSQL = `DELETE FROM quiz_attempts WHERE username = ?`;

    db.run(deleteSQL, [username], function(err) {
        if (err) {
            console.error('Error deleting user:', err.message);
            res.status(500).json({ error: 'Failed to delete user' });
        } else {
            if (this.changes > 0) {
                res.json({
                    message: 'User deleted successfully',
                    deletedRecords: this.changes
                });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        }
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        process.exit(0);
    });
});
