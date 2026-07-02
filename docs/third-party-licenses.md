# Third-Party License Inventory

The repository itself is licensed under Apache-2.0.

This V0 uses a small JavaScript/Astro toolchain. Direct runtime and build
dependencies are expected to remain permissively licensed and compatible with
Apache-2.0 distribution.

## Direct Dependencies

| Package | Role | Declared license family |
| --- | --- | --- |
| Astro | Static site framework | MIT |
| React | Tool workbench UI | MIT |
| React DOM | Tool workbench UI | MIT |
| Vite | Build tooling | MIT |
| TypeScript | Type checking | Apache-2.0 |
| ESLint | Linting | MIT |
| Vitest | Tests | MIT |

## Release Requirement

Before public releases, run a package-manager license inventory after
dependencies are installed and review any non-permissive transitive dependency.
Do not add GPL, AGPL, SSPL, BUSL, or proprietary dependencies without an explicit
maintainer decision documented in a pull request.

## Notes

The production container is a static site image. The publish workflow emits SBOM
and provenance evidence for the image, and production deploys must use an
immutable digest.
