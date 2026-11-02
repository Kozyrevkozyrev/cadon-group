# CADON GROUP

English-language corporate website preview for CADON GROUP, with a white layout and responsive desktop and mobile views.

**Website:** https://cadon-group.vercel.app/

## Features

- Company introduction and group overview.
- Eight company profiles with expandable descriptions.
- Group value-chain diagram.
- Contact form with client-side email validation and an optional message.
- Privacy and company-information dialogs.

The contact form is a demonstration: it does not send or store enquiries. Company descriptions originate from the supplied September 2026 presentation and require confirmation before a final launch.

## Files

```text
dist/
  index.html    Page content
  styles.css    Responsive styles
  script.js     Form validation and dialogs
  favicon.svg   Site icon
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

Change page content in `dist/index.html`, visual styles in `dist/styles.css`, and interactions in `dist/script.js`. To enable contact requests, implement a real submission service and update the privacy notice and form messages.
