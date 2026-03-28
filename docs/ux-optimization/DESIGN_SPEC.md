# UX Design Specification: Compute Platform Image Detail

## 1. Problem Statement
- **Current State**: Users face "choice paralysis" due to a cluttered grid of version tags (e.g., `v1.0-cuda11`, `v1.1-cuda12`). The "Deploy" action is hard to find.
- **Goal**: Improve conversion by guiding users to a "Recommended" version while keeping advanced options accessible.
- **Strategy**: Progressive Disclosure.

## 2. Visual Hierarchy & Layout

### A. The "Hero" Section (Top 40%)
**Purpose**: Address the needs of 80% of users (Students/Novices) immediately.

- **Layout**: Full-width card with a distinct background (e.g., subtle gradient).
- **Elements**:
  1. **Image Title**: "PyTorch Environment" (Large, H1).
  2. **Recommended Tag**: "Recommended: PyTorch 2.0 + CUDA 11.8" (Green Badge).
  3. **Primary CTA**: "Deploy Now" (Large, Primary Color, High Contrast).
  4. **Value Prop**: "Pre-configured with JupyterLab, Drivers, and Python 3.9".

### B. The "Version History" Section (Bottom 60%)
**Purpose**: Allow Experts/Engineers to select specific configurations.

- **Layout**: Tabbed Interface or Collapsible List (Default: Collapsed/Compact).
- **Controls**:
  - [Tab] "Stable Versions" (Default)
  - [Tab] "All / Nightly"
- **List Item Design**:
  - **Left**: Version Tag (e.g., `v1.2.0`).
  - **Middle**: Tech Specs (CUDA 11.8, PyTorch 2.0).
  - **Right**: "Deploy" (Secondary Button, outlined).

## 3. Component Blueprints

### Hero Component
```html
<div class="hero">
  <badge>Recommended</badge>
  <h1>PyTorch 2.1 (Stable)</h1>
  <p>Ready-to-use environment for Deep Learning.</p>
  <button class="btn-primary">Deploy Now</button>
</div>
```

### Version List Item
```html
<div class="list-item">
  <span class="tag">v1.2.0</span>
  <span class="specs">CUDA 11.8 • Python 3.9</span>
  <button class="btn-secondary">Use</button>
</div>
```

## 4. Interaction Guidelines
1. **Default State**:
   - Hero Section is visible.
   - "Deploy Now" button in Hero targets the *Recommended* version.
2. **Selection**:
   - Clicking a version in the list updates the "Deploy" context (or triggers deployment immediately).
3. **Mobile Responsiveness**:
   - Stack the Hero elements vertically.
   - Version list becomes a drawer or scrollable list.
