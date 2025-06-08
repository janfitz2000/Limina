# Local Supabase Development Setup

## Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed

## Install Supabase CLI

### Option 1: Using npm (Recommended)
```bash
npm install -g supabase
```

### Option 2: Using Homebrew (macOS)
```bash
brew install supabase/tap/supabase
```

### Option 3: Direct Download
Visit https://github.com/supabase/cli/releases and download for your OS

## Verify Installation
```bash
supabase --version
```

## Initialize Local Supabase
```bash
cd limina-platform-new
supabase init
supabase start
```

This will:
- Create a `supabase/` folder with local config
- Start local Supabase services (Database, API, Auth, etc.)
- Provide local URLs and keys

## Environment Variables for Local Development
After `supabase start`, update your `.env.local`:

```env
# Local Supabase (replace with your actual local URLs from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_from_supabase_start_output

# If you want to use hosted Supabase instead, use:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_hosted_anon_key
```

## Useful Commands
```bash
supabase status          # Check running services
supabase stop           # Stop all services
supabase db reset       # Reset database to clean state
supabase logs           # View service logs
```

## Access Local Services
- Database: http://localhost:54323 (Postgres)
- API: http://localhost:54321
- Dashboard: http://localhost:54323
- Auth: http://localhost:54321/auth/v1
