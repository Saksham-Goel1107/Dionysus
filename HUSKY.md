# Husky Pre-Commit Hooks

## Overview

We use [Husky](https://typicode.github.io/husky/) to run automated checks before each commit to ensure code quality and consistency. This document explains what these checks are and how to work with them.

## Available Hooks

### Pre-Commit Hooks

When you run `git commit`, the following checks are automatically executed:

1. **lint-staged**: Runs linters and formatters only on the files that are staged for commit
   - Formats files using Prettier
   - Lints JavaScript/TypeScript files with ESLint
   - Checks TypeScript types

2. **commitlint**: Validates that commit messages follow our conventions

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:
- `feat: add dark mode support`
- `fix: resolve login button not working on mobile`
- `docs: update README with new API details`
- `chore: update dependencies`

Common types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

## How to Use

### Normal Workflow

Husky is set up to run automatically when you commit. Simply stage your changes and commit as usual:

```bash
git add .
git commit -m "feat: add new feature"
```

The pre-commit hooks will run automatically.

### Bypassing Hooks

In rare cases, you may need to bypass the hooks (not recommended):

```bash
git commit -m "feat: add new feature" --no-verify
```

### If Hooks Fail

If pre-commit hooks fail:

1. Read the error messages to understand what failed
2. Fix the issues in your code
3. Stage the fixed files and try committing again

Common issues:
- ESLint errors: Run `npm run lint:fix` to automatically fix many issues
- Prettier formatting: Run `npm run format` to format your code
- TypeScript errors: Run `npm run typecheck` to check for type errors
- Invalid commit message: Follow the conventional commits format

## Troubleshooting

### Hook Not Running

If hooks aren't running:

1. Make sure Husky is installed: `npm run prepare`
2. Check that the hooks are executable: `chmod +x .husky/*`
3. Ensure git hooks are enabled: `git config core.hooksPath .husky`

### Configuration Files

The relevant configuration files:

- `.husky/pre-commit`: The pre-commit hook script
- `.lintstagedrc.js`: Configuration for lint-staged
- `commitlint.config.js`: Rules for commit message validation
- `.eslintrc.js`: ESLint configuration
- `.prettierrc.js`: Prettier configuration

## Branch Name Check (Husky)

Before you can commit, Husky enforces a branch naming convention to keep the repository organized and make it easier to understand the purpose of each branch.

### Allowed Branch Name Patterns

Your branch name **must** match one of the following patterns:

- `feature/<something>`
- `fix/<something>`
- `chore/<something>`
- `refactor/<something>`
- `test/<something>`
- `hotfix/<something>`
- `release/<something>`

Where `<something>` is a short, descriptive name using lowercase letters, numbers, and dashes (e.g., `feature/login-page`, `fix/button-bug`).

#### Examples of Valid Branch Names
- `feature/add-dark-mode`
- `fix/navbar-overlap`
- `chore/update-deps`
- `refactor/user-service`
- `test/auth-flow`
- `hotfix/critical-bug`
- `release/v1.0.0`

#### Examples of Invalid Branch Names
- `dev`
- `my-feature`
- `feature_foo`
- `feature/`
- `feature`

### Why This Matters
- **Clarity:** Makes it easy to see what each branch is for at a glance
- **Automation:** Enables better CI/CD and release automation
- **Consistency:** Keeps the repo clean and easy to navigate

### What Happens If You Use an Invalid Branch Name?
If your branch name does not match the required pattern, the commit will be blocked and you will see an error like:

```
❌ Invalid branch name: 'my-feature'
✅ Use naming like: feature/login-page or fix/button-bug
```

### How to Fix
- Rename your branch to follow the allowed pattern:
  ```bash
  git branch -m feature/your-branch-name
  ```
- Then try committing again.

### Where Is This Enforced?
- The check is implemented in `.husky/pre-commit` and uses a regular expression:
  ```sh
  PATTERN="^(feature|fix|chore|refactor|test|hotfix|release)\/.+$"
  ```
- If your branch name does not match, the commit is aborted.

### Troubleshooting
- If you are sure you need to bypass this check (not recommended), you can use:
  ```bash
  git commit --no-verify
  ```
  But this should only be used in rare, justified cases.

- If you have trouble renaming your branch, see the [git branch documentation](https://git-scm.com/docs/git-branch#_rename_a_branch).

## Benefits

Using these hooks ensures:

- Consistent code style across the project
- Early detection of issues
- Clean git history with meaningful commit messages
- Better collaboration with other contributors

By following these standards, we make the codebase more maintainable and collaboration more efficient.