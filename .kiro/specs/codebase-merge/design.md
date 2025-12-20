# Design Document: Codebase Merge

## Overview

This design outlines the systematic approach to merging two ApparelDesk codebases into a single, unified implementation. The merge will preserve the frontend from `new/` while integrating all backend functionality from both `new/` and `project-aarav/` into the `new/` directory.

The key principle is **additive merging**: we keep everything from `new/` and add missing features from `project-aarav/` without breaking existing functionality.

## Architecture

### High-Level Merge Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Source Analysis                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   new/       │              │ project-     │            │
│  │   (Primary)  │              │ aarav/       │            │
│  │              │              │ (Reference)  │            │
│  └──────────────┘              └──────────────┘            │
│         │                              │                    │
│         └──────────────┬───────────────┘                    │
│                        ▼                                    │
│              ┌──────────────────┐                          │
│              │  Feature Matrix  │                          │
│              │  Comparison      │                          │
│              └──────────────────┘                          │
│                        │                                    │
│         ┌──────────────┼──────────────┐                    │
│         ▼              ▼              ▼                    │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│   │ Models  │    │  Views  │    │  URLs   │              │
│   └─────────┘    └─────────┘    └─────────┘              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Merge Execution                            │
│                                                              │
│  1. Add missing models (PurchaseOrder, SystemSettings)      │
│  2. Enhance existing models (SaleOrder.payment_term)        │
│  3. Port ViewSets (Admin, Vendor)                          │
│  4. Merge URL configurations                                │
│  5. Update settings.py                                      │
│  6. Consolidate dependencies                                │
│  7. Merge migrations                                        │
│  8. Port tests                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Target Codebase (new/)                      │
│                                                              │
│  ✓ Frontend unchanged                                       │
│  ✓ All models from both projects                           │
│  ✓ All API endpoints                                        │
│  ✓ Admin & Vendor features                                 │
│  ✓ Complete test coverage                                   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

The final merged structure in `new/`:

```
new/Odoo-x-SPIT-Hackathon-