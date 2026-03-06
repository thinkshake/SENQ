# Migrate mitate from XRPL to EVM (no backward compatibility)

## Goal
Replace all XRPL logic with EVM logic across the project.

## Hard requirements
1. Branch `evm` must be used.
2. Remove all XRPL/XRLP logic, dependencies, adapters, configs, env vars, docs, and tests.
3. No backward compatibility layer.
4. Replace with EVM implementations only.
5. Keep the project buildable and tests passing.

## Deliverables
- Fully migrated codebase on EVM
- Updated docs and configuration for EVM
- Clean test/build pass
