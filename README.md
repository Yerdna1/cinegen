# CineGen

CineGen is a SaaS platform for creating long-form AI-generated videos with consistent characters, scenes, and dialogue. Users bring their own API keys for AI services and use a guided wizard to define their video project.

## Technology Stack

- **Frontend**: React with Tailwind CSS, React Router, React Context
- **Backend**: Node.js with Express, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with email/password
- **Real-time**: WebSocket for generation progress
- **External APIs**: Hailuo/Kling (video), NanoBanana (images), 11Labs (audio)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- API keys for: Hailuo/Kling, NanoBanana, 11Labs (user-provided)

## Quick Start

```bash
# Run the setup script
./init.sh

# Or run individual steps:
./init.sh setup    # Create env files, install deps, setup database
./init.sh start    # Start development servers only
```

## Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- WebSocket: ws://localhost:3001

## Project Structure

```
cinegen/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React Context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API service functions
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── backend/            # Node.js/Express backend
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── middleware/ # Express middleware
│   │   ├── services/   # Business logic
│   │   ├── utils/      # Utility functions
│   │   └── websocket/  # WebSocket handlers
│   └── prisma/         # Prisma schema and migrations
├── init.sh             # Development setup script
└── README.md           # This file
```

## Features

- User authentication (register, login, email verification, password reset)
- Character profile management with image upload
- Project wizard with 8 steps:
  1. Duration selection
  2. Genre selection
  3. Setting/time period description
  4. Character assignment
  5. Plot description
  6. Voice assignment
  7. Scene review and editing
  8. Generation confirmation
- AI-powered scene breakdown generation
- Image generation with character consistency
- Video clip generation from image pairs
- Audio dialogue generation
- Real-time generation progress
- Clip review and regeneration
- Video export (individual clips and full video)
- Admin dashboard with usage statistics

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRY=7d
PORT=3001
ENCRYPTION_KEY=...
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

## API Keys (User-provided)

Users configure their own API keys in the Settings page:
- **Hailuo/Kling**: For video generation
- **NanoBanana**: For image generation
- **11Labs**: For voice/audio generation

## License

Proprietary
