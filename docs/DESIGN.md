# Design System: The Kinetic Gallery

### 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Kinetic Gallery."**

We are moving away from the cluttered, heavy aesthetic of traditional "gym" apps and toward the refined, airy precision of high-end editorial fitness. Inspired by the architectural discipline of Apple Fitness+ and the bold, rhythmic energy of Nike Training Club, this system treats every workout as a curated piece of art.

We break the "template" look through **high-contrast typography scales** and **intentional asymmetry**. Layouts should feel like a premium magazine—large, breathing display type juxtaposed with ultra-refined, technical data points. The interface does not "shout" for attention; it provides a high-performance stage for the user's movement.

---

### 2. Colors & Tonal Architecture

The palette is rooted in a "Whitescape" philosophy, using Cobalt Blue (`primary`) as a surgical tool to highlight progress and action.

#### 2.1 Token Reference

| Token | Hex | Usage |
|---|---|---|
| `primary` | #002897 | CTAs, active indicators, hero sections |
| `primary_container` | #003ace | Gradient endpoint, pressed states |
| `primary_fixed_dim` | #b8c3ff | Subtle accent text, glow effects |
| `on_primary` | #ffffff | Text and icons on primary surfaces |
| `surface` | #f8f9fa | Base page background |
| `surface_container_lowest` | #ffffff | "Lifted" cards, content foreground |
| `surface_container_low` | #f3f4f5 | Floating bar tint, subtle zones |
| `surface_container` | #edeeef | Section backgrounds |
| `surface_container_high` | #e7e8ea | Chip backgrounds, data zones |
| `surface_container_highest` | #e1e3e5 | Secondary button backgrounds |
| `on_background` | #191c1d | Primary text (never pure #000000) |
| `on_surface_variant` | #434653 | Secondary text (must meet 4.5:1 on white) |
| `outline_variant` | #c3c6d5 | Ghost borders at 20% opacity |
| `review` | #4c1d95 | Review mode hero, CTAs |
| `review_container` | #6d28d9 | Review gradient endpoint |
| `review_fixed_dim` | #ddd6fe | Review highlight, glow effects |

#### 2.2 On-Cobalt Text Hierarchy

When text sits on a `primary` background, use opacity to create hierarchy:

| Level | Color | Usage |
|---|---|---|
| Primary | `#ffffff` | Hero numbers, main headings |
| Secondary | `rgba(255,255,255,0.55)` | Subheadings, supporting text |
| Tertiary | `rgba(255,255,255,0.45)` | Labels, metadata |
| Muted | `rgba(255,255,255,0.35)` | Disabled text, placeholders |
| Glass button (active) | `#ffffff` bg, `primary` text | CTA on cobalt |
| Glass button (disabled) | `rgba(255,255,255,0.15)` bg | Inactive CTA on cobalt |

#### 2.3 The "No-Line" Rule

**1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts or physical separation via white space.

#### 2.4 Surface Hierarchy & Nesting

Use surface tiers to create physical layers:

- **Base:** `surface` (#f8f9fa)
- **Sectioning:** `surface_container` (#edeeef)
- **Interactive Cards:** `surface_container_lowest` (#ffffff) for a "lifted" paper effect

#### 2.5 Floating Elements (Glass Tint)

Floating navigation or top bars use `BlurView` (expo-blur):

- Tint: `surface_container_low` at 80% opacity
- Intensity: 50

#### 2.6 Accent Gradients

For Hero CTAs and high-intensity achievements, use `LinearGradient` (expo-linear-gradient):

- Start: `primary` (#002897)
- End: `primary_container` (#003ace)
- Angle: 135°

---

### 3. Typography

The system uses a dual-font strategy to balance athletic energy with technical precision.

- **Display & Headlines — Epilogue** (`@expo-google-fonts/epilogue`): The "Athletic" voice. Tight letter-spacing, heavy and confident.
- **Body & Labels — Manrope** (`@expo-google-fonts/manrope`): The "Technical" voice. Modern geometric clarity for stats and instructions.
- **Korean & Japanese — System Font**: CJK text uses the platform system font for optimal glyph rendering without bundle overhead.

#### 3.1 Font References

Typography is applied via inline `style` props with explicit `fontFamily` strings:

| Key | fontFamily | Usage |
|---|---|---|
| Display Bold | `Epilogue_700Bold` | Hero numbers, app title, grade numbers |
| Display SemiBold | `Epilogue_600SemiBold` | Subtitles, section headings |
| Body Regular | `Manrope_400Regular` | Body text, descriptions |
| Body Medium | `Manrope_500Medium` | Labels, metadata |
| Body SemiBold | `Manrope_600SemiBold` | Button text, emphasis labels |

#### 3.2 Type Scale

| Token | Font | Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-lg` | Epilogue | 36px | 700 | -0.02em | Hero headlines, 1–3 words max |
| `display-md` | Epilogue | 30px | 700 | -0.02em | Section heroes |
| `display-sm` | Epilogue | 24px | 600 | -0.01em | Screen titles |
| `headline-lg` | Epilogue | 22px | 600 | 0 | Section headers |
| `headline-md` | Epilogue | 18px | 600 | 0 | Subsection headers |
| `body-lg` | Manrope | 16px | 400 | 0 | Primary body text |
| `body-md` | Manrope | 14px | 400 | 0 | Secondary body text |
| `body-sm` | Manrope | 12px | 400 | 0 | Captions, footnotes |
| `label-lg` | Manrope | 14px | 600 | 0.02em | Button text, emphasis labels |
| `label-md` | Manrope | 12px | 500 | 0.05em | Uppercase metadata |
| `label-sm` | Manrope | 11px | 700 | 0.05em | Input labels, fine print |

**Korean Display Text:** For large Korean vocabulary on learning/review cards, use the system font at `display-lg` size and weight.

**Hierarchy Tip:** Pair `headline-lg` in Epilogue with `label-md` in Manrope (uppercase, 0.05em spacing) to create an authoritative, editorial look.

---

### 4. Screen Layout Patterns

#### 4.1 Bold Immersive (Primary Pattern)

The primary screen pattern uses a cobalt hero header paired with a surface content area:

```
┌─────────────────────────────┐
│ primary background          │
│  Branding / Hero content    │
│  Key metric + CTA           │
│          ╭─rounded bottom─╮ │
├──────────╯    surface     ╰─┤
│  Content area               │
│  Cards, lists, etc.         │
│                             │
└─────────────────────────────┘
```

- **Header:** `bg-primary`, `px-8 pt-12 pb-10`, `borderBottomLeftRadius: 32, borderBottomRightRadius: 32`
- **Content:** `bg-surface`, uses `flex-1` to fill remaining space
- **Cards:** `surface_container_lowest` (#fff) with `rounded-xl`

Use this pattern for screens with a primary action or hero metric (e.g., top screen, review screen).

#### 4.2 Content-Forward

For screens focused on content consumption (learning, tests):

```
┌─────────────────────────────┐
│ Navigation bar              │
├─────────────────────────────┤
│ surface background          │
│  Content (full screen)      │
│                             │
│                             │
└─────────────────────────────┘
```

Use `surface` as the base, with `surface_container_lowest` cards for content.

---

### 5. Elevation & Depth

Depth is achieved through **Tonal Layering** rather than structural scaffolding.

- **The Layering Principle:** Stack containers. Place a `surface_container_lowest` (#ffffff) card on a `surface` (#f8f9fa) background. The subtle hex value difference creates a "soft lift."

- **Ambient Shadows:** For floating elements (FAB, Action Sheet), use a "Cobalt Tinted Shadow":
  - Color: `on_background` at 4% opacity
  - Blur radius: 32
  - Y-offset: 16

- **The "Ghost Border":** Where containment is required for high-density data, use `outline_variant` (#c3c6d5) at 20% opacity.

---

### 6. Components

- **Buttons:**
  - **Primary:** Solid `primary` background, `on_primary` text. Border radius: 4px.
  - **Primary on Cobalt:** White background, `primary` text. Border radius: 4px.
  - **Disabled on Cobalt:** `rgba(255,255,255,0.15)` background, `rgba(255,255,255,0.35)` text.
  - **Secondary:** `surface_container_highest` background, `primary` text. No border.

- **Cards & Lists:**
  - **Forbidden:** 1px divider lines.
  - **Use instead:** White space or tonal shifts between `surface` tiers.

- **Chips:**
  - Default: `surface_container_high` background, no border.
  - Selected: `primary` background with `on_primary` text.

- **Progress Indicators:**
  - Bar height: 3px. Track: `surface_container_highest` (#e1e3e5). Indicator: `primary`. Border radius: 1.5px.

- **Section Labels:**
  - `Manrope_500Medium`, 11px, `on_surface_variant`, `letterSpacing: 2`, `textTransform: 'uppercase'`

---

### 7. Do's and Don'ts

- **DO:** Use extreme white space. If you think there is enough space, add another 12px.
- **DO:** Use asymmetry. Align a headline to the left but place the supporting body text in a narrower column offset to the right.
- **DO:** Let typography be the design. Large Epilogue numbers and headings create visual impact without decoration.
- **DON'T:** Use pure black (#000000). Always use `on_background` (#191c1d).
- **DON'T:** Use pill buttons (9999px radius). Stick to 4px border radius.
- **DON'T:** Decorate existing layouts. Rethink information hierarchy from the user's perspective first.
- **DO:** Ensure accessibility by checking `on_surface_variant` (#434653) against white; use it for secondary text only if it meets the 4.5:1 ratio.
