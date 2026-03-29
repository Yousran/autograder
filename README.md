# Autograder

A modern, full-featured automated grading and assessment platform built with cutting-edge web technologies. Create, manage, and administer online tests with automatic grading, real-time feedback, and AI-powered essay evaluation.

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.4.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

### Additional Technologies

- **Authentication**: Better Auth v1.4.19
- **Rich Text Editing**: Plate v52.0.11
- **File Uploads**: UploadThing v7.7.4
- **Internationalization**: next-intl v4.8.3
- **AI Integration**: OpenAI v6.27.0
- **State Management**: React Hooks
- **Styling**: TailwindCSS with Radix UI components
- **Testing**: Playwright v1.58.2

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

Make sure you have installed:
- **Node.js** version 18.x or higher
- **npm** or **pnpm** or **yarn**
- **PostgreSQL** 15+ (or use Docker Compose)
- **Docker** (optional, for running PostgreSQL via Docker Compose)
- **Cloudinary** account (for image uploads)
- **OpenAI** API key (for AI-powered grading)

### Installation Steps

1️⃣ **Clone Repository**
```bash
git clone https://github.com/username/autograder.git
cd autograder
```

2️⃣ **Install Dependencies**
```bash
npm install
```

3️⃣ **Setup Environment Variables**

Create a `.env` file in the project root and configure based on `.env.example`:

4️⃣ **Setup Database with Docker (Optional)**

If you don't have PostgreSQL installed locally, run:
```bash
docker compose up -d
```

5️⃣ **Run Database Migrations & Generate Prisma Client**
```bash
npx prisma migrate dev
```

The database will be set up and ready to use.

## Development

### Running in Development Mode

```bash
npm run dev
```

Server will run at: **http://localhost:3000**

The application will auto-reload as you make changes.

### Database Management

View and manage your database with Prisma Studio:
```bash
npx prisma studio
```

Prisma Studio will open at: **http://localhost:5555**

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI |

## Project Structure

```
autograder/
├── app/                      # Next.js app directory
│   ├── [locale]/            # Localized routes (i18n)
│   │   ├── layout.tsx       # Root layout with provider setup
│   │   ├── page.tsx         # Home page
│   │   ├── auth/            # Authentication pages (login, signup)
│   │   ├── join/            # Test joining interface
│   │   ├── profile/         # User profile management
│   │   └── test/            # Test taking and management
│   └── api/                 # Route handlers
│       ├── auth/            # Authentication endpoints
│       ├── tests/           # Test CRUD operations
│       ├── questions/       # Question management
│       ├── choices/         # Choice/option management
│       ├── answers/         # Student answer submission
│       ├── participants/    # Participant management
│       ├── profile/         # User profile endpoints
│       └── upload/          # File upload handling
│
├── components/              # React components
│   ├── ui/                 # Shadcn UI components
│   ├── custom/             # Custom application components
│   ├── reui/               # Re-exportable UI components
│   ├── theme-provider.tsx  # Theme context setup
│   └── ...                 # Editor components (Plate, etc.)
│
├── hooks/                   # Custom React hooks
│   ├── use-debounce.ts     # Debounce state updates
│   ├── use-file-upload.ts  # File upload management
│   ├── use-mounted.ts      # Mount detection for SSR
│   └── ...
│
├── lib/                     # Utility and business logic
│   ├── auth.ts             # Authentication setup
│   ├── auth-client.ts      # Client-side auth utilities
│   ├── dal.ts              # Data access layer
│   ├── prisma.ts           # Prisma singleton instance
│   ├── llm.ts              # AI/LLM integration
│   ├── schemas/            # Zod validation schemas
│   ├── permissions/        # Authorization logic
│   ├── graders/            # Auto-grading logic
│   └── generated/          # Generated Prisma types
│
├── prisma/                  # Database
│   ├── schema.prisma       # Prisma data model
│   └── migrations/         # Database migrations
│
├── i18n/                    # Internationalization
│   ├── request.ts          # i18n request handling
│   ├── routing.ts          # i18n routing config
│   ├── navigation.ts       # i18n navigation helpers
│   ├── en.json             # English translations
│   └── id.json             # Indonesian translations
│
├── messages/                # Translation files
│   ├── en.json
│   └── id.json
│
├── tests/                   # Playwright E2E tests
│   ├── auth.spec.ts        # Authentication tests
│   ├── create-test.spec.ts # Test creation tests
│   ├── join-test.spec.ts   # Test joining tests
│   └── ...
│
├── public/                  # Static assets
│
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # TailwindCSS configuration
├── prisma.config.ts        # Prisma configuration
└── playwright.config.ts    # Playwright configuration
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Register a new user |
| POST | `/api/auth/sign-in` | Sign in with credentials |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests` | List user's tests |
| POST | `/api/tests` | Create a new test |
| GET | `/api/tests/[id]` | Get test details |
| PATCH | `/api/tests/[id]` | Update test |
| DELETE | `/api/tests/[id]` | Delete test |
| GET | `/api/tests/[id]/participants` | Get test participants |
| POST | `/api/tests/[id]/publish` | Publish test for students |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions/[testId]` | Get test questions |
| POST | `/api/questions` | Create question |
| PATCH | `/api/questions/[id]` | Update question |
| DELETE | `/api/questions/[id]` | Delete question |
| POST | `/api/questions/[id]/reorder` | Reorder questions |

### Choices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/choices` | Create choice/option |
| PATCH | `/api/choices/[id]` | Update choice |
| DELETE | `/api/choices/[id]` | Delete choice |

### Answers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/answers` | Submit answer |
| GET | `/api/answers/[participantId]` | Get participant answers |
| PATCH | `/api/answers/[id]` | Update answer (for review) |

### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/participants/[testId]` | Get test participants |
| POST | `/api/participants/join` | Join test with code |
| GET | `/api/participants/[id]` | Get participant details |
| PATCH | `/api/participants/[id]` | Update participant status |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get current user profile |
| PATCH | `/api/profile` | Update user profile |
| DELETE | `/api/profile` | Delete account |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload files (images, documents) |

## Configuration

### Environment Variables

See `.env.example` for the complete configuration template. Below are the key environment variables:

| Variable | Description | Example |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_NAME` | Application display name | `"Autograder"` |
| `NODE_ENV` | Environment mode | `"development"` or `"production"` |
| `DATABASE_URL` | PostgreSQL database connection string (supports Neon) | `postgresql://user:pass@host:5432/db?schema=public` |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth authentication | Auto-generated or custom string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image storage | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | From Cloudinary dashboard |
| `OPENROUTER_API_KEY_1` | Primary OpenRouter API key for AI grading | `sk_or_...` |
| `OPENROUTER_API_KEY_2` | Backup OpenRouter API key for AI grading | `sk_or_...` |

### TypeScript Configuration

The project uses strict TypeScript with explicit type declarations. Key configurations in `tsconfig.json`:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- JSX: React Server Components compatible
- Path aliases configured for cleaner imports

### Database Configuration

Prisma is configured with:
- Provider: PostgreSQL
- Client output: `./lib/generated/prisma`
- Adapter: Native PostgreSQL driver via `@prisma/adapter-pg`
- Preview features: Interactive transactions, client extensions

## Testing

### Running E2E Tests

```bash
npm run test:e2e
```

Run tests with UI for better debugging:
```bash
npm run test:e2e:ui
```

Test files are located in `/tests` directory and cover:
- Authentication flows
- Test creation and management
- Question creation and editing
- Joining tests and answering questions
- Participant management
- Profile management

## Deployment

### Build for Production

```bash
npm run build
```

This command will automatically:
1. Deploy pending Prisma migrations
2. Generate Prisma Client
3. Build the Next.js application for production

### Start Production Server

```bash
npm start
```

Server will run in production mode at: **http://localhost:3000**

### Deploy to Cloud Platforms

Recommended platforms for deployment:
- **Vercel** (Native Next.js support, recommended)
- **Railway**
- **Render**
- **AWS App Runner**
- **Azure App Service**
- **DigitalOcean App Platform**

**Important:** Make sure all environment variables are set on your deployment platform before deploying.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://better-auth.com)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Playwright Testing](https://playwright.dev)
