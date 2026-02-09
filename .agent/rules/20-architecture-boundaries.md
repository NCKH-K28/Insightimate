---
trigger: always_on
---

Feature Modules: src/features/{domain} contains ui, server, api, state.
API Layer: src/app/api routes delegate strictly to features/*/server services.
Contracts: src/contracts hold Zod schemas and shared types (Single Source of Truth).
Client vs Server: Strict separation in feature folders (ui vs server).