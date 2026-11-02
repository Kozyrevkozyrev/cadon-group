# CADON GROUP

English-language corporate website preview for CADON GROUP, with a dark layout in the logo's blue, scroll animations and responsive desktop and mobile views.

**Website:** https://cadon-group.vercel.app/

## Features

- Company introduction and group overview.
- Loader: the logo mark draws itself while the companies are counted.
- 3D logo mark (Three.js) cut into eight pieces, one per company: whole in the hero, apart in the group section, whole again by the contact form. Falls back to a drawn group diagram without WebGL.
- Smooth wheel scrolling (Lenis) and a cursor ring that labels company rows.
- Eight company profiles with expandable descriptions, linked to an interactive dot map of Europe and Canada.
- Pinned value chain that lights up step by step as the page scrolls.
- Scroll reveals for headings, text and figures; all motion respects reduced-motion settings.
- Group value-chain diagram.
- Contact form with client-side email validation and an optional message.
- Privacy and company-information dialogs.

The contact form is a demonstration: it does not send or store enquiries. Company descriptions originate from the supplied September 2026 presentation and require confirmation before a final launch.

## Files

```text
dist/
  index.html      Page content (logo paths inlined for animation)
  styles.css      Responsive styles and animations
  script.js       Scroll animations, group map, form validation and dialogs
  scene.js        3D logo mark and its scroll choreography
  mark-data.js    Logo symbol cut into eight sectors for the 3D mark
  map-data.js     Pre-computed dot map of Europe with a Canada inset
  vendor/         Three.js 0.170, RoomEnvironment, Lenis 1.1.18
  fonts/          Manrope and Unbounded (SIL Open Font License), self-hosted
  logo-cadon.svg  Supplied CADON GROUP logo
  favicon.svg     Site icon
vercel.json     Static hosting configuration
```

The website uses HTML, CSS and vanilla JavaScript. No package installation or build step is required.

## Run locally

With Python installed, run from the repository root:

```sh
python -m http.server 4173 --directory dist
```

Open http://localhost:4173/ in a browser.

## Deploy

Import the repository into Vercel as a static project. The included configuration sets `dist` as the output directory with no installation or build command.

Publishing this source repository does not by itself connect it to the existing Vercel project. Automatic deployment from GitHub must be configured separately if desired.

## Editing

Change page content in `dist/index.html`, visual styles in `dist/styles.css`, and interactions in `dist/script.js`. Each company row carries a `data-place` code (`gr`, `nl`, `bg`, `eu`, `ca`, `ch`, `de`) that selects its country on the map. To enable contact requests, implement a real submission service and update the privacy notice and form messages.
