# machine-ui-v2 Folder Structure

This repo is being organized as a single UI codebase with a shared runtime and
small machine-specific override surfaces.

## Principles

- Put shared runtime, transport, hydration, and recovery behavior in one place.
- Put shared device control, logs, and service integrations in one place.
- Keep machine-specific code narrow: form logic, operation-screen composition,
  and custom device buttons.
- Avoid cloning full app surfaces unless machine workflows diverge much more
  than expected.

## Target Layout

```text
app/
  ... routes and top-level providers

actions/
hooks/

components/
  bootstrap/
  device/
  feature/
  layout/
  service/

lib/
  bridge/
  contracts/
  device/
  logging/
  machine/
  mqtt/
  runtime/
  services/
  store/

machines/
  shared/
  machine-template/
```

## Folder Responsibilities

### `app/`

Top-level Next routes, route groups, providers, and page composition.

### `actions/`

Thin Next server action entrypoints. These should validate and orchestrate
app-facing operations, then delegate to `lib/services/` or machine-specific
action wrappers.

### `hooks/`

Shared client-side React hooks that are app-facing. Keep reusable runtime and
bridge/device hook primitives in `lib/` when they are core infrastructure.

### `components/bootstrap/`

Shared startup, reconnect, hydration, stale-state, and readiness UI.

### `components/device/`

Generic device UI that is not machine-specific: logs, action status, generic
command buttons, HMI method buttons, and device summaries.

### `components/feature/`

Shared feature-level UI that may be reused across machines, such as operation
cards, forms, or panels whose structure is generic but whose content is filled
by machine configuration.

### `components/layout/`

App shell, navigation, shared panels, and layout primitives.

### `components/service/`

Generic cards and panels for service health and service control such as bridge,
Codesys, Docker, disk, and vision-adjacent utilities.

### `lib/runtime/`

Shared runtime lifecycle logic: startup state machine, reload behavior,
reconnect grace handling, stale detection, and hydration orchestration.

### `lib/bridge/`

Bridge-specific payload parsing, cache handling, bridge command publishing, and
 bridge metadata selectors.

### `lib/contracts/`

Thin UI-facing contract definitions. This should move toward bridge-first types
 and away from broad UI-side SDK dependence.

### `lib/device/`

Shared `useDevice`, `sendAction`, device-topic selection, and other device-level
control abstractions.

### `lib/logging/`

Structured UI logging helpers and logging transport utilities.

### `lib/machine/`

Machine resolver utilities that choose which machine configuration, feature
overrides, and button registries are active.

### `lib/mqtt/`

Raw MQTT client concerns only.

### `lib/services/`

Server-side or service-facing integration modules such as Docker, Codesys,
MongoDB utilities, disk status, and vision/video helpers.

### `lib/store/`

Shared Zustand stores and selectors.

### `machines/shared/`

Shared machine config helpers and common override primitives used by all
machine profiles.

### `machines/machine-template/`

Template machine override surface. Real machine folders should eventually live
next to this and contain only narrow overrides:

- operation screen composition
- machine-specific form logic
- machine-specific feature configuration

Each machine folder should expose a `registry.ts` file that declares:

- the machine identity and matching metadata
- machine-specific screens/components
- machine-specific forms
- machine-specific action wrappers
- machine-specific device button registries
- machine-specific bridge-type adapters
- machine-specific device button registries

## Migration Guidance

Port shared runtime and device-control logic first.

1. Startup/reload/recovery behavior
2. `useDevice` and `sendAction`
3. Generic device logs and button primitives
4. Generic service integrations
5. Machine-specific forms and operation-screen overrides

That order keeps the shared seams stable before moving workflow-specific code.