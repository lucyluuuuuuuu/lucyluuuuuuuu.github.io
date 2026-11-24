# Talkie Web case study

## Scope and narrative

Route: `/work/Talkie-Web/`. Project ID: `talkie-web`.

The case follows the visitor journey: find a suitable character, enter the conversation, then participate through reply assistance, persona and revisiting conversations. Homepage and chat comparisons explain the redesign; subsequent features show how that foundation grew. The homepage registry places Talkie second, after MiniMax.

Confirmed by the portfolio owner:

- Jul 2024–Apr 2025.
- Sole Product Designer for the redesign and subsequent features.
- Team: the designer, one PM, two frontend engineers and two backend engineers.
- Goals: help visitors find a suitable character on arrival; deepen immersion and emotional connection during chat.

No quantified outcome or user-research result was supplied. Evaluation questions are explicitly prospective. Page names containing month/day labels do not establish release dates or years. The case does not attribute the current live site's later changes to this period.

## Design evidence

Source: the owner's [Talkie Web Figma file](https://www.figma.com/design/zJbbFVtS5OC8pRAdO3ga3E/Talkie-Web). Inspected and exported on 2026-11-24. Original screens were exported through the Figma connector and compressed to WebP; they were not recreated with generated imagery.

| Asset in `public/assets/images/talkie-web/` | Page ID | Frame ID | Use |
| --- | --- | --- | --- |
| `old-home-logged.webp` | `1:15` | `1:97061` | Previous homepage, signed in |
| `new-home.webp` | `1:14` | `1:113781` | Redesigned homepage, signed in |
| `old-chat.webp` | `1:15` | `1:92882` | Previous conversation |
| `new-chat.webp` | `1:14` | `1:115303` | Redesigned conversation |
| `scenarios.webp`, `cover.webp` | `1:13` | `1:146738` | Scenario discovery and project cover |
| `search.webp` | `1:7` | `1:176824` | Search exploration |
| `inspiration.webp` | `0:1` | `1:206589` | Three reply suggestions |
| `inspiration-edit.webp` | `0:1` | `1:206909` | Selected reply in the composer |
| `persona.webp` | `1:215675` | `2:30648` | Default persona editor |
| `persona-mobile.webp` | `1:215675` | `2:33690` | Default and character-specific mobile entries |
| `memories.webp` | `1:9` | `1:161796` | Conversation reading view and chat entry |

Relevant interaction annotations:

- `1:114703`, `1:114717`: card hover and Chat Now reveal; 20 px movement, opacity transition, 300 ms. This is product handoff evidence, not the portfolio's animation configuration.
- `1:125965`–`1:125973`: collapsible panels and compact character identity.
- `1:208350`, `1:208428`, `1:208430`, `1:208432`, `1:208434`: three reply choices, selection populating the input, retained/editable text and a separate send action. Additional states specify loading, cancellation, failure and retry.
- `2:31479`–`2:31663`: default/global and individual-character persona scopes, first creation and default reuse.
- `1:161779`: Memories chat entry click target; signed-out visitors authenticate and return to the same page. This feature is not described as persistent AI memory.
- Page `1:215676`: message editing, recall and rewind confirmations/limits.

The previous design already had recommendations, categories, conversation starters and a dark interface. The narrative attributes the redesign to hierarchy, navigation and a quieter conversation frame rather than claiming those existing capabilities were new.

## Maintenance and checks

Copy lives in `src/content/talkie-web/`; shared wrappers and ordering live in `src/design/pages/talkie-web/`. Existing case-study rendering, global navigation, logo motion and project cards are reused. Talkie-specific styles are scoped under `.talkie-case-root`.

Build and validation commands:

```sh
npm run build
npm run check
npm run check:hover
```

The asset and anchor checker covers all generated pages. Browser review should include the homepage project order, before/after figures, mobile persona figure, chapter links, full-image links and the MiniMax → Talkie → Espoirer route at desktop, tablet and phone sizes.
