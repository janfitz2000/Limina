# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2017 with strict mode enabled
- **Module**: ESNext with bundler resolution
- **Path Aliases**: `@/*` maps to `./src/*`
- **JSX**: Preserve mode for Next.js
- **Type Safety**: Strict TypeScript settings with no implicit any

## ESLint Configuration
- Extends `next/core-web-vitals` and `next/typescript`
- Uses flat config format with `@eslint/eslintrc` compatibility
- Automatically enforces Next.js and TypeScript best practices

## File Organization
- **Pages**: App Router structure in `src/app/`
- **Components**: Reusable components in `src/components/`
- **Utilities**: Business logic in `src/lib/`
- **Types**: TypeScript definitions in `src/types/`
- **API Routes**: Server-side logic in `src/app/api/`

## Naming Conventions
- **Files**: kebab-case for pages (`page.tsx`, `route.ts`)
- **Components**: PascalCase for React components
- **Functions**: camelCase for utility functions
- **Types/Interfaces**: PascalCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE for environment variables

## Styling Conventions
- **CSS Framework**: Tailwind CSS with custom color palette
- **Color System**: 
  - Primary: `#10344C` (dark blue)
  - Primary Medium: `#1e5b8a` 
  - Primary Light: `#2d81c4`
  - Accent: `#FACC15` (gold)
  - Accent Light: `#FDE68A`
- **Fonts**: Poppins as primary font family
- **Component Classes**: Use utility classes with custom CSS for animations

## Database Conventions
- **Supabase**: Row Level Security (RLS) enabled on all tables
- **Naming**: snake_case for database columns and tables
- **Types**: Auto-generated TypeScript types from Supabase schema