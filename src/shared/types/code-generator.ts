import type { Technology } from './routing'

export type CodeFormat = 'jsx' | 'html'

export const CODE_FORMATS = ['jsx', 'html'] as const

export type GridBreakpoint =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'

export interface GridBreakpointDefinition {
  id: GridBreakpoint
  label: string
  minWidth: number
}

export const TECHNOLOGY_BREAKPOINTS: Record<
  Technology,
  GridBreakpointDefinition[]
> = {
  'material-ui': [
    { id: 'xs', label: 'XS', minWidth: 0 },
    { id: 'sm', label: 'SM', minWidth: 600 },
    { id: 'md', label: 'MD', minWidth: 900 },
    { id: 'lg', label: 'LG', minWidth: 1200 },
    { id: 'xl', label: 'XL', minWidth: 1536 },
    { id: '2xl', label: '2XL', minWidth: 1920 },
  ],
  'ant-design': [
    { id: 'xs', label: 'XS', minWidth: 0 },
    { id: 'sm', label: 'SM', minWidth: 576 },
    { id: 'md', label: 'MD', minWidth: 768 },
    { id: 'lg', label: 'LG', minWidth: 992 },
    { id: 'xl', label: 'XL', minWidth: 1200 },
    { id: '2xl', label: '2XL', minWidth: 1600 },
  ],
  mantine: [
    { id: 'xs', label: 'XS', minWidth: 0 },
    { id: 'sm', label: 'SM', minWidth: 576 },
    { id: 'md', label: 'MD', minWidth: 768 },
    { id: 'lg', label: 'LG', minWidth: 992 },
    { id: 'xl', label: 'XL', minWidth: 1200 },
    { id: '2xl', label: '2XL', minWidth: 1400 },
  ],
  'raw-css': [
    { id: 'xs', label: 'XS', minWidth: 0 },
    { id: 'sm', label: 'SM', minWidth: 640 },
    { id: 'md', label: 'MD', minWidth: 768 },
    { id: 'lg', label: 'LG', minWidth: 1024 },
    { id: 'xl', label: 'XL', minWidth: 1280 },
    { id: '2xl', label: '2XL', minWidth: 1536 },
  ],
  tailwind: [
    { id: 'xs', label: 'XS', minWidth: 0 },
    { id: 'sm', label: 'SM', minWidth: 640 },
    { id: 'md', label: 'MD', minWidth: 768 },
    { id: 'lg', label: 'LG', minWidth: 1024 },
    { id: 'xl', label: 'XL', minWidth: 1280 },
    { id: '2xl', label: '2XL', minWidth: 1536 },
  ],
}

export function getTechnologyBreakpoints(
  technology: Technology
): GridBreakpointDefinition[] {
  return TECHNOLOGY_BREAKPOINTS[technology]
}
