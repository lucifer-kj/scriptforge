# Contributing to ScriptForge

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome all contributions
- Report issues constructively
- Respect intellectual property

## Ways to Contribute

1. **Report Bugs** - Found an issue? Open a GitHub issue
2. **Suggest Features** - Have an idea? Discuss it in issues or discussions
3. **Submit Code** - Fix bugs or implement features via pull requests
4. **Improve Documentation** - Help improve README, guides, and comments
5. **Testing** - Test features and report edge cases

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/scriptforge.git
cd scriptforge
```

### 2. Create a Feature Branch

```bash
# Create a new branch for your work
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-name
```

Use descriptive names:
- `feature/dark-mode` ✅
- `fix/service-worker-cache` ✅
- `docs/api-integration` ✅
- `feature/x` ❌

### 3. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Update types in `types.ts` if needed
- Add TypeScript types for new functions
- Use components from `components.tsx`

### 5. Run Quality Checks

Before committing, ensure your code passes all checks:

```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build to verify production build works
npm run build
```

Fix any issues found before committing.

### 6. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add dark mode toggle

- Add theme state management
- Update colors for dark theme
- Persist theme preference to localStorage"
```

**Commit message format:**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes (formatting, semicolons, etc)
- `refactor` - Code refactoring without feature changes
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, etc

### 7. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear title describing the change
- Detailed description of what was changed and why
- Screenshots if UI changes
- Reference any related issues (#123)

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style
- [ ] All checks pass (`lint`, `type-check`, `build`)
- [ ] Commit messages are clear
- [ ] Changes are focused on one feature/fix
- [ ] Documentation is updated if needed
- [ ] No breaking changes (or justified and documented)

### PR Description Template

```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
How can this be tested?

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Lint checks pass
- [ ] Type checks pass
- [ ] Build succeeds
- [ ] Documentation updated
```

## Coding Standards

### TypeScript

- Always use TypeScript types
- Avoid `any` type (use `unknown` if needed)
- Export types in `types.ts`

```tsx
// Good
export interface UserProfile {
  id: string;
  name: string;
}

// Bad
export const getUser = (id) => { ... }
```

### Components

- Keep components focused and reusable
- Use React hooks for state management
- Document complex components with comments

```tsx
// Good - Clear, focused component
export const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
  const styles = { /* ... */ };
  return <span className={styles[status]}>{status}</span>;
};

// Bad - Too many responsibilities
const ComplexComponent = () => {
  // 200+ lines of code
}
```

### Styling

- Use Tailwind CSS classes
- Use CSS variables from design tokens (--primary-500, etc.)
- Keep inline styles minimal
- Reference `index.html` for available variables

```tsx
// Good
<div className="bg-[var(--card)] p-4 rounded-[var(--radius-md)]">

// Avoid
<div style={{ backgroundColor: '#161B22', padding: '16px' }}>
```

### Comments

```tsx
// Good - explains why, not what
useEffect(() => {
  // Poll status every 3 seconds while processing
  if (submission.status === 'processing') {
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }
}, [submission.status]);

// Bad - obvious what the code does
const x = 'test'; // Set x to 'test'
```

### File Organization

```
- Use PascalCase for component names (HomePage.tsx)
- Use camelCase for functions and variables
- Group related code together
- Keep files focused (< 500 lines if possible)
```

## Documentation

### Updating README

Edit `README.md` for:
- User-facing features
- Installation instructions
- Project overview
- Deployment information

### Updating SETUP_GUIDE

Edit `SETUP_GUIDE.md` for:
- Developer setup instructions
- Troubleshooting tips
- Development workflow

### Code Comments

Use comments for:
- Non-obvious logic
- Complex algorithms
- Important context
- TODO items with owner

```tsx
// ✅ Good
// Cache submissions to localStorage with error handling
try {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
} catch (error) {
  console.error("Failed to save submissions", error);
}

// ❌ Bad
// Set submissions to localStorage
localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
```

## Testing

While the project currently doesn't have automated tests, consider:

1. **Manual Testing**
   - Test on multiple browsers
   - Test on mobile devices
   - Test offline functionality
   - Test with different network speeds

2. **Future Test Setup**
   - Consider adding Jest for unit tests
   - Add Playwright for E2E tests
   - Use GitHub Actions for automated testing

## Issues and Discussions

### Reporting Bugs

Include:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS
- Screenshot or error message

### Suggesting Features

Include:
- Clear use case
- Examples from other apps
- Why it would benefit users
- Potential implementation approach

## Review Process

1. **Automated Checks** - CI/CD pipeline runs (lint, type-check, build)
2. **Code Review** - Maintainers review code for quality and fit
3. **Feedback** - Comments and suggestions may be provided
4. **Updates** - Make requested changes if needed
5. **Merge** - Once approved, PR is merged

## Questions?

- Check existing issues and discussions
- Open a new discussion for questions
- Comment on related issues
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the ISC License, same as the project.

---

Thank you for making ScriptForge better! 🙏
