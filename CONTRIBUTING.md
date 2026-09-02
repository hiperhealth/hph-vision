# Contributing to HPH Vision

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to understand our community behavior standards.

This project is a monorepo. Run commands from the repository root unless a step
explicitly says otherwise.

## Base environment

The provided conda environment includes Node/Yarn, Java 17, Poetry, and common
project tooling:

```bash
mamba env create -f conda/dev.yaml
conda activate hph-vision
```

Then install project dependencies:

```bash
yarn install
poetry install
```

## Android development

Install Android Studio from https://developer.android.com/studio and make sure
the Android Emulator and Android SDK Platform-Tools are installed.

Recommended shell variables:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH
```

Open the Gradle project directly in Android Studio:

```text
packages/mobile/android
```

If needed, create `packages/mobile/android/local.properties`:

```properties
sdk.dir=/home/<user>/Android/Sdk
```

## Running the mobile app

Start Metro:

```bash
yarn mobile:start
```

In another terminal, run Android:

```bash
yarn mobile:android
```

Reset Metro cache if necessary:

```bash
yarn workspace @hiperhealth/hphvision start --reset-cache
```

## Running the API

```bash
yarn api:dev
```

The development API exposes:

```text
GET http://127.0.0.1:8000/health
```

## Checks before submitting changes

```bash
yarn lint
yarn typecheck
yarn test
```

Install pre-commit hooks with:

```bash
pre-commit install
```
