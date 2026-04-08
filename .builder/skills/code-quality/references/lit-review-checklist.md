# Lit Review Checklist

Use this checklist when evaluating repositories built with Lit.

## Component Design

- Does each component have a clear responsibility?
- Is state owned by the smallest reasonable component?
- Are presentational concerns separated from data-fetching or orchestration where practical?
- Are giant root components accumulating unrelated responsibilities?

## Reactivity and State

- Are reactive properties typed clearly?
- Is `static properties` aligned with the actual reactive surface?
- Is derived state computed from source data instead of copied into multiple fields?
- Are updates driven by Lit state instead of manual DOM syncing where possible?

## Templates

- Are templates readable and broken into understandable sections?
- Is repeated markup a candidate for extraction into a smaller component or render helper?
- Are conditional branches easy to follow?
- Is expensive work avoided inside render paths?

## Events and Data Flow

- Are custom event names semantic and consistent?
- Do child components emit focused events instead of mutating parent state directly?
- Are event payloads structured clearly?
- Is top-down data flow preserved?

## DOM and Lifecycle

- Is `updated()` used only where necessary?
- Are imperative DOM reads and writes minimized?
- Are listeners, observers, timers, and third-party instances cleaned up?
- Are browser-only APIs used in safe lifecycle locations?

## Accessibility

- Do form controls have labels?
- Do buttons have clear text or accessible names?
- Do dialogs manage open/close behavior accessibly?
- Are tables, headings, and interactive controls understandable to assistive tech?

## Type Safety

- Are `any` usages justified and isolated?
- Are API payloads modeled with useful types?
- Are nullable values handled intentionally?
- Are custom event payloads typed where practical?

## Repo-Specific Notes For This Project

In this repository, these patterns are conventions rather than automatic issues:

- light DOM via `createRenderRoot() { return this; }`
- guarded custom element registration
- utility-class-based styling
- parent-owned state with bubbling custom events

Flag them only when they create a concrete maintenance, correctness, or accessibility problem.
