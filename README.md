# Time, Date & Stopwatch App

A single-page React application featuring:
- A real-time clock with 12/24-hour toggle and a circular seconds ring
- A stopwatch with start/pause/resume, lap tracking, and fastest/slowest lap highlighting
- A calendar month view with date selection and today-jump
- A dark/light mode toggle with an accent color that shifts with the time of day

## Project Structure

```
timedate-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```

## Setup

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- No external UI libraries — styling is done entirely with Tailwind CSS utility classes.
- No `localStorage` is used; all state (theme, format, stopwatch, calendar selection) resets on reload by design.
- Requires Node.js 18+.
