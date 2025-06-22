# Essential Commands for LIMINA Development

## Core Development Commands
- `cd limina-platform-new` - Navigate to main application directory
- `npm install --legacy-peer-deps` - Install dependencies (legacy flag needed for React 19 + lucide-react compatibility)
- `npm run dev` - Start Next.js development server with turbopack
- `npm run build` - Build application for production
- `npm run lint` - Run ESLint for code linting
- `npm start` - Start production server

## Database & Supabase Commands
- `supabase start` - Start local Supabase services (requires Docker)
- `supabase db reset` - Reset database with fresh migrations and seed data
- `supabase stop` - Stop all Supabase services

## Docker Development (WooCommerce Integration)
- `cd wordpress-woocommerce-dev && ./dev.sh` - Complete development setup
- `cd wordpress-woocommerce-dev && ./setup.sh` - Set up WordPress + WooCommerce + Limina plugin
- `cd wordpress-woocommerce-dev && ./rebuild.sh` - Rebuild Docker container after code changes
- `docker-compose ps` - Check container status
- `docker-compose logs limina-platform` - View platform container logs

## System Commands (macOS/Darwin)
- `git status` - Check git status
- `ls -la` - List files with details
- `find . -name "*.ts" -type f` - Find TypeScript files
- `grep -r "search_term" src/` - Search within source code

## Testing & Quality
- `npm run lint` - ESLint code checking
- TypeScript compilation happens automatically during build
- No specific test command configured yet