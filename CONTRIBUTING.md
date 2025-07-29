# Contributing to Dionysus

Thank you for your interest in contributing to Dionysus! 🚀
Your ideas and code help make this project better for everyone. We welcome all contributions—whether it's code, documentation, bug reports, or suggestions.

> **New**: We now use Husky for pre-commit hooks to ensure code quality and branch naming. See [HUSKY.md](./HUSKY.md) for details.

---

## 🛠️ How to Contribute

### 1. Fork & Clone

- Fork this repository to your GitHub account.
- Clone your fork to your machine:

  ```bash
  git clone https://github.com/Saksham-Goel1107/Dionysus.git
  cd Dionysus
  ```

### 2. Environment Setup

- Install dependencies:

  ```bash
  npm install
  ```

- Set up environment variables:
  - Copy `.env.example` to `.env.local` and fill in the required values
  - For test environment, use `.env.test`

- Configure Husky pre-commit hooks:
  ```bash
  npm run prepare
  ```
  This sets up automated checks that run before each commit (see [HUSKY.md](./HUSKY.md)).

### 3. Create a Branch (Naming Required!)

- **Branch names must follow this pattern:**
  - `feature/<something>`
  - `fix/<something>`
  - `chore/<something>`
  - `refactor/<something>`
  - `test/<something>`
  - `hotfix/<something>`
  - `release/<something>`
- Examples: `feature/login-page`, `fix/navbar-bug`, `chore/update-deps`
- If you use an invalid branch name, Husky will block your commit. See [HUSKY.md](./HUSKY.md#branch-name-check-husky) for details and how to rename your branch.

  ```bash
  git checkout -b feature/your-branch-name
  ```

### 4. Make Your Changes

- Follow the existing code style and conventions.
- Write clear, maintainable code.
- Update documentation as needed.
- Ensure your code passes all automated checks:
  ```bash
  npm run lint
  npm run typecheck
  ```

### 5. Commit & Push

- Make atomic commits with clear messages following [Conventional Commits](https://www.conventionalcommits.org/):
- Husky will check your commit message and run linting/formatting automatically.

  ```bash
  git add .
  git commit -m "feat: add new feature" # or fix:, docs:, chore:, etc.
  git push origin your-branch-name
  ```

> **Note**: If your commit fails, read the error message. Husky will tell you if your branch name or commit message is invalid, or if lint/type checks fail. See [HUSKY.md](./HUSKY.md#how-to-use) for troubleshooting.

### 6. Open a Pull Request

- Go to the [original repo](https://github.com/Saksham-Goel1107/Dionysus).
- Click “New Pull Request.”
- Select your branch and fill out the PR template, describing your changes and linking any relevant issues.
- Be patient and open to feedback during the review process.

---

## 🔐 Environment Variables & .env.example

- The `.env.example` file in this repository is **encrypted** for security reasons.
- If you need to work with environment variables, **do not commit any decrypted or custom `.env.example` files**.
- If you do not have a `.env.example` file, contact Saksham Goel (Owner) with a valid reason to request the decryption key.
- Once you receive the key, use it privately and never share it or the decrypted file publicly.
- The `.env.example` file is **not for sharing** or public distribution—treat it as sensitive.
- For any questions about environment setup, open an issue or contact the maintainer directly.

## 📝 Guidelines

- **Be respectful** and constructive in all communications.
- **Check existing [issues](https://github.com/Saksham-Goel1107/Dionysus/issues) and PRs** before starting work to avoid duplication.
- **Open an issue** for major changes to discuss your approach before submitting code.
- **Keep pull requests focused**—smaller PRs are easier to review and merge.
- For larger features or refactors, please describe your approach and reasoning in the pull request description.
- **Follow our coding standards**—we use ESLint, Prettier, and TypeScript strict mode
- **Update documentation** when changing APIs or user-facing features

## 📋 Project Structure

```
dionysus/
├── src/               # Source code
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable components
│   ├── lib/           # Utility functions and helpers
│   ├── server/        # Server-side code
│   └── trpc/          # tRPC router definitions
├── prisma/            # Prisma schema and migrations
├── public/            # Static assets
## 💬 Need Help?

- Open an [issue](https://github.com/Saksham-Goel1107/Dionysus/issues) if you have questions or need guidance.
- Start a discussion to propose new features, share ideas, or seek collaborators.

## 🚀 Deployment

The project is deployed on Vercel. Changes merged to the main branch are automatically deployed to the staging environment. Production deployments are manual after QA.

---

Thank you for helping make Dionysus better! 🌟
