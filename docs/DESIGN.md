# Design System Strategy: The Kinetic Gallery

### 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Gallery."** 

We are moving away from the cluttered, heavy aesthetic of traditional "gym" apps and toward the refined, airy precision of high-end editorial fitness. Inspired by the architectural discipline of Apple Fitness+ and the bold, rhythmic energy of Nike Training Club, this system treats every workout as a curated piece of art. 

We break the "template" look through **high-contrast typography scales** and **intentional asymmetry**. Layouts should feel like a premium magazine—large, breathing display type juxtaposed with ultra-refined, technical data points. The interface does not "shout" for attention; it provides a high-performance stage for the user’s movement.

---

### 2. Colors & Tonal Architecture
The palette is rooted in a "Whitescape" philosophy, using Cobalt Blue (`primary: #002897`) as a surgical tool to highlight progress and action.

*   **The "No-Line" Rule:** To maintain a premium feel, 1px solid borders are prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section should sit against a `surface` background to create a "zone" without the visual noise of a line.
*   **Surface Hierarchy & Nesting:** Use surface tiers to create physical layers. A typical page architecture should follow:
    *   **Base:** `surface` (#f8f9fa)
    *   **Sectioning:** `surface_container` (#edeeef)
    *   **Interactive Cards:** `surface_container_lowest` (#ffffff) for a "lifted" paper effect.
*   **The "Glass & Gradient" Rule:** Floating navigation or top bars should utilize Glassmorphism. Use `surface_container_low` at 80% opacity with a `backdrop-blur` of 20px. 
*   **Signature Textures:** For Hero CTAs and high-intensity achievements, use a subtle linear gradient transitioning from `primary` (#002897) to `primary_container` (#003ace) at a 135-degree angle. This adds "soul" and depth to the flat cobalt.

---

### 3. Typography
The system utilizes a dual-font strategy to balance athletic energy with technical precision.

*   **Display & Headlines (Epilogue):** This is our "Athletic" voice. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero headlines. It should feel heavy, confident, and intentional.
*   **Body & Labels (Manrope):** This is our "Technical" voice. Manrope provides a modern, geometric clarity for workout stats and instructions. 
*   **Hierarchy Tip:** Pair a `headline-lg` in Epilogue with a `label-md` in Manrope (uppercase, with 0.05em letter spacing) to create an authoritative, editorial look.

---

### 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than structural scaffolding.

*   **The Layering Principle:** Instead of shadows, stack containers. Place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f3f4f5) background. The 2-bit difference in hex value creates a "soft lift" that feels more expensive than a drop shadow.
*   **Ambient Shadows:** If a floating element (like a FAB or Action Sheet) requires a shadow, use a "Cobalt Tinted Shadow." Use the `on_surface` color at 4% opacity with a 32px blur and 16px Y-offset. This mimics natural light passing through a high-end lens.
*   **The "Ghost Border":** Where containment is required for high-density data, use the `outline_variant` (#c3c6d5) at 20% opacity. This "Ghost Border" provides a hint of structure without interrupting the flow of the white-based design.

---

### 5. Components

*   **Buttons:**
    *   **Primary:** Solid `primary` (#002897) with `on_primary` text. Use `DEFAULT` rounding (0.25rem) for a sharp, professional edge.
    *   **Secondary:** `surface_container_highest` background with `primary` text. No border.
*   **Cards & Lists:** 
    *   **Forbidden:** 1px divider lines.
    *   **Alternative:** Use `spacing-6` (2rem) of vertical white space to separate content, or a subtle shift from `surface` to `surface_container_low`.
*   **Input Fields:** 
    *   Use a "Bottom-Line Only" approach or a `surface_container_low` fill with a "Ghost Border" (20% `outline_variant`). Labels should use `label-sm` in a bold weight to maintain readability.
*   **Chips:** 
    *   Filter chips should be `surface_container_high` with no border. When selected, they transition to `primary` with `on_primary` text.
*   **Progress Indicators:**
    *   Utilize thin, elegant line work. A progress bar should be 2px high using `outline_variant` as the track and `primary` as the indicator.
*   **The "Pulse" Metric (Custom Component):**
    *   For live heart rate or active stats, use `primary` text with a subtle `primary_fixed_dim` (#b8c3ff) glow behind the text to simulate a digital "pulse."

---

### 6. Do’s and Don’ts

*   **DO:** Use extreme white space. If you think there is enough space, add `spacing-2` (0.7rem) more.
*   **DO:** Use asymmetry. Align a headline to the left but place the supporting body text in a narrower column offset to the right.
*   **DON'T:** Use pure black (#000000). Always use `on_background` (#191c1d) to keep the contrast high but the feel "premium."
*   **DON'T:** Use standard "rounded" pill buttons (9999px) for everything. Stick to the `DEFAULT` (0.25rem) for primary actions to maintain the "Kinetic Gallery" architectural feel.
*   **DO:** Use Cobalt Blue (`primary`) sparingly. It is a signal, not a background. If the screen is more than 15% blue, it is no longer minimalist.
*   **DO:** Ensure accessibility by checking `on_surface_variant` (#434653) against the white background; use it for secondary text only if it meets the 4.5:1 ratio.