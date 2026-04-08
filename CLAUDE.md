# CLAUDE.md

## Role
You are operating inside a `digitalsamba/claude-code-video-toolkit` project.
Your job is to create a first shippable video project with the toolkit's native workflow, not to invent a parallel stack.

## Project Goal
Produce a short branded explainer / product demo video in MP4.
Default target:
- Duration: 30–45 seconds
- Format: 1920x1080, 30fps, landscape
- Style: clean, cinematic, modern, high contrast, premium motion-graphics feel
- Output: one polished MP4 plus organized project files

## Non-Negotiables
- Use the toolkit's built-in workflow and slash commands whenever possible.
- Prefer existing templates before creating custom infrastructure.
- Keep the project resumable across sessions.
- Update project state honestly. Do not mark work complete if assets, audio, or renders are missing.
- Use the brand profile consistently.
- Keep edits modular and production-safe.

## First Actions
1. Inspect repository structure relevant to execution:
   - `templates/`
   - `brands/`
   - `projects/`
   - `examples/`
   - `lib/`
   - `tools/`
2. Confirm prerequisites and environment.
3. Run the native setup path if not already configured.
4. Start from the closest existing template.
5. Create a new project under `projects/`.
6. Generate or refine scenes, assets, audio, and final render.

## Preferred Native Commands
Use these in order when relevant:
- `/setup`
- `/brand`
- `/template`
- `/video`
- `/record-demo`
- `/scene-review`
- `/design`
- `/generate-voiceover`
- `/versions`

## Default Working Method
### 1) Setup
- If cloud/audio/image tooling is not configured, run `/setup`.
- Check whether Python tools are available when audio or AI assets are required.

### 2) Brand
- Reuse an existing brand if it fits.
- Otherwise create `brands/my-brand/` with:
  - `brand.json`
  - `voice.json`
  - `assets/`
- Keep colors, typography, logo usage, and voice settings centralized in the brand profile.

### 3) Template Selection
- Prefer `product-demo` for a first marketing-style project.
- Prefer `sprint-review` or `sprint-review-v2` only if the brief is operational or update-oriented.
- Do not build a template from scratch unless the existing ones clearly fail the brief.

### 4) Project Creation
Create a new project with these defaults unless SPEC.md overrides them:
- Type: product demo / explainer
- Length: 30–45 sec
- 5–7 scenes max
- Clear CTA in the final scene
- One visual idea per scene
- Minimal on-screen text

### 5) Scene Structure
Use this baseline structure:
1. Hook
2. Problem / friction
3. Product or workflow reveal
4. Key capability / proof
5. Supporting detail or visual demo
6. CTA / closing brand frame

### 6) Asset Strategy
Prefer assets in this order:
1. Existing project or brand assets
2. Captured product demo via `/record-demo`
3. Toolkit-supported generated assets
4. Custom designed assets only when needed

### 7) Audio Strategy
- Use AI voiceover only if it improves the piece.
- Keep pacing steady and natural.
- Add background music only if it does not fight narration.
- Maintain headroom and clarity.

### 8) Review Loop
- Use `/scene-review` before final render.
- Use `/design` on weak scenes instead of changing the whole project.
- Fix one problem at a time: timing, hierarchy, motion, readability, transitions, audio mix.

### 9) Rendering
For final delivery:
- Render landscape MP4 first.
- Verify text safe areas, timing, audio sync, scene boundaries, and ending frame.
- Keep a preview render if iteration is still expected.

## File and State Discipline
Maintain project continuity through the toolkit's project system.
- Respect `project.json` as the source of truth for phase and asset state.
- Keep files named consistently.
- Do not scatter temporary files across the repo.
- Place generated deliverables in the project's expected output locations.

## Quality Bar
The output must be:
- Coherent
- Visually consistent
- Brand-aligned
- Render-safe
- Understandable without extra explanation
- Short enough to hold attention

## Constraints
- Do not overcomplicate the first version.
- Do not introduce an external editing pipeline unless explicitly required.
- Do not use excessive transitions or dense text blocks.
- Avoid gimmicky animation that reduces clarity.

## Fallback Rules
- If audio generation is unavailable, proceed with a silent or music-only version and note it clearly.
- If cloud GPU tools are unavailable, use static assets, captured demos, and Remotion-native motion.
- If branding is incomplete, use a neutral temporary brand and document what must be replaced.

## Definition of Done
The first version is done when all are true:
- A project exists under `projects/`
- Brand and template choices are explicit
- Scene plan is implemented
- Audio status is clear
- At least one review pass is complete
- A valid MP4 render exists
- Remaining gaps are documented briefly
