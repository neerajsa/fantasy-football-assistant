### Project Awareness & Context
- **Always read `PRD.md`** at the start of a new conversation to understand the project's goals, features, architecture, and constraints.
- **Use consistent naming conventions, file structure, and architecture patterns**.
- **Use a virtual environment** whenever installing packages and running commands, including builds and tests.

### Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports**.
- **Use python_dotenv and load_env()** for environment variables.

### Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.

### AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Do not commit code to the repository** without explicit confirmation from the user.