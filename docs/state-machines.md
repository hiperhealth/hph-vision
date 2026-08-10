# State Machine Primitives and Flow Architecture

This document describes the design, patterns, and usage of the generic state machine primitives implemented under `packages/mobile-lib/src/state-machines/`.

## Architecture Overview

The state machine primitives are built to decouple business logic flows (such as onboarding, template generation, testing, and report generation) from React Native or any UI framework. This allows flows to be tested in a pure environment.

The architecture is built around three core concepts:

1. **Pure Reducer Pattern**: Transitions are computed via a pure `transition` function that takes the current state, context, and event, and returns the next state and context.
2. **Replayable Event Log**: All transitions are stored in a chronological event log. The log can be replayed to recreate any past session state for debugging.
3. **Snapshot Serialization**: The machine state can be serialized to a JSON-safe snapshot and restored back to a live state machine instance.

## Primitives

- **`types.ts`**: Contains types for `StateMachineConfig`, `StateMachineEvent`, `ReplayableEvent`, and `MachineSnapshot`.
- **`engine.ts`**: Implements the pure `transition` and `replay` helpers, as well as the object-oriented `StateMachineInstance` wrapper class.
- **`testUtils.ts`**: Contains helpers (`assertTransition`, `assertInvalidTransition`, `assertSequence`) to verify transitions and flow sequences in tests.

## Configured Flow Domains

Five core flow domains are defined in `domains.ts`:

- `onboardingFlowConfig`: Manages user consent, disclaimer acceptances, and triage.
- `templateFlowConfig`: Manages visor alignment template generation and calibration.
- `acuityFlowConfig`: Manages right/left eye acuity screening phases.
- `refractionFlowConfig`: Manages subjective refraction estimative testing.
- `reportFlowConfig`: Manages report generation, formatting, and clinic sharing.
