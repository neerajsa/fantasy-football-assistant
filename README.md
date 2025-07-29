# Fantasy Football Draft Assistant

A web-based application designed to assist fantasy football players during their drafts with two primary features: a mock draft simulator and a live draft aid.

## 🚀 Features

### ✅ Currently Implemented
- **Draft Configuration**: Complete setup for draft parameters including:
  - Scoring systems (Standard, PPR, Half-PPR)
  - Draft types (Snake, Linear)
  - Team count (4-32 teams)
  - Customizable roster positions (QB, RB, WR, TE, FLEX, K, D/ST, Bench)
  - Random or manual draft position selection

- **Player Rankings Database**: Two comprehensive ranking systems:
  - **FantasyPros Integration**: Expert consensus rankings with 539+ players
  - **Custom Rankings**: Proprietary algorithm combining multiple data sources
  - **API Endpoints**: Full REST API for accessing player rankings
  - **Multiple Scoring Types**: Support for Standard, PPR, and Half-PPR

### 🔄 Coming Soon
- Mock Draft Simulator with AI opponents
- Live Draft Aid for real-time assistance
- AI-powered player recommendations
- Post-draft analysis and team grading
- Player ranking system with data aggregation

## 🛠 Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React with TypeScript
- **UI Framework**: Chakra UI
- **Development**: Hot reloading for both frontend and backend

## 📋 Prerequisites

- Python 3.8+ 
- Node.js 14+
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fantasy-football-assistant
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Node Dependencies
```bash
npm install
```

## 🏃‍♂️ Running the Application

### Method 1: Run Both Servers Simultaneously

#### Terminal 1 - Start Backend Server
```bash
# From project root directory
source venv/bin/activate
cd backend
python run.py
```

The backend will start at: `http://localhost:8000`

#### Terminal 2 - Start Frontend Server
```bash
# From project root directory
cd frontend
npm start
```

The frontend will start at: `http://localhost:3000`

### Method 2: Background Process (Alternative)

#### Start Backend in Background
```bash
source venv/bin/activate && cd backend && python run.py &
```

#### Start Frontend
```bash
cd frontend && BROWSER=none npm start &
```

**Note**: The frontend takes 30-60 seconds to fully compile and start. Wait for the "Compiled successfully!" message before accessing the application.

## 📊 Database Management

### Updating Player Rankings

The application includes scripts for updating both FantasyPros and custom rankings databases:

```bash
# Update custom rankings only
python -m app.scripts.update_rankings custom

# Update both databases  
python -m app.scripts.update_rankings both

# For detailed instructions
cat app/scripts/README.md
```

### Individual Data Import Scripts

```bash
# Import FantasyPros CSV data
python -m app.data_import.csv_importer

# Update FantasyPros database structure
python -m app.data_import.update_database_structure

# Generate custom rankings
python -m app.data_import.custom_ranking_algorithm
```

### API Endpoints for Rankings

```bash
# Get custom rankings
curl "http://localhost:8000/custom-rankings/?limit=10"

# Get rankings by position
curl "http://localhost:8000/custom-rankings/positions/QB"

# Compare custom vs FantasyPros
curl "http://localhost:8000/custom-rankings/compare"

# Database statistics
curl "http://localhost:8000/custom-rankings/stats"
```

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables (defined in `.env`):

```bash
ENVIRONMENT=development
API_HOST=localhost
API_PORT=8000
FRONTEND_URL=http://localhost:3000
```

### API Configuration

The frontend automatically connects to the backend API. If you need to change the API URL, set:

```bash
REACT_APP_API_URL=http://localhost:8000
```

## 🧪 Testing the Application

### 1. Verify Backend is Running
```bash
curl http://localhost:8000/health
# Expected response: {"status":"healthy"}
```

### 2. Test API Endpoints
```bash
# Get API documentation
curl http://localhost:8000/docs

# Test draft configuration endpoint
curl -X POST http://localhost:8000/api/draft-config/ \
  -H "Content-Type: application/json" \
  -d '{
    "scoring_type": "ppr",
    "draft_type": "snake",
    "num_teams": 12,
    "roster_positions": {
      "qb": 1, "rb": 2, "wr": 2, "te": 1,
      "flex": 1, "k": 1, "dst": 1, "bench": 6
    }
  }'
```

### 3. Access Frontend
Open your browser and navigate to: `http://localhost:3000`

You should see the Fantasy Football Draft Assistant with a working draft configuration form.

## 📁 Project Structure

```
fantasy-football-assistant/
├── backend/
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── schemas/      # Pydantic models
│   │   └── main.py       # FastAPI application
│   └── run.py           # Development server
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API client code
│   │   ├── types/       # TypeScript definitions
│   │   └── App.tsx      # Main React component
│   └── package.json
├── requirements.txt     # Python dependencies
├── .env                # Environment variables
├── PLAN.md             # Development roadmap
├── PRD.md              # Product requirements
└── README.md           # This file
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Backend Not Starting
- Ensure virtual environment is activated: `source venv/bin/activate`
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install -r requirements.txt`

#### 2. Frontend Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 14+)

#### 3. CORS Issues
- Ensure backend is running on port 8000
- Check `.env` file has correct `FRONTEND_URL=http://localhost:3000`

#### 4. API Connection Failed
- Verify backend health: `curl http://localhost:8000/health`
- Check console for network errors in browser dev tools

### Port Conflicts

If ports 3000 or 8000 are in use:

**Backend**: Change `API_PORT` in `.env` file
**Frontend**: React will prompt to use a different port automatically

## 🚦 API Documentation

When the backend is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Available Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/draft-config/` - Create draft configuration
- `GET /api/draft-config/{id}` - Get draft configuration
- `GET /api/draft-config/` - List all configurations

## 🔄 Development Workflow

1. Make changes to backend code in `backend/app/`
2. FastAPI will automatically reload (hot reload enabled)
3. Make changes to frontend code in `frontend/src/`
4. React will automatically refresh the browser
5. Test changes at `http://localhost:3000`

## 📝 Next Steps

See `PLAN.md` for the complete development roadmap. The next phase will implement:
- Player data foundation
- Mock draft simulator core
- AI recommendations system

## 🤝 Contributing

1. Follow the existing code structure and conventions
2. Ensure both backend and frontend tests pass
3. Update documentation for new features
4. Follow the development phases outlined in `PLAN.md`

---

**Happy Drafting! 🏈**