# Landuci Form

This is a form builder application that allows users to create and manage forms,
as well as collect and analyze submissions. It was built during a hackathon
using Convex and Tanstack Start. 

Most of the features were implemented by AI (thanks Sonnet and Copilot).

## Features

- User authentication and Organization management with Clerk
- Form creation and management
- AI chat assistant for form building
- Form submission handling
- History of form updates
- Basic analytics for form submissions
- Webhooks for form submissions
- SSR for improved performance and SEO

## Technologies Used

### Hackathon-Specific

- [Convex](https://convex.dev/) - Backend as a Service
- [Tanstack Start](https://tanstack.com/start/latest) - Fullstack React Framework
- [Railway](https://railway.app/) - Deployment platform
- [Sentry](https://sentry.io/) - Error tracking

### General

- [Clerk](https://clerk.com/) - User authentication and management
- [AI SDK](https://ai-sdk.dev/docs/introduction) - AI integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```bash
CONVEX_DEPLOYMENT=your-deployment
VITE_CONVEX_URL=your-convex-url
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
VITE_CONVEX_SITE=your-convex-site

# Optional: Sentry error tracking
VITE_SENTRY_DSN=your-sentry-dsn

# Convex variables (in the Convex dashboard)
CLERK_JWT_ISSUER=your-clerk-issuer
OPENROUTER_API_KEY=your-openrouter-api-key
RESEND_FROM=your-resend-from
RESEND_API_KEY=your-resend-api-key
SITE_URL=http://your-site-url
```

3. Run development server:
```bash
npm run dev
```

### Sentry Setup (Optional)

To enable error tracking with Sentry:

1. Create a Sentry account at [sentry.io](https://sentry.io/)
2. Create a new project for your application
3. Copy your DSN from the project settings
4. Add it to your `.env.local` file as `VITE_SENTRY_DSN`

Sentry will automatically:
- Capture client-side errors
- Track server-side errors
- Record performance metrics
- Provide session replay for debugging

## Things to Fix

- Mobile support
