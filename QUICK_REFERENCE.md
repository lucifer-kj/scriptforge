# ScriptForge - Quick Reference Card

## 🚀 Quick Start (Copy & Paste)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

## 📋 Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | 🔧 Start dev server (http://localhost:3000) |
| `npm run build` | 🏗️ Build for production |
| `npm run lint` | 🔍 Check code quality |
| `npm run format` | 📝 Auto-format code |
| `npm run type-check` | ✅ Check TypeScript types |
| `npm run preview` | 👁️ Preview production build |

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `App.tsx` | Main app component & routing |
| `components.tsx` | All UI components |
| `types.ts` | TypeScript definitions |
| `api.ts` | API integration layer |
| `index.tsx` | React app initialization |
| `package.json` | Dependencies & scripts |
| `vite.config.ts` | Build configuration |

## 🔐 Environment Setup

Create `.env.local` (ignored by git):

```env
NEXT_PUBLIC_API_BASE_URL=https://your-n8n.com/webhook/script-forge
NEXT_PUBLIC_HELP_WEBHOOK_URL=https://your-n8n.com/webhook/script-forge/help
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## 📚 Documentation

| Document | Read When |
|----------|-----------|
| `README.md` | Project overview |
| `SETUP_GUIDE.md` | Setting up development |
| `CONTRIBUTING.md` | Contributing code |
| `IMPLEMENTATION_SUMMARY.md` | What was added |

## 🌳 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, then check quality
npm run type-check && npm run lint && npm run format

# Commit with descriptive message
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `npm run dev -- --port 3001` |
| Service Worker issues | Clear cache in DevTools |
| TypeScript errors | Run `npm run type-check` |
| Module not found | Run `npm install` |

## 📦 Project Stack

- **Frontend:** React 18 + TypeScript
- **Build:** Vite 5
- **Styling:** Tailwind CSS
- **Code Quality:** ESLint + Prettier
- **Database:** Supabase (PostgreSQL)
- **Backend:** n8n (automation)

## 🧪 Before Committing

```bash
# Always run these before pushing
npm run type-check    # ✅ Types OK?
npm run lint          # ✅ Lint OK?
npm run build         # ✅ Build OK?
```

## 🚢 Deployment

```bash
npm run build        # Creates dist/
# Upload dist/ to your hosting
```

Popular hosting:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

## 💡 Tips

✅ **DO:**
- Use TypeScript types
- Check code quality before committing
- Write clear commit messages
- Keep components focused
- Update documentation

❌ **DON'T:**
- Commit `.env.local`
- Commit `node_modules/`
- Use `any` type in TypeScript
- Hardcode API URLs
- Ignore linting errors

## 🆘 Quick Help

```bash
# Can't start dev server?
npm install

# TypeScript errors?
npm run type-check

# Code format issues?
npm run format

# All checks before push?
npm run type-check && npm run lint && npm run build
```

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for setup issues
2. Check `README.md` for project info
3. Check `CONTRIBUTING.md` for code guidelines
4. Open GitHub issue for bugs

---

**Ready to develop?** Run `npm run dev` and start coding! 🎯
