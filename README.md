 # HPH Vision

HPH Vision is organized as a TypeScript monorepo using **pnpm workspaces** and **Turborepo**. The repository contains a React Native mobile application, a shared React Native library, a FastAPI service, and a shared Python backend library.

## Repository Structure

```text
packages/
├── mobile/          React Native application (@hiperhealth/hphvision)
├── mobile-lib/      Shared React Native library (@hiperhealth/hphvision-lib)
├── hphvision-core/  Shared TypeScript core package
├── restapi/         FastAPI application
└── api-core/        Shared Python backend library
```

## Monorepo Tooling

This repository uses:

- pnpm Workspaces
- Turborepo
- TypeScript Project References
- Poetry (Python dependency management)

---

# JavaScript Setup

Install JavaScript dependencies from the repository root:

```bash
pnpm install
```

Build all workspace packages:

```bash
pnpm build
```

Run all tests:

```bash
pnpm test
```

Run lint:

```bash
pnpm lint
```

Run TypeScript type checking:

```bash
pnpm typecheck
```

Run all checks:

```bash
pnpm check
```

---

# Mobile Development

Run the development server:

```bash
pnpm mobile:dev
```

Run mobile lint:

```bash
pnpm mobile:lint
```

Android Studio project:

```text
packages/mobile/android
```

Do **not** open the repository root as the Android project.

If Android Studio requests the SDK location, create the untracked file:

```text
packages/mobile/android/local.properties
```

Example:

```properties
sdk.dir=/home/<user>/Android/Sdk
```

---

# Python / FastAPI

Install Python dependencies:

```bash
poetry install
```

Run the API:

```bash
pnpm api:dev
```

Equivalent command:

```bash
poetry run uvicorn hph_vision_api.main:app --app-dir packages/restapi/src --reload
```

Health endpoint:

```text
GET /health
```

---

# Python Commands

Lint:

```bash
pnpm api:lint
```

Format:

```bash
pnpm api:format
```

Tests:

```bash
pnpm api:test
```

---

# Workspace Packages

## @hiperhealth/hphvision-core

Shared TypeScript package used across workspace packages.

Location:

```text
packages/hphvision-core
```

## @hiperhealth/hphvision

React Native application.

Location:

```text
packages/mobile
```

## @hiperhealth/hphvision-lib

Shared React Native library.

Location:

```text
packages/mobile-lib
```

---

# Development Workflow

Install dependencies:

```bash
pnpm install
```

Run all quality checks:

```bash
pnpm check
```

Build all packages:

```bash
pnpm build
```

---

# Package Managers

JavaScript

- pnpm

Python

- Poetry

---

# CI

The repository CI validates:

- Build
- Lint
- Tests
- Type checking

using pnpm workspaces, Turborepo, Poetry, and Makim.