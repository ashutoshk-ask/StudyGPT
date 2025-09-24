# SSC CGL Study Buddy - AI-Powered Exam Preparation

## Overview

This is an AI-powered study companion application specifically designed for SSC CGL (Staff Selection Commission Combined Graduate Level) examination preparation. The application provides comprehensive features including user authentication, subject-wise content organization, interactive quizzes, mock tests, progress tracking, AI-powered recommendations, and personalized study plans.

The system is built as a full-stack web application with a React frontend and Express.js backend, utilizing PostgreSQL for data persistence and OpenAI's GPT-5 for intelligent recommendations and study plan generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching, with React Hook Form for form state
- **UI Framework**: Shadcn/UI components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Validation**: Zod schemas for runtime type validation
- **Animations**: Framer Motion for smooth user interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the entire stack
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling and response formats

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL with connection pooling
- **Schema**: Comprehensive relational schema covering users, subjects, topics, questions, quizzes, mock tests, progress tracking, and AI recommendations
- **Migrations**: Drizzle Kit for database schema migrations and management

### AI Integration
- **Provider**: OpenAI GPT-5 for intelligent features
- **Use Cases**: 
  - Personalized study recommendations based on user performance
  - Weak topic analysis and identification
  - Custom study plan generation considering exam dates and available study time
  - Quiz explanation generation for detailed answer explanations
- **Data Processing**: Performance analytics to feed AI recommendation engine

### Authentication & Security
- **Strategy**: Passport.js with local username/password authentication
- **Password Security**: Scrypt hashing with random salt generation
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Route Protection**: Middleware-based authentication checks for protected routes

### Content Organization
- **Hierarchical Structure**: Subjects → Topics → Questions/Quizzes
- **Subject Coverage**: Mathematics, Reasoning, English, and General Studies
- **Assessment Types**: Topic-wise quizzes and full-length mock tests
- **Progress Tracking**: Granular tracking at subject, topic, and individual question levels

### Performance & Scalability
- **Query Optimization**: TanStack Query for client-side caching and background updates
- **Database Optimization**: Indexed queries and efficient relationship mapping with Drizzle ORM
- **Build System**: Vite for fast development and optimized production builds
- **Code Splitting**: Component-level splitting for optimal loading performance

## External Dependencies

### Core Infrastructure
- **Database**: Neon Database (PostgreSQL) for primary data storage
- **AI Services**: OpenAI API (GPT-5) for intelligent recommendations and content generation
- **Session Storage**: PostgreSQL-based session management

### Development & Build Tools
- **Build System**: Vite with TypeScript support and hot module replacement
- **Code Quality**: ESBuild for production bundling and optimization
- **Development Environment**: Replit-specific plugins for development experience

### UI Component Libraries
- **Component System**: Radix UI primitives for accessibility-first components
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with custom design system tokens

### Data & State Management
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **HTTP Client**: Native Fetch API with custom request handling
- **Form Handling**: React Hook Form with Zod validation schemas
- **Client State**: TanStack Query for server state synchronization

### Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Class Management**: clsx and class-variance-authority for conditional styling
- **Validation**: Zod for runtime type checking and validation
- **Routing**: Wouter for lightweight client-side routing