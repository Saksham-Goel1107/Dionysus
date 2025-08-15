# Cursor Project Rules and Context

This directory contains project-scoped rules and concise docs that help AI tools (like Cursor) understand and work effectively within this repository.

## What’s inside

- `rules/`: Project rules (`.mdc`) that guide planning, editing, and code generation
- `context/`: Short, human-friendly docs summarizing architecture, stack, commands, and directories

## How rules work

- Rules are loaded from `.cursor/rules/*.mdc`
- Each rule includes a description and optional `globs` to scope it to matching files
- Some rules are marked `alwaysApply: true` and provide global, project-wide guidance

## Update guidelines

- Keep rules concise and specific to this repo
- Prefer project conventions over generic advice
- Update `context/` when tech stack, architecture, or scripts change

## Compatibility

- These are Project Rules. Older setups may use a root `.cursorrules` file; we prefer `.cursor/rules` for clarity and team sharing

## Useful links

- Main README: `README.md`
- Contribution guide: `CONTRIBUTING.md`
- Security: `SECURITY.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
