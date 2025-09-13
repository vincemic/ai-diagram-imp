# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres (informally) to Semantic Versioning. Current package version: 0.1.0.

## [Unreleased]

### Added

- Initial `CHANGELOG.md` with documented recent documentation and feature clarifications.
- PNG export (alongside existing JPEG export) documented.
- Expanded node shape documentation (triangle, parallelogram, trapezoid, hexagon, octagon, cylinder, star).
- GraphML (Beta) warning statistics exposure (documented) and canonical shape downgrade behavior.
- Architecture document overhaul distinguishing implemented vs future roadmap items.
- Updated `USER_GUIDE.md` for schemaVersion 1.1.0 and accurate command / feature set.
- README refresh: feature list, quick start, limitations, contribution guide.

### Changed

- Clarified difference between runtime shapes and GraphML canonical shapes.
- Property pane description updated to reflect stroke color & width editing.
- Moved roadmap / open question material into `ARCHITECTURE.md` and user guide.

### Removed

- Outdated references to schemaVersion 1.0.0.
- Speculative sections (auto-layout engine, plugin sandboxing) from current-state narrative (now clearly labeled as future in architecture doc).

### Pending / Planned

- Multi-select, zoom/pan, keyboard nudging, schema migration pipeline, autosave, extended edge styling UI.

## [0.1.0] - Initial Tag

- Project scaffold: React + Vite, command pattern, GraphML export/import (beta), JSON schema, unit & e2e tests, screenshot automation.

---

[Unreleased]: https://github.com/vincemic/ai-diagram-imp/compare/0.1.0...HEAD
