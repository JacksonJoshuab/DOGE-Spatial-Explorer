# Contributing to DOGE Spatial Explorer

Thank you for your interest in contributing to DOGE Spatial Explorer! This document provides guidelines for contributing to this project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer.git
   cd DOGE-Spatial-Explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Run linter**
   ```bash
   npm run lint
   ```

## Code Style

- Use TypeScript for all source code
- Follow the existing code style (enforced by ESLint)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linter
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Testing

- All code changes should include tests
- Tests should cover both success and error cases
- Run `npm test` before submitting a PR

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new public APIs
- Include examples for new features

## Security

- Never commit secrets or credentials
- Follow security best practices
- Report security vulnerabilities privately

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
