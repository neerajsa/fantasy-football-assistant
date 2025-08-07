# Fantasy Football Assistant - Launch Instructions

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running and accessible
2. **Python Virtual Environment**: Project should have a `venv` directory with required packages installed
3. **Node.js**: Frontend requires Node.js and npm

## Launch Process

### Step 1: Kill Existing Processes (if needed)

```bash
# Kill any processes on port 3000 (frontend)
npx kill-port 3000

# Kill any existing backend/frontend processes
pkill -f "uvicorn" && pkill -f "npm start"
```

### Step 2: Start Backend Server

```bash
# Navigate to project root and activate virtual environment, then start backend
cd /Users/neerajsathe/Projects/Github/fantasy-football-assistant
. venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
```

**Backend will be available at:** http://localhost:8000

### Step 3: Start Frontend Server

```bash
# Navigate to frontend directory and start React app
cd /Users/neerajsathe/Projects/Github/fantasy-football-assistant/frontend
npm start
```

**Frontend will be available at:** http://localhost:3000

## Verification

1. **Backend API**: Visit http://localhost:8000/docs to see the FastAPI documentation
2. **Frontend App**: Visit http://localhost:3000 to access the React application
3. **Database Connection**: Backend logs should show successful database connections

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**: Use `npx kill-port 3000` to free the port
2. **Virtual environment not found**: Ensure you're in the correct project directory and `venv` exists
3. **Database connection errors**: Check PostgreSQL service and connection settings
4. **Python module not found**: Activate virtual environment with `. venv/bin/activate`

### Process Management

- Backend runs in background with `&` flag
- Frontend runs in foreground and shows live compilation status
- Use `Ctrl+C` to stop frontend server
- Use `pkill -f "uvicorn"` to stop backend server

## Development Notes

- Backend auto-reloads on code changes (--reload flag)
- Frontend auto-reloads on code changes (React development server)
- Database queries are logged in backend console
- TypeScript compilation results shown in frontend console

## Services Overview

- **Backend**: FastAPI server with SQLAlchemy ORM, Draft Engine, and AI services
- **Frontend**: React TypeScript application with Chakra UI components
- **Database**: PostgreSQL with player rankings and draft session data