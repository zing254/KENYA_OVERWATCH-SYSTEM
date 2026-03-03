# Team Collaboration Workflow

## Overview

This document outlines the Git workflow for team collaboration on the Kenya Overwatch project.

## Branches

- `main` - Production-ready code
- `develop` - Integration branch for next release
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production fixes

## Workflow

### 1. Start New Feature

```bash
# Update your local main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes & Commit

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
```

### 3. Push & Create Pull Request

```bash
# Push branch to remote
git push origin feature/your-feature-name

# Create PR via GitHub CLI
gh pr create --title "Feature: Description" --body "## Summary
- Added new feature
- Updated related components"
```

### 4. Code Review

- All PRs require at least 1 approval
- Address feedback and push updates
- Squash merge after approval

## Commit Message Format

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Issues

Use issues to track:
- Features to implement
- Bugs to fix
- Tasks to complete

## Code Review Checklist

- [ ] Code follows project conventions
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security issues
- [ ] No console errors
