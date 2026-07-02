# Pro Grid Generator

A modern grid generator built with Next.js 15, React 19, TypeScript, and following Feature-Sliced Design (FSD) architecture. Generate grid code for multiple UI frameworks and CSS approaches with a visual drag-and-drop interface.

## Tech Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Internationalization**: next-intl (EN, ES, RU)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Architecture**: Feature-Sliced Design (FSD)
- **Utilities**: class-variance-authority, clsx, tailwind-merge

## Supported Technologies

- Material UI v7
- Ant Design v6
- CSS Grid (raw CSS)
- Tailwind CSS

## Features

- Visual grid editor with drag-and-drop interface
- Multi-language support (English, Spanish, Russian)
- Technology-specific routing (`/en/material-ui`, `/es/ant-design`, etc.)
- SEO optimized with technology-specific metadata
- Dark mode support
- Real-time code generation

## Project Structure

```
app/
├── [locale]/
│   └── [technology]/
│       ├── layout.tsx      # SEO metadata generation
│       └── page.tsx        # Grid editor page
├── layout.tsx              # Root layout
└── globals.css             # Tailwind styles

src/
├── i18n/                   # next-intl configuration
├── shared/                 # Reusable code (UI, lib, config, providers)
│   ├── ui/                 # shadcn/ui components
│   ├── lib/                # Utilities
│   ├── config/             # App configuration (SEO, etc.)
│   ├── providers/          # React providers (theme, etc.)
│   └── types/              # TypeScript types (routing, code-generator, etc.)
├── entities/               # Business entities (e.g. grid)
├── features/               # User scenarios and features
├── widgets/                # Composite UI blocks
└── views/                  # Application pages (e.g. grid-editor)

messages/
├── en.json                 # English translations
├── es.json                 # Spanish translations
└── ru.json                 # Russian translations
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000` and will redirect to `/en/tailwind` by default.

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Routing

The application uses technology-based routing with locale support:

- `/` → Redirects to `/en/tailwind`
- `/[locale]` → Redirects to `/[locale]/tailwind`
- `/[locale]/[technology]` → Grid editor for specific technology

### Supported Routes

- `/en/material-ui`, `/es/material-ui`, `/ru/material-ui`
- `/en/ant-design`, `/es/ant-design`, `/ru/ant-design`
- `/en/raw-css`, `/es/raw-css`, `/ru/raw-css`
- `/en/tailwind`, `/es/tailwind`, `/ru/tailwind`

## Internationalization

The project uses `next-intl` for internationalization. Translation files are located in the `messages/` directory.

### Adding Translations

1. Add translation keys to `messages/en.json`
2. Add corresponding translations to `messages/es.json` and `messages/ru.json`
3. Use `useTranslations()` hook in components:

```tsx
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations()
  return <h1>{t('header.title')}</h1>
}
```

## SEO

Each technology page has optimized SEO metadata including:
- Technology-specific titles and descriptions
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Language alternates

Metadata is generated in `src/shared/config/seo.ts` and configured in `app/[locale]/[technology]/layout.tsx`.

## Analytics

Amplitude page-view tracking is enabled when `NEXT_PUBLIC_AMPLITUDE_API_KEY` is set.
The app captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`, stores first-touch and latest-touch attribution in `localStorage`, and sends it with each page view.

Ready-to-use launch links are in **[docs/UTM_LINKS.csv](docs/UTM_LINKS.csv)**.

## shadcn/ui Components

This project uses shadcn/ui components. To add new components:

```bash
npx shadcn@latest add button
```

**Note:** Due to path alias resolution, shadcn creates files in a literal `@` folder. After adding components, move them to the correct location:

```bash
# Add component
npx shadcn@latest add dialog

# Move to correct location
mv ./@/shared/ui/dialog.tsx ./src/shared/ui/
rm -rf ./@

# Export from index.ts
# Add to src/shared/ui/index.ts: export { Dialog } from './dialog'
```

### Available Components

Current components in `src/shared/ui/`:
- `Button` - With variants: default, destructive, outline, secondary, ghost, link
- `Card` - With subcomponents: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Input` - Text input field
- `Checkbox` - Checkbox input

Add more from: https://ui.shadcn.com/docs/components

## Feature-Sliced Design (FSD)

This project follows the FSD methodology for better code organization and scalability.

### Import Rules

- **Shared layer**: Can import from shared only
- **Entities layer**: Can import from shared and entities
- **Features layer**: Can import from shared, entities, and features
- **Widgets layer**: Can import from shared, entities, features, and widgets
- **Views layer**: Can import from all layers

### Entry Point Pattern

Each slice (entity, feature, widget) has **exactly ONE** `index.ts` file at its root level for manual control over exports.

Example:
```ts
// entities/grid/index.ts
export type { GridState, GridItem } from './model/types'
export { GridActions } from './ui/grid-actions'
```

## Path Aliases

The project uses `@/*` as a path alias pointing to `./src/*`:

```tsx
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { GridState } from '@/entities/grid'
```

## Styling

- Use Tailwind CSS utility classes for styling
- Use the `cn()` utility function for conditional class names
- CSS variables are defined in `app/globals.css` for theming
- Supports dark mode with the `.dark` class

## Code Style

- Use function declarations for React components (not arrow functions)
- Use TypeScript interfaces for props
- Follow strict TypeScript configuration
- Use the FSD import rules
- Add `'use client'` directive to components using hooks or browser APIs

## Deployment

The app is deployed to a VPS with Docker and GitHub Actions. Deploys run when a **release is published** (after merging the Release Please PR), not on every push to trunk.

Full guide (VPS setup, GitHub secrets, domain, Nginx, HTTPS): **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

Quick links:

- **GitHub:** Secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY, GHCR_TOKEN, RELEASE_PLEASE_TOKEN), default branch `trunk`.
- **VPS:** Docker, deploy user with SSH key, user in `docker` group.
- **Release:** Use conventional commits (`feat:`, `fix:`), merge to trunk, then merge the Release PR.
- **Domain:** DNS A record → VPS IP; on VPS: Nginx proxy to `127.0.0.1:3002`, Certbot for HTTPS. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/nginx-pro-grid-generator.online.conf](docs/nginx-pro-grid-generator.online.conf).

## License

MIT
