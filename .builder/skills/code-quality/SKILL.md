---
name: code-quality
description: >
  Evaluates a repository for Lit component quality, project-specific Lit conventions,
  dead code, and duplicate code. Use when the user asks for a code quality audit,
  Lit best-practice review, dead code analysis, duplicate code analysis, architecture
  review, or asks to run fallow / npx fallow against the repo, even if they do not
  explicitly mention a skill.
---

# Code Quality

## Quick Start

When this skill triggers:

1. Inspect the repository structure and identify Lit component entry points and shared patterns.
2. Review Lit components against both general best practices and this repository's conventions.
3. Run Fallow for code health reporting:
   - `npx fallow dead-code --format json`
   - `npx fallow dupes --format json`
4. Summarize findings as a report grouped by:
   - Lit best-practice issues
   - Repo-convention mismatches
   - Dead code findings
   - Duplicate code findings
   - Recommended fixes

Prefer reporting first. Only make code changes if the user asks for fixes.

## Repository Conventions To Preserve

This repository currently uses these Lit patterns. Treat them as intentional conventions unless the user asks to change architecture:

- Components are registered with guarded `customElements.define(...)` calls.
- Component state is commonly declared through `static properties = { ... }` plus `declare` fields.
- Components render in light DOM with `createRenderRoot() { return this; }`.
- Styling is mostly utility-class based instead of `static styles`.
- Parent/child communication relies on bubbling, composed custom events.
- The root `company-app` element owns most application state and passes data down.

Do not flag those conventions as problems by default. Separate true quality issues from repo-specific architectural choices.

For the detailed Lit review checklist, see [references/lit-review-checklist.md](references/lit-review-checklist.md).

## Review Workflow

### 1. Map the Lit Surface Area

Start with the component tree and identify:

- custom elements in `src/components`
- app bootstrap entry points
- shared stores, caches, and utility modules used by Lit components
- components that own state vs presentational components

### 2. Evaluate Lit Best Practices

Review for issues such as:

- overly large components with too many responsibilities
- unnecessary use of `any` or weak typing around component state and events
- direct DOM querying where declarative Lit bindings would be clearer
- manual DOM synchronization that can drift from component state
- event names that are unclear or inconsistent
- derived state duplicated across fields or recomputed imperatively
- side effects in render paths
- missing cleanup for long-lived listeners, observers, timers, or charts
- accessibility issues in controls, dialogs, labels, tables, and button text
- brittle template conditionals or repeated template blocks that should be extracted

Be precise: cite concrete files and lines for each issue.

### 3. Run Fallow

Use these commands exactly for reporting:

```bash
npx fallow dead-code --format json
npx fallow dupes --format json
```

If the user asks for a broader report, you can also run:

```bash
npx fallow --format json
```

Interpret results conservatively:

- Verify whether supposedly dead exports are framework entry points, custom element registrations, or intentionally dynamic references.
- Treat duplicate code findings as review candidates, not automatic refactor orders.
- Prefer small, local fixes over large abstractions.

### 4. Produce a Report

Use this structure:

```markdown
## Lit best-practice findings
- Severity — finding — `path:line`

## Repo-convention notes
- Observation — `path:line`

## Dead code from Fallow
- Finding — command output summary

## Duplicate code from Fallow
- Finding — command output summary

## Recommended next steps
- Smallest safe fixes first
```

Be explicit about confidence level when Fallow output may contain false positives.

## Gotchas

- This repo intentionally uses light DOM. Do not recommend shadow DOM migration unless the user asks for architectural changes.
- Do not treat utility-class styling as a Lit smell by itself.
- Do not confuse guarded `customElements.define(...)` registration with dead code.
- Be careful with modules used indirectly by templates, custom events, browser APIs, or export flows; Fallow may over-report them.
- `npx` is required here because the user explicitly asked for `npx fallow` reporting.
- Reporting is the default outcome. Do not refactor, delete exports, or deduplicate logic without user approval.

## Examples

### Example triggers

- "Audit this repo for Lit best practices"
- "Run a code quality review for these Lit components"
- "Use fallow to find dead code and duplicates"
- "Check whether this Lit app has architectural smells"
- "Review this repository and give me code quality recommendations"

### Example response shape

```markdown
I reviewed the Lit components and ran Fallow for dead-code and duplicate-code reporting.

## Lit best-practice findings
- Medium — `CompanyApp` owns API orchestration, export logic, and reporting, which makes it harder to test and evolve — `src/components/company-app.ts:112`
- Medium — manual DOM synchronization through `querySelector` increases drift risk compared with state-driven bindings — `src/components/company-dialog.ts:24`

## Repo-convention notes
- Light DOM and guarded custom element registration are consistent project conventions, not issues.

## Dead code from Fallow
- [summarize verified findings only]

## Duplicate code from Fallow
- [summarize verified findings only]

## Recommended next steps
1. Split the highest-complexity component by responsibility.
2. Tighten typing around component state and event payloads.
3. Remove only dead code that has been manually verified.
```
