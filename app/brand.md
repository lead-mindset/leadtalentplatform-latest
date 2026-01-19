# LEAD Design System & Brand Guidelines

## Overview

Welcome to the **LEAD Design System & Brand Guidelines**. This document defines the essential principles, visual standards, and implementation details used to represent LEAD consistently across all digital products and brand touchpoints.

The goal is clarity, consistency, and scalability. These guidelines are the single source of truth for design and engineering.

---

## Brand

**LEAD** empowers Latin America by fostering innovation in STEM, expanding access to resources, and supporting the region’s transformation into a global tech hub.

**Vision**
Amplify opportunities in the United States while connecting LATAM students to global STEM career paths, transforming the region into a recognized center of innovation.

**Mission**
Empower students across the Americas—especially those with limited access—through mentorship, skill development, and practical STEM experiences.

**LEAD = Learn · Explore · Aspire · Discover**

---

## Identity & Typography

### Logo

The LEAD logomark represents clarity, growth, energy, and forward momentum. It reflects empowerment, movement, and innovation.

### Typeface

* **Font:** Raleway
* **Logotype Weight:** Extra Bold
* **Usage:** All UI text, headings, labels, and content

Raleway’s open, structured letterforms communicate trust, balance, and accessibility while maintaining a modern, professional tone.

---

## Design Principles

* Clarity over decoration
* Consistency over novelty
* Accessibility by default
* System-first, scalable design

---

## Color System

### Semantic Tokens

LEAD uses semantic color tokens. Colors must never be hard-coded in components.

Core roles:

* `background`, `foreground`
* `card`, `card-foreground`
* `popover`, `popover-foreground`
* `primary`, `primary-foreground`
* `secondary`, `secondary-foreground`
* `accent`, `accent-foreground`
* `muted`, `muted-foreground`
* `destructive`
* `border`, `input`, `ring`

### Dark Mode (Default)

**Dark mode is the default and standard experience for LEAD.**

Light mode is supported but secondary. All design decisions must prioritize dark mode contrast and usability first.

Colors are defined using **OKLCH** for perceptual consistency and accessibility.

---

## Extended Brand Colors (Chart Colors)

Tokens `chart-1` through `chart-5` are **extended brand colors**.

They are not limited to charts and may be used for:

* Gradients
* Highlights
* Data visualization
* Decorative accents
* Emphasis moments

---

## Accessibility

* Maintain sufficient contrast in all themes
* Prioritize legibility
* Use motion sparingly and intentionally

Accessibility is foundational to LEAD’s mission.

---

## Implementation (CSS)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1947 0.0984 266.07);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2294 0.1343 264.04);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2294 0.1343 264.04);
  --primary: oklch(0.59 0.22 1);
  --primary-foreground: oklch(0.98 0.02 320);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.2649 0.1411 267.71);
  --muted: oklch(0.97 0.001 106.424);
  --muted-foreground: oklch(0.553 0.013 58.071);
  --accent: oklch(0.97 0.001 106.424);
  --accent-foreground: oklch(0.2649 0.1411 267.71);
  --destructive: oklch(0.58 0.22 27);
  --border: oklch(0.923 0.003 48.717);
  --input: oklch(0.923 0.003 48.717);
  --ring: oklch(0.709 0.01 56.259);
  --chart-1: oklch(0.6294 0.2102 21.34);
  --chart-2: oklch(0.487 0.2087 322.04);
  --chart-3: oklch(0.5584 0.2066 286.65);
  --chart-4: oklch(0.52 0.20 4);
  --chart-5: oklch(0.59 0.22 1);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0.001 106.423);
  --sidebar-foreground: oklch(0.1947 0.0984 266.07);
  --sidebar-primary: oklch(0.52 0.20 4);
  --sidebar-primary-foreground: oklch(0.98 0.02 320);
  --sidebar-accent: oklch(0.97 0.001 106.424);
  --sidebar-accent-foreground: oklch(0.2649 0.1411 267.71);
  --sidebar-border: oklch(0.923 0.003 48.717);
  --sidebar-ring: oklch(0.709 0.01 56.259);
}

.dark {
  --background: oklch(0.1947 0.0984 266.07);
  --foreground: oklch(0.985 0.001 106.423);
  --card: oklch(0.2294 0.1343 264.04);
  --card-foreground: oklch(0.985 0.001 106.423);
  --popover: oklch(0.2294 0.1343 264.04);
  --popover-foreground: oklch(0.985 0.001 106.423);
  --primary: oklch(0.59 0.22 1);
  --primary-foreground: oklch(0.98 0.02 320);
  --secondary: oklch(0.2649 0.1411 267.71);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.2294 0.1343 264.04);
  --muted-foreground: oklch(0.709 0.01 56.259);
  --accent: oklch(0.2294 0.1343 264.04);
  --accent-foreground: oklch(0.985 0.001 106.423);
  --destructive: oklch(69.404% 0.19611 22.704);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(53.717% 0.01886 278.205);
  --chart-1: oklch(0.6294 0.2102 21.34);
  --chart-2: oklch(0.487 0.2087 322.04);
  --chart-3: oklch(0.5584 0.2066 286.65);
  --chart-4: oklch(0.52 0.20 4);
  --chart-5: oklch(0.59 0.22 1);
  --sidebar: oklch(0.2294 0.1343 264.04);
  --sidebar-foreground: oklch(0.985 0.001 106.423);
  --sidebar-primary: oklch(0.59 0.22 1);
  --sidebar-primary-foreground: oklch(0.98 0.02 320);
  --sidebar-accent: oklch(0.2649 0.1411 267.71);
  --sidebar-accent-foreground: oklch(0.985 0.001 106.423);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.553 0.013 58.071);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Status

This design system is **living and evolving**. Changes will be communicated and dialogue is encouraged.
