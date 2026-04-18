# Contributing to Tech Assassin

This document is the source of truth for how work gets done on this project — whether you're a human developer or an AI agent picking up a GitHub issue.

## Mission Briefing

Tech Assassin is a high-performance community platform built for elite developers. We maintain strict code quality standards and expect all contributions to align with our tactical architecture and security protocols.

---

## 🎯 Getting Started

### Prerequisites
- Node.js 18.x or 20.x (LTS recommended)
- PostgreSQL 15+ (Local or Managed)
- Git with SSH configured
- Familiarity with TypeScript, React, and Next.js

### Development Setup
1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow the installation steps in README.md
4. Ensure all services are running locally

---

## 🔧 Development Workflow

### Branch Strategy
- `main`: Production-ready code only
- `develop`: Integration branch for features
- `feature/*`: Individual feature development
- `hotfix/*`: Critical production fixes

### Commit Convention
We use conventional commits with tactical formatting:
```
type(scope): tactical description

types: feat, fix, docs, style, refactor, test, chore
scopes: client, backend, mobile, db, infra

Examples:
feat(client): add operative profile animations
fix(backend): resolve authentication token expiration
docs(readme): update deployment instructions
```

### Pull Request Process
1. **Draft PR**: Create draft PR while work is in progress
2. **Self-Review**: Ensure code meets all standards
3. **Tests**: Add/update tests for new functionality
4. **Documentation**: Update relevant docs
5. **Ready for Review**: Mark as ready for team review

### PR Template
```markdown
## Mission Objective
Brief description of what this PR accomplishes

## Technical Changes
- [ ] Backend modifications
- [ ] Frontend updates
- [ ] Database schema changes
- [ ] API modifications

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Deployment Notes
Any special deployment considerations
```

---

## 📋 Code Standards

### TypeScript Guidelines
- Use strict mode throughout
- Prefer explicit return types
- Utilize Zod for runtime validation
- Implement proper error boundaries

### React/Next.js Standards
- Use functional components with hooks
- Implement proper memoization where needed
- Follow the atomic design pattern
- Use Framer Motion for animations (60fps target)

### Database Standards
- All schema changes must be versioned in `/SQL`
- Use materialized views for performance-critical queries
- Implement Row-Level Security (RLS)
- Add proper indexes for query optimization

### API Standards
- Use Zod schemas for request/response validation
- Implement proper error handling with status codes
- Follow RESTful conventions
- Add comprehensive logging

---

## 🧪 Testing Requirements

### Test Coverage
- Unit tests: Minimum 80% coverage
- Integration tests: Critical paths covered
- E2E tests: User workflows validated

### Testing Stack
- **Backend**: Vitest + Supabase Test Harness
- **Frontend**: Vitest + React Testing Library
- **Mobile**: Expo Test Suite
- **API**: Postman/Newman collections

### Test Commands
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd Client && npm test

# Mobile tests
cd Mobile && npm test

# Full test suite
npm run test:all
```

---

## 🛡️ Security Protocols

### Code Security
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper authentication checks
- Validate all user inputs

### Database Security
- Use parameterized queries
- Implement RLS policies
- Regular security audits
- Encrypt sensitive data

### API Security
- Rate limiting implementation
- CORS configuration
- JWT token validation
- SQL injection prevention

---

## 📁 Project Structure

```
TechAssassin/
├── Client/          # React web application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
├── Mobile/          # Expo mobile application
├── backend/         # Next.js API server
│   ├── src/
│   │   ├── app/          # API routes
│   │   ├── lib/          # Shared utilities
│   │   └── types/        # TypeScript definitions
├── SQL/             # Database schemas and migrations
└── Docs/            # Technical documentation
```

---

## 🚀 Deployment Guidelines

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security scan completed

### Deployment Process
1. **Staging**: Deploy to staging environment first
2. **Verification**: Test critical functionality
3. **Production**: Deploy to production with monitoring
4. **Rollback Plan**: Have rollback strategy ready

### Environment Variables
Never commit environment files. Use the provided templates:
- `backend/.env.example`
- `Client/.env.example`
- `Mobile/.env.example`

---

## 🤝 Community Guidelines

### Communication Channels
- **Issues**: Bug reports and feature requests
- **Discussions**: Technical discussions and questions
- **PR Reviews**: Code review and feedback

### Code of Conduct
We follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.

### Getting Help
- Check existing issues and discussions
- Review documentation thoroughly
- Ask questions in discussions
- Join our community Discord (link in README)

---

## 🏆 Recognition System

### Contribution Types
- **Code**: Features, fixes, optimizations
- **Documentation**: Guides, API docs, tutorials
- **Testing**: Test cases, bug reports
- **Design**: UI/UX improvements
- **Infrastructure**: DevOps, deployment, monitoring

### Badge System
Contributors earn badges for:
- 🎯 **First Blood**: First merged PR
- 🔥 **On Fire**: 5+ PRs in a month
- 🛡️ **Guardian**: Security contributions
- 📚 **Scribe**: Documentation improvements
- 🧪 **Scientist**: Test coverage improvements

---

## ⚡ Quick Reference

### Common Commands
```bash
# Start development
npm run dev:all

# Run tests
npm run test:all

# Build for production
npm run build:all

# Lint code
npm run lint:all

# Type check
npm run type-check:all
```

### Useful Links
- [API Documentation](./Docs/api.md)
- [Database Schema](./Docs/database.md)
- [Deployment Guide](./Docs/deployment.md)
- [Troubleshooting](./Docs/troubleshooting.md)

---

## 📞 Contact

For questions about contributing:
- Create an issue with the `question` label
- Start a discussion in the repository
- Contact maintainers directly for urgent matters

---

**Remember**: Every contribution makes the Tech Assassin community stronger. Follow these guidelines, write clean code, and help us build the ultimate developer platform.

*Last Updated: April 2026*