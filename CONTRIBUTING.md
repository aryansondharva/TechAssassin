# Contributing to Tech Assassin

Quick guide for contributing to this project.

## Getting Started

1. Fork and clone the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Follow setup instructions in README.md
4. Make your changes

## Commit Format

Use conventional commits:
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: client, backend, mobile, db, infra

Examples:
feat(client): add user profile page
fix(backend): resolve auth token issue
```

## Code Standards

- TypeScript strict mode
- Functional React components
- Zod for validation
- Tests for new features
- No secrets in code

## Pull Request Process

1. Create PR from feature branch
2. Ensure tests pass
3. Update documentation
4. Request review

## Testing

```bash
# Backend
cd backend && npm test

# Frontend  
cd Client && npm test

# Mobile
cd Mobile && npm test
```

## Project Structure

```
TechAssassin/
├── Client/     # React web app
├── Mobile/      # Expo mobile app
├── backend/     # Next.js API
├── SQL/         # Database schemas
└── Docs/        # Documentation
```

## Security

- Never commit API keys or secrets
- Use environment variables
- Validate all inputs
- Follow security best practices

## Need Help?

- Create an issue for bugs/features
- Start a discussion for questions
- Check existing issues first

---

Thanks for contributing! 🚀