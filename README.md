# MessMate - Mess Management System

A full-stack MERN application for managing shared household expenses with sophisticated split logic, role-based access control, and multi-mess support.

## Project Structure

```
messmate/
├── backend/          # Node.js/Express/TypeScript backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Utility functions
│   │   ├── app.ts        # Express app setup
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/         # React/TypeScript frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── store/        # Zustand stores
    │   ├── services/     # API services
    │   ├── hooks/        # Custom hooks
    │   ├── types/        # TypeScript types
    │   ├── utils/        # Utility functions
    │   ├── test/         # Test setup
    │   ├── App.tsx       # Root component
    │   └── main.tsx      # Entry point
    ├── package.json
    └── vite.config.ts
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express 4.x
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, cors, express-rate-limit
- **Testing**: Jest, fast-check (property-based testing)
- **Code Quality**: ESLint, Prettier

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS
- **Testing**: Vitest, Testing Library, fast-check

## Getting Started

### Prerequisites
- Node.js 18+ LTS
- MongoDB 6.x
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - Set MongoDB URI
   - Set JWT secrets (use strong random strings in production)
   - Configure other environment variables

5. Start development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Testing

Both backend and frontend include comprehensive testing setups:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and component interactions
- **Property-Based Tests**: Test universal properties using fast-check

Run tests with:
```bash
npm test
```

## Development Workflow

1. Follow the implementation plan in `.kiro/specs/mess-management-system/tasks.md`
2. Refer to requirements in `.kiro/specs/mess-management-system/requirements.md`
3. Follow design specifications in `.kiro/specs/mess-management-system/design.md`
4. Write tests for all new functionality
5. Ensure all tests pass before committing

## API Documentation

The backend exposes a REST API with the following main endpoints:

- `/health` - Health check endpoint
- `/api/auth` - Authentication endpoints
- `/api/messes` - Mess management
- `/api/expenses` - Expense management
- `/api/settlements` - Settlement management
- `/api/balances` - Balance queries
- `/api/dashboard` - Dashboard data
- `/api/activity-logs` - Activity logs

Detailed API documentation will be added as endpoints are implemented.

## Security Features

- Password hashing with bcrypt (cost factor 10)
- JWT-based authentication with refresh tokens
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Security headers with Helmet
- Input validation and sanitization
- CSRF protection

## License

ISC
