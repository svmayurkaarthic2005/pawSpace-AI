# PawSpace 🐾

AI-powered pet social networking app that connects pet owners and their furry friends.

## 🏗️ Project Structure

This is a monorepo containing:

- **`apps/backend`** - Node.js/Express backend API with Socket.IO for real-time features
- **`apps/mobile`** - React Native mobile application (iOS & Android)
- **`packages/*`** - Shared packages and utilities

## ✨ Features

- 🤖 AI-powered pet assistant and smart search
- 📱 Social feed for pets with posts, comments, and likes
- 💬 Real-time chat messaging with Socket.IO
- 🗺️ Map-based discovery of nearby pets and events
- 👥 Communities for pet owners
- 📅 Pet events and meetups
- 🔔 Real-time push notifications
- 👤 User profiles and pet profiles
- 🔍 AI-enhanced explore and search functionality

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** and Docker Compose (for backend services)
- **React Native development environment** (for mobile)
  - Xcode (for iOS development)
  - Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pawspace
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Copy `apps/backend/.env.example` to `apps/backend/.env`
   - Copy `apps/mobile/.env.example` to `apps/mobile/.env`
   - Fill in the required values

### Running the Application

#### Backend

1. Start backend services (MongoDB, Redis):
```bash
npm run docker:up
```

2. Start the backend development server:
```bash
cd apps/backend
npm run dev
```

The backend API will be available at `http://localhost:3000`

#### Mobile

1. Start the Metro bundler:
```bash
cd apps/mobile
npm start
```

2. Run on iOS:
```bash
npm run ios
```

3. Run on Android:
```bash
npm run android
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: Firebase Auth, JWT
- **File Storage**: Cloudinary
- **AI**: Groq SDK for AI features

### Mobile
- **Framework**: React Native 0.73
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Yup validation
- **Maps**: React Native Maps with clustering
- **Real-time**: Socket.IO Client
- **Authentication**: Firebase Auth
- **UI Components**: Custom components with Reanimated

## 📦 Available Scripts

### Root Level
- `npm run dev` - Run all apps in development mode (parallel)
- `npm run build` - Build all apps
- `npm run lint` - Lint all apps
- `npm run type-check` - Type check all apps
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run docker:logs` - View Docker logs

### Backend (`apps/backend`)
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Lint backend code
- `npm run type-check` - Type check without emitting

### Mobile (`apps/mobile`)
- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Lint mobile code
- `npm run type-check` - Type check without emitting

## 🔧 Configuration

### Backend Environment Variables

Key environment variables needed in `apps/backend/.env`:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - Secret for JWT tokens
- `FIREBASE_*` - Firebase Admin SDK credentials
- `CLOUDINARY_*` - Cloudinary credentials for image uploads
- `GROQ_API_KEY` - Groq API key for AI features
- `GOOGLE_MAPS_API_KEY` - Google Maps API key

### Mobile Environment Variables

Key environment variables needed in `apps/mobile/.env`:
- `API_URL` - Backend API URL
- `GOOGLE_MAPS_API_KEY` - Google Maps API key (Android)
- Firebase configuration values

## 🏛️ Architecture

### Backend Architecture
- **Controllers** - Handle HTTP requests and responses
- **Services** - Business logic layer
- **Repositories** - Data access layer
- **Models** - Mongoose schemas
- **Middleware** - Authentication, validation, error handling
- **Socket** - Real-time event handlers
- **Routes** - API endpoint definitions

### Mobile Architecture
- **Screens** - Main UI screens
- **Components** - Reusable UI components
- **Services** - API calls and external services
- **Hooks** - Custom React hooks
- **Store** - Zustand stores for global state
- **Navigation** - Navigation configuration
- **Utils** - Utility functions

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and type checking
4. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

Built with modern web and mobile technologies for connecting pet owners worldwide.
