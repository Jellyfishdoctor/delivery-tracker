# Delivery Tracker

A project delivery tracking application built for managing POC, Onboarding, and Production stage deliveries.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/delivery-tracker.git
   cd delivery-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set your `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Build and run with Docker Compose:

```bash
docker-compose up --build
```

### Or build manually:

```bash
docker build -t delivery-tracker .
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret-key \
  -e DATABASE_URL=file:/app/data/dev.db \
  delivery-tracker
```

## Features

- User authentication (register/login)
- Create and manage project entries
- Track project stages (POC, Onboarding, Production)
- Priority and status management
- Analytics dashboard with charts
- Audit log for tracking changes
- CSV export

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth pages (login, register)
│   ├── (dashboard)/     # Dashboard pages
│   └── api/             # API routes
├── components/          # React components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   ├── shared/          # Shared components
│   └── ui/              # UI primitives
├── lib/                 # Utilities and configs
└── prisma/              # Database schema
```

## License

MIT
