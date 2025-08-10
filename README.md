# Fantasy Football Draft Assistant

A web-based application designed to assist fantasy football players during their drafts with two primary features: a mock draft simulator and a live draft aid.

## 🚀 Features

### ✅ Currently Implemented

#### **Mock Draft Simulator** 
- **Full Interactive Draft Experience**: Complete draft sessions with AI opponents
- **Smart AI Teams**: Balanced AI drafting strategy using expert rankings
- **Real-time Draft Board**: Live visualization of all picks across teams
- **Draft Controls**: 
  - **Skip to User Pick**: Fast-forward through AI picks to your turn
  - **Undo User Pick**: Revert your previous pick and all subsequent picks
  - **Auto Draft**: Let AI make picks for you automatically
- **Player Search & Filtering**: Advanced search by position, team, rankings
- **Your Team View**: Track your drafted players with roster management

#### **Draft Configuration** 
- **Scoring Systems**: Standard, PPR, Half-PPR support
- **Draft Types**: Snake and Linear draft formats
- **Team Count**: 4-32 teams supported
- **Customizable Rosters**: QB, RB, WR, TE, FLEX, K, D/ST, Bench positions
- **Draft Position**: Random or manual selection

#### **Player Rankings Database**
- **FantasyPros Integration**: Expert consensus rankings with 539+ players
- **Custom Rankings**: Proprietary algorithm with multiple data sources
- **Scoring-Aware Rankings**: Optimized rankings per scoring system
- **Full REST API**: Complete endpoints for player data access
- **Real-time Updates**: Live ranking adjustments during draft

#### **Advanced Features**
- **AI-Powered Recommendations**: Smart pick suggestions based on roster needs
- **Draft State Management**: Full undo/redo capabilities with state integrity
- **Performance Optimizations**: Fast AI picks with configurable delays
- **Responsive UI**: Mobile-friendly design with modern interface

### 🔄 Coming Soon
- Live Draft Aid for real-time assistance with external platforms
- Post-draft analysis and team grading
- Custom player notes and personal rankings
- Draft history and analytics

## 🛠 Tech Stack

- **Backend**: FastAPI (Python) with SQLAlchemy ORM
- **Database**: PostgreSQL with Alembic migrations
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Chakra UI with React Icons
- **State Management**: React Hooks with custom utilities
- **API Client**: Custom fetch-based service layer
- **Development**: Hot reloading, ESLint, TypeScript compilation
- **Architecture**: RESTful API with component-based frontend

## 📋 Prerequisites

- **Python 3.8+** (3.13 recommended)
- **Node.js 16+** (18+ recommended) 
- **PostgreSQL 12+** (for database)
- **npm** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fantasy-football-assistant
```

### 2. Database Setup

#### Install and Start PostgreSQL
```bash
# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# On Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
createdb fantasy_football
psql -d fantasy_football -c "CREATE USER fantasy_user WITH PASSWORD 'fantasy_password';"
psql -d fantasy_football -c "GRANT ALL PRIVILEGES ON DATABASE fantasy_football TO fantasy_user;"
```

### 3. Backend Setup

#### Create Virtual Environment
```bash
cd backend
python3 -m venv backend_venv
source backend_venv/bin/activate  # On Windows: backend_venv\Scripts\activate
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt  # (if exists)
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic python-dotenv
```

#### Run Database Migrations
```bash
alembic upgrade head
```

### 4. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../frontend  # From backend directory
```

#### Install Node Dependencies
```bash
npm install
```

#### Install Additional UI Dependencies
```bash
npm install react-icons --legacy-peer-deps  # If not already installed
```

## 🏃‍♂️ Running the Application

### Method 1: Run Both Servers Simultaneously

#### Terminal 1 - Start Backend Server
```bash
# From project root directory
cd backend
source backend_venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

The backend will start at: `http://localhost:8000`

#### Terminal 2 - Start Frontend Server
```bash
# From project root directory (or new terminal)
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

## 🎯 Using the Application

### Creating and Starting a Mock Draft

1. **Access the Application**: Open `http://localhost:3000`
2. **Configure Draft**: Set up your draft parameters:
   - **Teams**: Choose 4-32 teams (12 teams recommended)
   - **Scoring**: Standard, PPR, or Half-PPR
   - **Draft Type**: Snake (recommended) or Linear
   - **Roster**: Customize positions (QB, RB, WR, TE, FLEX, K, D/ST, Bench)
3. **Start Draft**: Click "Create Draft Session" then "Start Draft"

### Draft Controls

During the draft, you have three powerful controls:

#### **Skip to User Pick** ⏭️
- **When**: Available when it's an AI team's turn
- **Purpose**: Fast-forward through all AI picks until it's your turn
- **Usage**: Click when you want to skip the waiting and get to your pick quickly

#### **Undo User Pick** ↩️ 
- **When**: Available when it's your turn AND you've made at least one previous pick
- **Purpose**: Revert your last pick and all subsequent AI picks
- **Usage**: Use if you regret a pick or want to try a different strategy

#### **Auto Draft** ✏️
- **When**: Available anytime during an active draft
- **Purpose**: Let AI make picks for your team automatically
- **Usage**: Toggle on to enable automatic picking, toggle off to resume manual control

### Tips for Best Experience

- **Player Search**: Use the search box to filter by player name, position, or team
- **Rankings**: Players are sorted by expert consensus rankings for your scoring type
- **Your Team View**: Monitor your roster composition and remaining needs
- **Performance**: Auto Draft and Skip modes remove delays for faster drafts

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
│   │   ├── api/              # API route handlers
│   │   │   ├── custom_rankings.py
│   │   │   └── draft.py
│   │   ├── database/         # Database models and connection
│   │   │   ├── models.py
│   │   │   └── connection.py
│   │   ├── services/         # Business logic services
│   │   │   ├── draft_service.py
│   │   │   ├── draft_ai.py
│   │   │   └── draft_engine.py
│   │   ├── schemas/          # Pydantic models
│   │   │   ├── draft.py
│   │   │   └── custom_rankings.py
│   │   ├── data_import/      # Data import scripts
│   │   └── main.py           # FastAPI application
│   ├── alembic/             # Database migrations
│   ├── backend_venv/        # Virtual environment
│   └── alembic.ini          # Alembic configuration
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── draft/       # Draft interface components
│   │   │   └── player/      # Player-related components
│   │   ├── services/        # API client code
│   │   ├── types/           # TypeScript definitions
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main React component
│   ├── build/               # Production build
│   └── package.json
├── .env                     # Environment variables
├── CLAUDE.md               # Project instructions
├── PRD.md                  # Product requirements
└── README.md               # This file
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

#### Core API
- `GET /` - Root endpoint
- `GET /health` - Health check

#### Draft Management
- `POST /api/draft/` - Create new draft session
- `GET /api/draft/{draft_id}` - Get draft state
- `POST /api/draft/{draft_id}/start` - Start draft
- `POST /api/draft/{draft_id}/pick` - Make a pick
- `POST /api/draft/{draft_id}/ai-pick` - Make AI pick
- `POST /api/draft/{draft_id}/auto-draft-pick` - Make auto-draft pick
- `DELETE /api/draft/{draft_id}/undo-to-user-pick` - Undo user pick

#### Player Data
- `GET /custom-rankings/` - Get custom player rankings
- `GET /custom-rankings/positions/{position}` - Get players by position
- `GET /api/draft/{draft_id}/players` - Get available players for draft

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