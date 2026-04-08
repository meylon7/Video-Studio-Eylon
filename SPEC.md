# SPEC.md

## Project Name
Starter Product Demo

## Objective
Create a first working showcase video using `digitalsamba/claude-code-video-toolkit`.
The goal is to validate the toolkit workflow end-to-end, not to maximize complexity.

## Primary Deliverable
- One 30–45 second branded explainer / product demo in MP4

## Secondary Deliverables
- Editable project structure under `projects/`
- Reusable brand profile
- Reusable scene pattern for future demos

## Audience
- Prospective customers
- Webinar or course viewers
- Internal stakeholders who need a concise visual demo

## Video Format
- Orientation: landscape
- Resolution: 1920x1080
- Frame rate: 30fps
- Duration: 30–45 sec
- Tone: premium, concise, modern, credible

## Success Criteria
- The viewer understands the offer within the first 8 seconds.
- The video communicates one clear value proposition.
- The design looks intentional and consistent.
- The project can be resumed in a later Claude Code session.
- The final render is shareable without manual repair.

## Recommended Template
Use `product-demo` unless the actual brief is closer to a sprint update.

## Recommended Brand Setup
Create or reuse a brand profile with:
- Primary color
- Secondary color
- Neutral background colors
- Typography choices
- Logo asset
- Voice settings if narration is used

## Narrative Structure
### Scene 1 — Hook
Goal: capture attention immediately.
Content:
- short headline or bold visual opener
- no more than one idea
Target length: 4–6 sec

### Scene 2 — Problem
Goal: show the friction or old way.
Content:
- 1 short problem statement
- supporting visual or interface moment
Target length: 4–6 sec

### Scene 3 — Reveal
Goal: introduce the product, workflow, or method.
Content:
- product name or concept reveal
- stronger visual identity
Target length: 5–7 sec

### Scene 4 — Core Capability
Goal: prove the main value.
Content:
- 1 capability
- 1 concrete visual cue
Target length: 5–7 sec

### Scene 5 — Supporting Proof
Goal: support trust and differentiation.
Possible content:
- quick UI demo
- 2–3 compact highlights
- before/after
Target length: 5–7 sec

### Scene 6 — CTA
Goal: close clearly.
Content:
- simple call to action
- logo / URL / brand end frame
Target length: 4–6 sec

## Visual Requirements
- Strong hierarchy
- Large readable typography
- Generous spacing
- Consistent motion language
- Controlled use of transitions
- No cluttered slides

## Audio Requirements
If narration is included:
- natural pacing
- clean pronunciation
- brief sentences
- music below narration, never competing

If narration is not included:
- design motion and timing must still communicate the core message

## Asset Requirements
Preferred asset sources:
1. existing brand assets
2. Playwright demo capture via `/record-demo`
3. toolkit-supported generation tools
4. manually added assets

## Review Checklist
Before final render, verify:
- scene order makes sense
- text is readable at normal playback speed
- no awkward pauses
- transitions support the story
- visuals match the brand
- audio starts and ends cleanly
- final CTA is visible long enough

## Technical Workflow
1. Run `/setup` if needed
2. Create or select a brand with `/brand`
3. Select template with `/template`
4. Create project with `/video`
5. Capture demo if needed with `/record-demo`
6. Review scenes with `/scene-review`
7. Improve weak scenes with `/design`
8. Generate narration with `/generate-voiceover` if needed
9. Render final MP4

## Out of Scope for V1
- multiple aspect ratios
- multilingual versions
- advanced character animation
- custom 3D scenes
- long-form voice-led storytelling
- complex branching templates

## Risks
- overdesign in the first pass
- weak asset quality
- too much text
- unbalanced music and voiceover
- trying to use every tool at once

## V1 Acceptance
Approve V1 only if:
- the core message is obvious
- the render is clean
- the workflow can be repeated
- next improvements are small, not structural
