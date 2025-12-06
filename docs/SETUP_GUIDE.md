# ScriptForge Setup Guide

This guide will help you set up the project for development.

## Prerequisites

- **Node.js** 16.x or higher (18.x or 20.x recommended)
- **npm**, **yarn**, or **pnpm** for package management
- **Git** for version control

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React 18 and React DOM
- TypeScript
- Vite (build tool)
- Tailwind CSS
- ESLint and Prettier
- UUID library

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local  # If example exists
# or create manually
```

Add the following variables:

```env
# API Endpoints (Vite uses VITE_ prefix for client-side env vars)
VITE_API_BASE_URL=https://your-n8n-instance.com/webhook/script-forge
VITE_HELP_WEBHOOK_URL=https://your-n8n-instance.com/webhook/script-forge/help

# Backend Database Key (backend use only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000` and automatically open in your browser.

**Features:**
- Hot module replacement (HMR) for instant updates
- TypeScript checking
- Fast refresh

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

**What happens:**
- TypeScript is compiled
- Code is minified and bundled
- Service worker is prepared
- Build artifacts are ready for deployment

### 5. Preview Production Build

Test the production build locally:

```bash
npm run preview
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types without emitting |

## Project Structure

```
scriptforge/
├── index.html              # Entry HTML file
├── index.tsx               # React app initialization + PWA setup
├── App.tsx                 # Main app component with routing
├── components.tsx          # All UI components
├── types.ts                # TypeScript type definitions
├── api.ts                  # API integration layer
├── service-worker.js       # PWA offline support
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── manifest.json           # PWA manifest
├── .eslintrc.json          # ESLint configuration
├── .prettierrc.json        # Prettier configuration
├── .gitignore              # Git ignore rules
├── icons/                  # App icons (PWA)
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── maskable-icon.png
├── supabase/
│   └── schema.sql          # Database schema
└── .github/
    └── workflows/
        └── ci-cd.yml       # CI/CD pipeline
```

## Development Workflow

### 1. Creating New Components

Add components to `components.tsx` and export them:

```tsx
export const MyComponent = () => {
  return <div>My Component</div>;
};
```

### 2. Adding New Types

Update `types.ts` with new type definitions:

```tsx
export interface MyType {
  id: string;
  name: string;
}
```

### 3. Code Quality

Before committing, ensure code passes checks:

```bash
npm run type-check  # Check TypeScript
npm run lint        # Check ESLint
npm run format      # Format code
```

Or fix ESLint issues automatically:

```bash
npx eslint . --fix
```

## Environment Setup for Different Platforms

### macOS/Linux

```bash
# Install Node.js via Homebrew
brew install node

# Verify installation
node --version
npm --version
```

### Windows

Download and run installer from [nodejs.org](https://nodejs.org)

Or use Chocolatey:
```powershell
choco install nodejs
```

## Troubleshooting

### Issue: "npm: command not found"

**Solution:** Install Node.js from [nodejs.org](https://nodejs.org) or use your system's package manager.

### Issue: Port 3000 already in use

**Solution:** Either stop the other process or run on a different port:
```bash
npm run dev -- --port 3001
```

### Issue: Service Worker errors in console

**Solution:** This is normal during development. Service Workers are cached, so:
1. Clear browser cache
2. Or use Chrome DevTools: Application → Service Workers → Unregister

### Issue: TypeScript errors not showing

**Solution:** Run `npm run type-check` to validate types without starting the dev server.

## Deployment

### GitHub Pages

1. Update `vite.config.ts` with your repository name
2. Push to `main` branch
3. GitHub Actions will build and deploy automatically

### Vercel

1. Connect your repository on [vercel.com](https://vercel.com)
2. Set environment variables
3. Push to deploy automatically

### Netlify

1. Connect repository on [netlify.com](https://netlify.com)
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Manual Deployment

1. Build the project: `npm run build`
2. Upload `dist/` folder to your hosting service
3. Configure server for SPA routing (all routes → index.html)

## Database Setup (Backend)

The project uses Supabase with PostgreSQL. To set up:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema: `supabase/schema.sql`
3. Get your service role key and add to `.env.local`

See `supabase/schema.sql` for the complete database schema.

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure `.env.local`
3. ✅ Run `npm run dev`
4. Start building features!

## Getting Help

- Check [React documentation](https://react.dev)
- Check [Vite documentation](https://vitejs.dev)
- Check [Tailwind CSS documentation](https://tailwindcss.com)
- Open an issue on [GitHub](https://github.com/lucifer-kj/scriptforge/issues)

## Code Standards

- Use TypeScript for type safety
- Follow ESLint rules
- Format code with Prettier
- Write meaningful component names
- Document complex logic with comments
- Keep components focused and reusable

Happy coding! 🚀
