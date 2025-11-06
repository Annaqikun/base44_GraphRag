# base44_frontend — local dev

This repository was scaffolded with a minimal Vite + React setup to enable local development.

How to run (macOS zsh):

1. Install dependencies

```zsh
cd /Users/annaqikun/Documents/PSD/base44_frontend
npm install
```

2. Start dev server

```zsh
npm run dev
```

Notes
- The project uses `@` as an alias to the project root (`vite.config.js` configured this). If you hit import path errors, check imports that use `@`.
- I intentionally did not run `npm install` here; run it locally to download packages.

Tailwind CSS
---------------
This project can use Tailwind CSS. I added Tailwind config and PostCSS config files, and updated `src/styles.css` to include Tailwind directives.

To finish setup locally run (zsh):

```zsh
# install dependencies (yarn)
cd /Users/annaqikun/Documents/PSD/base44_frontend
yarn install

# start the dev server
yarn dev
```

If you want me to run the install and start the dev server here, say "run install and dev" and I'll execute it and report back.
