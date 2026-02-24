# Britizen Quiz Application

A comprehensive quiz application with server-side SQLite database for storing user progress and quiz attempts. Features 102 Life in the UK practice tests with detailed explanations and progress tracking.

## Features

- Server-side SQLite database for persistent data storage
- RESTful API for database operations
- User progress tracking and quiz attempt history
- Score calculation and statistics
- 102 comprehensive Life in the UK practice tests
- Detailed explanations for each question
- Docker support for easy deployment
- Responsive web interface

## Setup Instructions

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### Docker Deployment

#### Using Docker Compose (Recommended)

1. Build and start the application:
```bash
docker-compose -f docker/compose.yml up -d
```

2. The application will be available at:
```
http://localhost:3000
```

3. To stop the application:
```bash
docker-compose -f docker/compose.yml down
```

#### Using Docker directly

1. Build the Docker image:
```bash
docker build -f docker/Dockerfile -t britizen-quiz .
```

2. Run the container:
```bash
docker run -d -p 3000:3000 -v quiz-data:/app/data --name britizen-quiz britizen-quiz
```

3. Stop the container:
```bash
docker stop britizen-quiz
docker rm britizen-quiz
```

## Project Structure

```
├── index.html                    # Main HTML file
├── server.js                     # Express server with API endpoints
├── package.json                  # Node.js dependencies and scripts
├── quiz_database.db              # SQLite database (created automatically)
├── docker/                       # Docker configuration files
│   ├── Dockerfile                # Docker container configuration
│   ├── compose.yml               # Docker Compose configuration
│   └── .dockerignore             # Docker ignore file
└── src/
    ├── css/
    │   └── styles.css            # Application styles
    ├── js/                       # JavaScript modules
    │   ├── api-service.js        # API communication layer
    │   ├── app.js                # Main application logic
    │   ├── database-service.js   # Client-side API wrapper
    │   ├── progress-calculator.js # Progress calculation utilities
    │   ├── results-calculator.js # Results and scoring logic
    │   ├── state-manager.js      # Application state management
    │   ├── user-management.js    # User session management
    │   └── utils.js              # Utility functions
    └── quiz-data/                # Quiz JSON files (102 tests)
        ├── README.md             # Quiz data documentation
        ├── quiz-1.json           # Life in the UK Test 1
        ├── quiz-2.json           # Life in the UK Test 2
        ├── ...                   # Tests 3-101
        └── quiz-102.json         # Life in the UK Test 102
```

## API Endpoints

- `POST /api/quiz-attempts` - Save a quiz attempt
- `GET /api/quiz-history/:username/:quizId` - Get quiz history for a user and quiz
- `GET /api/best-score/:username/:quizId` - Get best score for a user and quiz
- `GET /api/quiz-statuses/:username` - Get all quiz statuses for a user
- `GET /api/users` - Get all users who have taken quizzes

## Database Schema

The SQLite database contains a single table `quiz_attempts` with the following structure:

```sql
CREATE TABLE quiz_attempts (
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
);
```

## Migration from Browser-side Database

This version replaces the previous browser-side SQL.js implementation with a server-side SQLite database. The API remains the same for the client-side code, but data is now persisted on the server.

## Development

- The server automatically creates the SQLite database file (`quiz_database.db`) on first run
- Static files are served from the root directory
- CORS is enabled for development
- Use `nodemon` for development to automatically restart the server on changes

## Docker Configuration

### Dockerfile Features
- Based on Node.js 18 Alpine Linux for minimal size
- Non-root user for security
- Health check endpoint
- Persistent data volume support
- Production-optimized dependencies

### Docker Compose Features
- Automatic container restart
- Health monitoring with curl
- Named volume for data persistence
- Environment variable configuration
- Port mapping (3000:3000)

### Data Persistence
The Docker setup includes a named volume `quiz-data` that persists the SQLite database and any other application data between container restarts.

## Environment Variables

- `NODE_ENV`: Set to 'production' in Docker
- `PORT`: Server port (default: 3000)

## Health Check

The application includes a health check endpoint that Docker uses to monitor container health:
- Endpoint: `http://localhost:3000`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
