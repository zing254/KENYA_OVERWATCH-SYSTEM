# Contributing to Kenya Overwatch

Thank you for your interest in contributing!

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow

## How to Contribute

### Reporting Bugs
1. Check existing issues first
2. Use bug report template
3. Include steps to reproduce
4. Include system details

### Suggesting Features
1. Check existing feature requests
2. Describe the problem your feature solves
3. Explain how it should work
4. Consider alternatives

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Commit with descriptive messages
6. Push to your fork
7. Submit a Pull Request

## Development Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend/control_center
npm install
```

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend/control_center
npm test
```

## Coding Standards

- Python: Follow PEP 8
- TypeScript: Follow ESLint rules
- Use meaningful variable names
- Comment complex logic
- Write tests for new features

## Commit Messages

- Use imperative mood
- Start with verb (Add, Fix, Update, Remove)
- Keep subject line under 50 chars
- Reference issues when closing

## Questions?

Open an issue for questions about contributing.
