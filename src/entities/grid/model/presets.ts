import type { GridPreset } from './types'

export const GRID_PRESETS: GridPreset[] = [
  {
    id: 'dashboard-overview',
    name: 'Dashboard Overview',
    description: 'Hero metric row with two lower content panels.',
    state: {
      config: { columns: 6, rows: 4, gap: 12 },
      items: [
        { id: 'dashboard-hero', colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 1 },
        { id: 'dashboard-chart', colStart: 1, colSpan: 4, rowStart: 2, rowSpan: 2 },
        { id: 'dashboard-side', colStart: 5, colSpan: 2, rowStart: 2, rowSpan: 2 },
        { id: 'dashboard-table', colStart: 1, colSpan: 6, rowStart: 4, rowSpan: 1 },
      ],
    },
  },
  {
    id: 'analytics-board',
    name: 'Analytics Board',
    description: 'Large chart with compact insight cards.',
    state: {
      config: { columns: 8, rows: 5, gap: 10 },
      items: [
        { id: 'analytics-main', colStart: 1, colSpan: 5, rowStart: 1, rowSpan: 3 },
        { id: 'analytics-kpi-1', colStart: 6, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { id: 'analytics-kpi-2', colStart: 6, colSpan: 3, rowStart: 2, rowSpan: 1 },
        { id: 'analytics-kpi-3', colStart: 6, colSpan: 3, rowStart: 3, rowSpan: 1 },
        { id: 'analytics-list', colStart: 1, colSpan: 8, rowStart: 4, rowSpan: 2 },
      ],
    },
  },
  {
    id: 'portfolio-masonry',
    name: 'Portfolio Masonry',
    description: 'Asymmetric content grid for visual projects.',
    state: {
      config: { columns: 6, rows: 5, gap: 12 },
      items: [
        { id: 'portfolio-feature', colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 3 },
        { id: 'portfolio-a', colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 2 },
        { id: 'portfolio-b', colStart: 4, colSpan: 1, rowStart: 3, rowSpan: 1 },
        { id: 'portfolio-c', colStart: 5, colSpan: 2, rowStart: 3, rowSpan: 1 },
        { id: 'portfolio-d', colStart: 1, colSpan: 2, rowStart: 4, rowSpan: 2 },
        { id: 'portfolio-e', colStart: 3, colSpan: 4, rowStart: 4, rowSpan: 2 },
      ],
    },
  },
  {
    id: 'article-layout',
    name: 'Article Layout',
    description: 'Editorial body with supporting sidebar modules.',
    state: {
      config: { columns: 5, rows: 5, gap: 14 },
      items: [
        { id: 'article-title', colStart: 1, colSpan: 5, rowStart: 1, rowSpan: 1 },
        { id: 'article-body', colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 4 },
        { id: 'article-author', colStart: 4, colSpan: 2, rowStart: 2, rowSpan: 1 },
        { id: 'article-related', colStart: 4, colSpan: 2, rowStart: 3, rowSpan: 2 },
        { id: 'article-cta', colStart: 4, colSpan: 2, rowStart: 5, rowSpan: 1 },
      ],
    },
  },
  {
    id: 'product-detail',
    name: 'Product Detail',
    description: 'Image gallery, purchase panel, and detail sections.',
    state: {
      config: { columns: 6, rows: 5, gap: 12 },
      items: [
        { id: 'product-media', colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 3 },
        { id: 'product-summary', colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 2 },
        { id: 'product-actions', colStart: 4, colSpan: 3, rowStart: 3, rowSpan: 1 },
        { id: 'product-details', colStart: 1, colSpan: 4, rowStart: 4, rowSpan: 2 },
        { id: 'product-specs', colStart: 5, colSpan: 2, rowStart: 4, rowSpan: 2 },
      ],
    },
  },
  {
    id: 'pricing-grid',
    name: 'Pricing Grid',
    description: 'Balanced cards with a featured center plan.',
    state: {
      config: { columns: 6, rows: 4, gap: 12 },
      items: [
        { id: 'pricing-header', colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 1 },
        { id: 'pricing-basic', colStart: 1, colSpan: 2, rowStart: 2, rowSpan: 2 },
        { id: 'pricing-pro', colStart: 3, colSpan: 2, rowStart: 2, rowSpan: 3 },
        { id: 'pricing-team', colStart: 5, colSpan: 2, rowStart: 2, rowSpan: 2 },
        { id: 'pricing-footer', colStart: 1, colSpan: 2, rowStart: 4, rowSpan: 1 },
        { id: 'pricing-note', colStart: 5, colSpan: 2, rowStart: 4, rowSpan: 1 },
      ],
    },
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    description: 'Sidebar-heavy operations screen.',
    state: {
      config: { columns: 7, rows: 5, gap: 10 },
      items: [
        { id: 'admin-nav', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 5 },
        { id: 'admin-topbar', colStart: 2, colSpan: 6, rowStart: 1, rowSpan: 1 },
        { id: 'admin-main', colStart: 2, colSpan: 4, rowStart: 2, rowSpan: 3 },
        { id: 'admin-inspector', colStart: 6, colSpan: 2, rowStart: 2, rowSpan: 3 },
        { id: 'admin-log', colStart: 2, colSpan: 6, rowStart: 5, rowSpan: 1 },
      ],
    },
  },
  {
    id: 'media-gallery',
    name: 'Media Gallery',
    description: 'Featured media item plus supporting thumbnails.',
    state: {
      config: { columns: 8, rows: 4, gap: 8 },
      items: [
        { id: 'media-feature', colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 4 },
        { id: 'media-a', colStart: 5, colSpan: 2, rowStart: 1, rowSpan: 2 },
        { id: 'media-b', colStart: 7, colSpan: 2, rowStart: 1, rowSpan: 1 },
        { id: 'media-c', colStart: 7, colSpan: 2, rowStart: 2, rowSpan: 1 },
        { id: 'media-d', colStart: 5, colSpan: 4, rowStart: 3, rowSpan: 2 },
      ],
    },
  },
  {
    id: 'kanban-snapshot',
    name: 'Kanban Snapshot',
    description: 'Four-lane work board with summary row.',
    state: {
      config: { columns: 8, rows: 5, gap: 10 },
      items: [
        { id: 'kanban-summary', colStart: 1, colSpan: 8, rowStart: 1, rowSpan: 1 },
        { id: 'kanban-backlog', colStart: 1, colSpan: 2, rowStart: 2, rowSpan: 3 },
        { id: 'kanban-ready', colStart: 3, colSpan: 2, rowStart: 2, rowSpan: 3 },
        { id: 'kanban-doing', colStart: 5, colSpan: 2, rowStart: 2, rowSpan: 3 },
        { id: 'kanban-done', colStart: 7, colSpan: 2, rowStart: 2, rowSpan: 3 },
        { id: 'kanban-footer', colStart: 1, colSpan: 8, rowStart: 5, rowSpan: 1 },
      ],
    },
  },
  {
    id: 'landing-sections',
    name: 'Landing Sections',
    description: 'Hero, feature blocks, proof, and conversion row.',
    state: {
      config: { columns: 6, rows: 6, gap: 14 },
      items: [
        { id: 'landing-hero', colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 2 },
        { id: 'landing-feature-a', colStart: 1, colSpan: 2, rowStart: 3, rowSpan: 1 },
        { id: 'landing-feature-b', colStart: 3, colSpan: 2, rowStart: 3, rowSpan: 1 },
        { id: 'landing-feature-c', colStart: 5, colSpan: 2, rowStart: 3, rowSpan: 1 },
        { id: 'landing-proof', colStart: 1, colSpan: 4, rowStart: 4, rowSpan: 2 },
        { id: 'landing-aside', colStart: 5, colSpan: 2, rowStart: 4, rowSpan: 2 },
        { id: 'landing-cta', colStart: 1, colSpan: 6, rowStart: 6, rowSpan: 1 },
      ],
    },
  },
]

export function getGridPresetSlug(preset: GridPreset): string {
  return preset.id
}

export function findGridPreset(slug: string): GridPreset | undefined {
  return GRID_PRESETS.find((preset) => getGridPresetSlug(preset) === slug)
}
