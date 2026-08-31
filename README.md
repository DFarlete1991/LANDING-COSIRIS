# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Seguridad

El proyecto tiene una auditoría de seguridad basada en las categorías del [OWASP WSTG](https://github.com/OWASP/wstg) que aplican a esta SPA (cabeceras de seguridad, secretos commiteados, dependencias vulnerables, patrones de XSS/`postMessage` inseguros). Corre automáticamente en cada push/PR (`.github/workflows/security-audit.yml`) — un cambio no debería llegar a `main`/`qa` si la falla.

```bash
npm run security-audit   # corre todas las comprobaciones
npm run sync-headers     # regenera vercel.json a partir de scripts/security-headers.mjs
```

Las cabeceras de seguridad (incluida la Content-Security-Policy) viven en una única fuente, `scripts/security-headers.mjs`, y se propagan a `vercel.json` (lo que aplica Vercel en producción) y a `vite.config.ts` (`preview.headers`, para poder probar la CSP en local con `npm run build && npm run preview` antes de cada deploy). Si tocas la CSP porque agregaste un proveedor nuevo (otro pixel, otro mapa, otro webhook), corre `npm run sync-headers` y prueba `npm run preview` en un navegador real antes de mergear — GTM/Google Ads inyecta scripts inline dinámicos que no se pueden fijar por hash, así que cualquier cambio ahí conviene verificarlo visualmente, no solo confiar en la teoría.

Para activar la misma auditoría como pre-commit local (feedback antes de hacer push, además de lo que ya corre en CI):

```bash
git config core.hooksPath .githooks
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
