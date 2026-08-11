# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nx monorepo with shared libraries for Angular, NestJS, and Ionic projects. Organized as publishable @smartsoft001/\* npm packages.

## Technology Stack

- **Angular**: 21.2.1
- **NestJS**: 11.1.5
- **Nx**: 23.1.1
- **TypeScript**: 5.9.3
- **NgRx**: 21.0.1
- **Storybook**: 10.2.16
- **Jest**: 30.2.0
- **npm**: 10+

## Project Structure

```
packages/
  auth/           - Authentication (domain, shell/nestjs, shell/dtos, shell/app-services)
  crud/           - CRUD operations (domain, shell/nestjs, shell/angular, shell/dtos, shell/app-services)
  trans/          - Translations (domain, shell/nestjs, shell/dtos, shell/app-services)
  shared/
    angular/      - Shared Angular components, NgRx state management
    nestjs/       - NestJS utilities
    domain-core/  - Base repository patterns
    models/       - Data model decorators
    users/        - User entity definitions
    utils/        - NIP, PESEL, zip-code, password hashing
    mongo/        - MongoDB utilities
    paypal/, payu/, paynow/, revolut/ - Payment integrations
    fb/, google/  - Third-party integrations
    claude-plugins/ - Claude Code plugins (smart@smartsoft)
```

## Agents

**MANDATORY: Always delegate to the appropriate agent.** Do NOT perform tasks manually if an agent exists.

### Shared (`shared-`)

| Agent                      | Use For                             |
| -------------------------- | ----------------------------------- |
| `shared-tdd-developer`     | TDD workflow (RED->GREEN->REFACTOR) |
| `shared-build-verifier`    | Verify build success                |
| `shared-test-runner`       | Run test suites                     |
| `shared-logic-implementer` | Implement business logic            |
| `shared-style-enforcer`    | Enforce ESLint/Prettier             |
| `shared-config-updater`    | Update config files                 |
| `shared-file-creator`      | Create files from templates         |
| `shared-error-handler`     | Standardize error handling          |
| `shared-security-scanner`  | Scan for vulnerabilities            |
| `shared-test-fixer`        | Fix failing tests                   |
| `shared-coverage-enforcer` | Enforce test coverage               |

### Angular (`angular-`)

| Agent                          | Use For                      |
| ------------------------------ | ---------------------------- |
| `angular-component-scaffolder` | Create standalone components |
| `angular-service-builder`      | Create injectable services   |
| `angular-jest-test-writer`     | Write Jest unit tests        |

### NestJS (`nestjs-`)

| Agent                    | Use For                    |
| ------------------------ | -------------------------- |
| `nestjs-service-builder` | Create injectable services |
| `nestjs-module-builder`  | Create NestJS modules      |

## Skills

### Workflow Skills (require user confirmation)

| Skill    | Use For                                                |
| -------- | ------------------------------------------------------ |
| `commit` | Create conventional commit based on Linear task        |
| `plan`   | Create implementation plan and save to Linear          |
| `impl`   | Implement plans from Linear task with TDD              |
| `push`   | Push changes, update Linear, create PR                 |
| `review` | Multi-dimensional code review (quality/tests/security) |

### Utility Skills (automatic)

| Skill                | Use For                                                      |
| -------------------- | ------------------------------------------------------------ |
| `test-unit`          | Jest test conventions (AAA pattern)                          |
| `test-e2e`           | Playwright E2E tests with Page Objects                       |
| `angular-patterns`   | Angular 20 signals, control flow, inject()                   |
| `angular-components` | Create/modify Angular UI components (tests, Storybook, docs) |
| `nx-conventions`     | Nx monorepo patterns and commands                            |
| `debug-helper`       | Cross-stack debugging workflows                              |
| `a11y-audit`         | Accessibility audits with axe-core                           |
| `browser-capture`    | Screenshot capture with Playwright                           |
| `linear-suggestion`  | Create Linear issues for improvements                        |
| `maia-files-upload`  | Upload files to Maia API storage                             |
| `maia-files-delete`  | Delete files from Maia API storage                           |

## Common Commands

```bash
# Build
nx build <project-name>
npx nx run-many -t build

# Test
nx test <project-name>
nx run-many --target=test --all
npm test

# Lint & Format
npm run format
nx lint <project-name>

# Storybook
nx storybook angular
nx storybook crud-shell-angular
```

## Key Configuration

- **Package manager**: npm
- **Path aliases**: `@smartsoft001/{package}` in `tsconfig.base.json`
- **Component prefix**: `smart` (CRUD shell), `lib` (shared Angular)
- **Project tags**: `scope:crud|auth|trans`, `type:shell|domain`

## Git Conventions

- Conventional commits with commitlint
- Husky pre-commit hooks
- Branch: `main`
- Auto-versioning via GitHub Actions

## Claude Code Plugin: smart@smartsoft

Plugin location: `packages/shared/claude-plugins/src/plugins/smart/`

| Event              | Hooks                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| `PreToolUse`       | safety_validator, sensitive file blocker, audit_logger, skill_validator |
| `PostToolUse`      | auto-format, audit_logger                                               |
| `UserPromptSubmit` | audit_logger                                                            |
