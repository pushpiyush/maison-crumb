# Maison Crumb

A multi-page, fully responsive website for a home bakery business, built with vanilla HTML, CSS, and JavaScript — no frameworks or libraries.

## Live Demo
https://pushpiyush.github.io/maison-crumb/

## Pages
- **Home** — Hero section with a day-of-week-based "Featured This Week" rotation and a scroll-driven flour-particle effect
- **Menu** — Live search/filter with FLIP-animated grid reflow and category-specific custom SVG icons
- **Order** — Multi-step order builder with live price calculation, custom flavor swatches, real availability-checked date picker, and localStorage order persistence
- **About** — Baker's story page
- **Contact** — Contact form (Formspree) with a custom-built FAQ accordion

## Features
- Pure vanilla JS — no frameworks or build tools
- Real client-side logic: live price calculation, date-conflict checking, localStorage persistence
- Custom animations: FLIP-based filtering, canvas particle effects, animated step transitions
- Fully responsive design across mobile, tablet, and desktop

## Tech Stack
HTML5, CSS3, JavaScript (ES6+)

## File Structure
```
├── index.html
├── menu.html
├── order.html
├── about.html
├── contact.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── order.js
│   ├── menu.js
│   └── particles.js
└── images/
```

## Run Locally
Clone the repo and open `index.html` in a browser — no build step required.
