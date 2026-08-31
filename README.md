# HPH Vision

HPH Vision is organized as a monorepo with a React Native mobile app, a shared
React Native library, a FastAPI service, and a shared Python backend library.

## Structure

```text
packages/
  mobile/       React Native application package: @hiperhealth/hphvision
  mobile-lib/   Shared React Native library package: @hiperhealth/hphvision-lib
  restapi/      FastAPI application package
  api-core/     Shared backend domain/services package
```

## JavaScript / React Native setup

Install JS dependencies from the repository root:

```bash
yarn install
```

Run Metro:

```bash
yarn mobile:start
```

Run Android from the CLI:

```bash
yarn mobile:android
```

Run iOS from the CLI:

```bash
yarn mobile:ios
```

### Android Studio

Open this folder in Android Studio:

```text
packages/mobile/android
```

Do not open the repository root as the Android project. The Gradle project is
inside `packages/mobile/android`, while JS dependencies are hoisted to root
`node_modules` by Yarn workspaces.

If Android Studio asks for the SDK path, create this untracked file:

```text
packages/mobile/android/local.properties
```

Example:

```properties
sdk.dir=/home/<user>/Android/Sdk
```

## Python / FastAPI setup with Poetry

Install Python dependencies from the repository root:

```bash
poetry install
```

Run the API in development mode:

```bash
yarn api:dev
```

Equivalent direct Poetry command:

```bash
poetry run uvicorn hph_vision_api.main:app --app-dir packages/restapi/src --reload
```

Health check endpoint:

```text
GET /health
```

## Common commands

```bash
yarn lint
yarn test
yarn typecheck
yarn format
```

Python-only commands:

```bash
yarn api:lint
yarn api:test
yarn api:format
```

Mobile-only commands:

```bash
yarn mobile:lint
yarn mobile:test
yarn mobile:typecheck
```

## License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](LICENSE) file for details.
