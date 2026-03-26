```markdown
# The Design System: High-End Memorabilia Vault

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system moves away from the aggressive, high-energy clichés of sports marketing and instead adopts the quiet, authoritative aesthetic of a high-end automotive configurator or a private museum vault. The goal is to treat every piece of baseball memorabilia—from a T206 Wagner to a game-worn jersey—as a high-value asset in a secure, climate-controlled digital environment.

To break the "template" look, we utilize **Intentional Asymmetry**. Layouts should not always be perfectly centered; use large-scale typography (`display-lg`) offset against smaller, high-density data clusters (`label-sm`). By overlapping high-resolution photography with semi-transparent glass layers, we create a sense of depth that feels architectural rather than flat.

## 2. Colors & Tonal Depth
The palette is rooted in deep obsidian tones, punctuated by a surgical "Electric Blue" and "Muted Gold" for high-status verification.

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** To separate the navigation from the hero or the sidebar from the main feed, use background color shifts only. Use `surface_container_lowest` (#0e0e0e) for the global background and `surface_container` (#201f1f) for the primary content areas.

### Surface Hierarchy & Nesting
Hierarchy is achieved through "Tonal Stacking." Imagine the UI as layers of dark obsidian:
*   **Base Layer:** `background` (#131313)
*   **Secondary Section:** `surface_container_low` (#1c1b1b)
*   **Interactive Cards:** `surface_container_high` (#2a2a2a)
*   **Elevated Overlays:** `surface_bright` (#3a3939)

### The "Glass & Gradient" Rule
For floating elements like "Quick View" modals or dropdowns, use Glassmorphism. Apply a 12px to 20px `backdrop-blur` with a 60% opacity fill of `surface_container_highest`. 

**Signature Texture:** Use a subtle linear gradient on primary CTAs—from `primary` (#adc6ff) to `primary_container` (#4d8eff)—at a 135-degree angle. This provides a "metallic" sheen reminiscent of premium automotive finishes.

## 3. Typography
Typography is the voice of the curator. It must feel precise, expensive, and deliberate.

*   **Display & Headlines (Space Grotesk):** These should be treated as editorial elements. Use wide tracking (+5% to +10%) and uppercase styling for `headline-sm` and `headline-md` to mimic high-end watch catalogs.
*   **Body (Inter):** Used for descriptions and provenance details. Maintain a generous line-height (1.6) to ensure the dark theme remains readable and "breathable."
*   **Data & IDs (Berkeley Mono / Monospace):** All serial numbers, PSA grades, and transaction hashes must use monospace. This injects a "technical/vault" feel into the aesthetic, signaling authenticity and precision.

## 4. Elevation & Depth
We reject the standard "drop shadow." Depth is a result of light and material, not artificial fuzziness.

*   **Tonal Layering:** To "lift" a card, do not add a shadow. Instead, change its background token from `surface_container` to `surface_container_high`.
*   **Ambient Shadows:** If a component *must* float (e.g., a floating action button), use a 32px blur at 6% opacity using a tinted shadow color derived from `primary_fixed_dim`.
*   **The "Ghost Border" Fallback:** In high-density data views where tonal shifts aren't enough, use a **Ghost Border**. This is a 1px stroke using `outline_variant` at 15% opacity. It should be barely perceptible—visible only when the eye seeks it.

## 5. Components

### Buttons & Interaction
*   **Primary:** Gradient fill (`primary` to `primary_container`) with `on_primary` text. No border. 6px radius (`md`).
*   **Secondary:** Ghost style. Transparent background with a `Ghost Border` and `primary` text.
*   **Tertiary:** Plain text with `primary` color and a subtle underline on hover.

### Cards & Memorabilia Displays
*   **The Rule of No Dividers:** Forbid the use of horizontal lines to separate items in a list. Instead, use a 12px (`3`) or 16px (`4`) vertical gap from the spacing scale.
*   **Image Handling:** Memorabilia should be masked with `rounded-lg` (8px). Use a very subtle inner glow (`inset 0 1px 1px rgba(255,255,255,0.05)`) to make the image "pop" against the dark surface.

### Status Badges (The "Grade" Badge)
*   **PSA/BGS Grades:** Use `secondary_container` (#8f7100) for the background and `secondary_fixed` (#ffe08d) for the text. This creates a "Muted Gold" effect that signifies value without looking "yellow."

### Input Fields
*   **Form Style:** Use `surface_container_lowest` as the input background. On focus, do not use a thick border; instead, transition the background to `surface_container_high` and change the label color to `primary`.

## 6. Do’s and Don’ts

### Do:
*   **Do** use `label-sm` in monospace for all technical data (e.g., "1/100 Limited Edition").
*   **Do** embrace negative space. If a layout feels "crowded," double the spacing token (e.g., move from `10` to `20`).
*   **Do** use subtle transitions (200ms ease-out) for all hover states to maintain the "premium" feel.

### Don’t:
*   **Don’t** use "Sports Red" or "Stadium Green." This is a vault, not a locker room.
*   **Don’t** use high-contrast white (#FFFFFF). Always use `on_background` (#e5e2e1) to prevent eye strain on the dark canvas.
*   **Don’t** use 100% opaque borders. They break the "Liquid Obsidian" feel of the interface.
*   **Don’t** use iconography with heavy fills. Use thin-stroke (1px or 1.5px) "linear" icons to match the technicality of the monospace type.