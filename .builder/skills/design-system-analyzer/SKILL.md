---
name: design-system-analyzer
description: >
  Analyzes the design system for the project and audits component adherence to it. 
  Generates a detailed report checking for proper use of design tokens (colors, spacing, 
  typography, shadows, radii), identifying violations, inconsistencies, and component 
  improvements. Use when reviewing design system compliance, auditing components, 
  refactoring for design consistency, or assessing design token usage across the codebase.
---

# Design System Analyzer

This skill helps maintain design system consistency across your project by auditing components against defined design tokens and patterns.

## Quick Start

When asked to analyze design system adherence:

1. **Identify the design tokens** from `src/style.css` or CSS variables file
2. **Scan all components** for their usage patterns
3. **Compare actual usage** against defined tokens
4. **Generate a compliance report** with:
   - Overall adherence score (percentage of correct usage)
   - Components checked and their status
   - Token violations grouped by type (color, spacing, typography, etc.)
   - Inconsistencies (same element styled differently across components)
   - Specific recommendations for each violation
5. **Prioritize findings** by impact and frequency

## Design System Structure

The project uses CSS custom properties (variables) defined in `src/style.css`:

### Color Tokens

- **Surfaces:** `--color-canvas`, `--color-surface`, `--color-surface-muted`, `--color-surface-elevated`
- **Brand:** `--color-brand`, `--color-brand-strong`, `--color-brand-soft`, `--color-brand-ring`
- **Semantic:** `--color-destructive`, `--color-destructive-strong`, `--color-destructive-soft`
- **Text:** `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`
- **Borders:** `--color-border-default`, `--color-border-subtle`, `--color-border-strong`
- **Utilities:** `--color-code-bg`

### Typography Tokens

- **Fonts:** `--font-heading` (Poppins), `--font-body` (Inter)
- **Base font:** 16px/1.5 (from :root)

### Spacing & Shape Tokens

- **Radius:** `--radius-sm` (0), `--radius-md` (0), `--radius-lg` (0), `--radius-xl` (0)
- **Shadows:** `--shadow-sm`, `--shadow-md`

### Common Usage Patterns

- Buttons use brand colors with hover states (e.g., `bg-[var(--color-brand)]` → hover `bg-[var(--color-brand-strong)]`)
- Text uses text color tokens, not direct hex values
- Spacing uses Tailwind classes or direct CSS variables
- Borders use `--color-border-*` tokens consistently

## Audit Process

### Step 1: Extract Design Tokens

Read `src/style.css` to identify all available design tokens. Note their purposes and values.

### Step 2: Scan Component Files

Grep through `src/components/**/*.ts` for:

- Hardcoded colors (hex, rgb, rgba) that don't use tokens
- Inline styles that bypass CSS classes
- Custom spacing values not from Tailwind or design tokens
- Typography choices (font-weight, font-size) not aligned with system
- Shadow or radius usage

### Step 3: Categorize Violations

Group findings by:

- **Critical:** Direct hardcoded colors (especially brand, text, semantic colors)
- **High:** Inconsistent spacing or typography choices
- **Medium:** Unused or underutilized tokens
- **Low:** Minor styling inconsistencies

### Step 4: Calculate Adherence Score

```
Adherence % = (Elements using tokens / Total styled elements) × 100
```

### Step 5: Generate Report

Include sections:

- Executive summary (score, key stats)
- Component-by-component breakdown
- Token usage heatmap (which tokens are used, which are unused)
- Violation details with specific file:line references
- Recommended fixes
- Quick wins (easy improvements)

## Gotchas

### 1. Distinguish Between Violations and Intentional Overrides

Not every custom value is a violation. Check if there's a comment explaining the override or if it's truly a one-off. Still flag it for review—consistency matters.

### 2. Tailwind vs. CSS Variables

This project mixes Tailwind (e.g., `px-6`, `py-4`) with CSS variables (e.g., `var(--color-text-primary)`). Both are valid. Flag inconsistency within the same component (e.g., one part uses Tailwind colors, another uses token variables).

### 3. Computed Styles in TypeScript

Lit components can apply classes dynamically. Don't just search static HTML—also check template strings and conditional class bindings. Look for patterns like:

```typescript
class="${this.someCondition ? 'bg-red-500' : 'bg-blue-500'}"
```

These are still violations if they hardcode colors instead of using variables.

### 4. Imported Assets and External Styles

Google Fonts are imported at the top of `src/style.css`. That's fine. But flag any components that load external stylesheets or define scoped styles that override design tokens.

### 5. Unused Tokens

The report should note unused tokens (e.g., `--radius-md` if everything uses `--radius-sm`). This isn't a violation, but it signals that the design system may not match implementation reality.

## Example Output

```
## Design System Adherence Report

**Overall Score: 87%**

### Summary
- Total components: 10
- Compliant components: 9
- Components with violations: 1
- Total styled elements audited: 143
- Elements using design tokens: 124
- Hardcoded colors found: 5
- Inconsistent typography: 3

### Violations

#### 🔴 Critical
1. **company-dialog.ts:42** — Hardcoded color `#ff5722` (should use `var(--color-destructive)`)
   - Impact: Breaks semantic color consistency
   - Fix: Replace `color: #ff5722` with `color: var(--color-destructive)`

#### 🟡 High
1. **metrics-charts.ts:18** — Chart colors hardcoded; consider extracting to tokens
   - Current: `const colors = ['#123456', '#789abc']`
   - Recommendation: Define chart color palette as CSS variables

### Token Usage
| Token | Used In | Frequency |
|-------|---------|-----------|
| --color-brand | 8 components | 24 times |
| --color-text-primary | 10 components | 38 times |
| --color-border-subtle | 6 components | 12 times |
| --font-heading | 3 components | 5 times |
| --radius-lg | 0 components | Unused ⚠️ |

### Recommendations
1. Extract hardcoded colors in company-dialog.ts (Quick Win—5 min)
2. Review and document chart color strategy
3. Consider adding radius tokens to more components
```

## Instructions

When the user asks to analyze design system adherence:

1. **Ask clarifying questions if needed:**
   - "Should I focus on a specific component or audit the entire codebase?"
   - "Do you want me to suggest refactoring fixes, or just report violations?"

2. **Execute the audit:**
   - Read `src/style.css` to extract tokens
   - Grep and scan all component files
   - Document violations with line numbers

3. **Format the report:**
   - Start with an overall score and key stats
   - Group violations by severity (Critical, High, Medium, Low)
   - Include before/after examples for fixes
   - Provide a token usage heatmap
   - End with prioritized recommendations

4. **Offer next steps:**
   - "Would you like me to fix the violations I found?"
   - "Should I refactor any specific component?"
   - "Do you want a design token documentation file?"

## Checking Component Examples

### What Good Adherence Looks Like

```typescript
// ✅ Good: Uses design tokens
class="border border-[var(--color-border-subtle)] bg-[var(--color-surface)]
        text-[var(--color-text-primary)] rounded-[var(--radius-sm)]"
```

### What Violations Look Like

```typescript
// ❌ Bad: Hardcoded colors
class="border-2 border-gray-300 bg-#f5f5f5 text-#333333"

// ❌ Bad: Inconsistent within same component
class="text-blue-600"  // This component uses Tailwind colors
class="text-[var(--color-text-primary)]"  // This part uses tokens
```

## Tips

- **Be specific with line numbers** — always reference file:line format for easy navigation
- **Explain the "why"** — help the user understand why consistency matters
- **Provide quick wins** — identify 2-3 easy fixes that have high impact
- **Don't over-engineer** — if 85%+ adherence and violations are low-impact, note it's in good shape
- **Document unknowns** — if you find complex computed styles or dynamic classes, flag them for manual review
