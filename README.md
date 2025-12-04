# ScriptForge

An AI-powered script generation system that takes a YouTube URL, Website URL, or RSS Feed and produces a YouTube-ready script.

## Features

- 🎬 Generate scripts from multiple source types (YouTube, websites, RSS feeds)
- 🤖 AI-powered content analysis and script generation
- 📝 Multiple output formats (short, long)
- 🎨 Customizable tone (neutral, friendly, energetic)
- 💾 Local storage of submissions and generated scripts
- 📱 Responsive PWA (Progressive Web App)
- ⚡ Offline support with service worker
- 🌙 Dark mode design

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Backend**: n8n (automation platform)

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- Environment variables configured (.env.local)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/lucifer-kj/scriptforge.git
cd scriptforge
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with required variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-n8n-instance.com/webhook/script-forge
NEXT_PUBLIC_HELP_WEBHOOK_URL=https://your-n8n-instance.com/webhook/script-forge/help
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`.

### Building

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types without emitting files

## Project Structure

```
scriptforge/
├── api.ts                 # API integration layer
├── App.tsx                # Main app component
├── components.tsx         # Reusable UI components
├── index.html             # HTML entry point
├── index.tsx              # React app initialization
├── types.ts               # TypeScript type definitions
├── service-worker.js      # PWA service worker
├── manifest.json          # PWA manifest
├── icons/                 # App icons
├── supabase/
│   └── schema.sql         # Database schema
└── vite.config.ts         # Vite configuration
```

## Database Schema

The application uses Supabase with three main tables:

- **submissions** - User job requests and their status
- **scripts** - Generated scripts from completed jobs
- **rate_limits** - Rate limiting per client token

See `supabase/schema.sql` for detailed schema definition.

## API Integration

The frontend integrates with an n8n workflow for:
- Submitting script generation jobs
- Checking job status
- Retrieving generated scripts

Key endpoints:
- `POST /submit` - Submit a new job
- `GET /status/:jobId` - Check job status
- `GET /script/:jobId` - Retrieve generated script

## PWA Features

- **Service Worker** - Offline support and caching strategy
- **Manifest** - App metadata for installation
- **Icons** - Multiple sizes for different devices
- **Offline Page** - Fallback page when offline

## Code Quality

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

Run quality checks:

```bash
npm run lint
npm run type-check
npm run format
```

## Environment Variables

Create a `.env.local` file (not committed to git):

```env
# API Endpoints (Vite uses VITE_ prefix for client-side variables)
VITE_API_BASE_URL=https://n8n.example.com/webhook/script-forge
VITE_HELP_WEBHOOK_URL=https://n8n.example.com/webhook/script-forge/help

# Database (backend only - not exposed to frontend)
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

## Deployment

The app can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting service

Popular options:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

ISC License - see LICENSE file for details

## Support

For issues and questions, please open an issue on [GitHub Issues](https://github.com/lucifer-kj/scriptforge/issues).
