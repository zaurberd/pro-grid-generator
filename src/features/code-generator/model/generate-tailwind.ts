import type { GridState } from '@/entities/grid'
import {
  getItemById,
  getResponsiveItemIds,
  getResponsiveLayoutEntries,
  hasResponsiveEntries,
  sortGridItems,
  generateTailwindGridClasses,
  generateTailwindGapClass,
  generateTailwindGridColsClass,
  generateTailwindGridRowsClass,
  type ResponsiveGeneratorOptions,
} from './utils'

interface GeneratorOptions extends ResponsiveGeneratorOptions {
  withStyledBorders?: boolean
}

function prefixClass(prefix: string, className: string): string {
  return prefix ? `${prefix}:${className}` : className
}

function generateResponsiveTailwindCode(
  gridState: GridState,
  format: 'jsx' | 'html',
  options: GeneratorOptions
): string {
  const { withStyledBorders = true } = options
  const entries = getResponsiveLayoutEntries(gridState, options)
  const classAttr = format === 'jsx' ? 'className' : 'class'
  const containerClasses = entries.flatMap(({ breakpoint, state }) => {
    const prefix = breakpoint.id === 'xs' ? '' : breakpoint.id
    return [
      prefixClass(prefix, generateTailwindGridColsClass(state.config.columns)),
      prefixClass(prefix, generateTailwindGridRowsClass(state.config.rows)),
      prefixClass(prefix, generateTailwindGapClass(state.config.gap)),
    ]
  })
  const itemIds = getResponsiveItemIds(entries)
  const gridItems = itemIds
    .map((itemId, index) => {
      const classes = entries
        .flatMap(({ breakpoint, state }) => {
          const item = getItemById(state, itemId)
          if (!item) return []

          const prefix = breakpoint.id === 'xs' ? '' : breakpoint.id
          return generateTailwindGridClasses(item, withStyledBorders)
            .split(' ')
            .map((className) => prefixClass(prefix, className))
        })
        .join(' ')

      return `      <div ${classAttr}="${classes}">
        Item ${index + 1}
      </div>`
    })
    .join('\n')

  if (format === 'html') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Tailwind Grid Layout</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="grid ${containerClasses.join(' ')}">
${gridItems || '    <!-- Add grid items here -->'}
  </div>
</body>
</html>`
  }

  return `// Quickstart: https://tailwindcss.com/docs/installation/using-vite

const MyGrid = () => {
  return (
    <div className="grid ${containerClasses.join(' ')}">
${gridItems || '      {/* Grid items code will appear here */}'}
    </div>
  )
}

export default MyGrid;`
}

export function generateTailwindCode(
  gridState: GridState,
  format: 'jsx' | 'html' = 'jsx',
  options: GeneratorOptions = {}
): string {
  const { withStyledBorders = true } = options
  const { config, items } = gridState
  const responsiveEntries = getResponsiveLayoutEntries(gridState, options)

  if (hasResponsiveEntries(responsiveEntries)) {
    return generateResponsiveTailwindCode(gridState, format, options)
  }

  const gapClass = generateTailwindGapClass(config.gap)
  const gridColsClass = generateTailwindGridColsClass(config.columns)
  const gridRowsClass = generateTailwindGridRowsClass(config.rows)
  const sortedItems = sortGridItems(items)

  const gridItems = sortedItems
    .map((item, index) => {
      const itemNumber = index + 1
      const classes = generateTailwindGridClasses(item, withStyledBorders)
      const className = format === 'jsx' ? 'className' : 'class'
      return `      <div ${className}="${classes}">
        Item ${itemNumber}
      </div>`
    })
    .join('\n')

  if (format === 'html') {
    if (items.length === 0) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind Grid Layout</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="grid ${gridColsClass} ${gridRowsClass} ${gapClass}">
    <!-- Add grid items here -->
  </div>
</body>
</html>`
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind Grid Layout</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="grid ${gridColsClass} ${gridRowsClass} ${gapClass}">
${gridItems}
  </div>
</body>
</html>`
  }

  const header = `// Quickstart: https://tailwindcss.com/docs/installation/using-vite`

  if (items.length === 0) {
    return `${header}

const MyGrid = () => {
  return (
    <div className="grid ${gridColsClass} ${gridRowsClass} ${gapClass}">
      {/* Grid items code will appear here */}
    </div>
  )
}

export default MyGrid;`
  }

  return `${header}

const MyGrid = () => {
  return (
    <div className="grid ${gridColsClass} ${gridRowsClass} ${gapClass}">
${gridItems}
    </div>
  )
}

export default MyGrid;`
}
