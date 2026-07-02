import type { GridState } from '@/entities/grid'
import {
  getItemById,
  getResponsiveItemIds,
  getResponsiveLayoutEntries,
  hasResponsiveEntries,
  sortGridItems,
  generateBorderStyle,
  generateBorderCSS,
  calculateGridItemEnds,
  type ResponsiveGeneratorOptions,
} from './utils'

interface GeneratorOptions extends ResponsiveGeneratorOptions {
  withStyledBorders?: boolean
}

function generateContainerCss(gridState: GridState): string {
  return `      grid-template-columns: repeat(${gridState.config.columns}, 1fr);
      grid-template-rows: repeat(${gridState.config.rows}, 1fr);
      gap: ${gridState.config.gap}px;`
}

function generateResponsiveCss(gridState: GridState, options: GeneratorOptions): string {
  const { withStyledBorders = true } = options
  const entries = getResponsiveLayoutEntries(gridState, options)
  const borderCSS = generateBorderCSS(withStyledBorders)
  const itemIds = getResponsiveItemIds(entries)
  const baseEntry = entries[0]

  const baseItemStyles = itemIds
    .map((itemId, index) => {
      const item = getItemById(baseEntry.state, itemId)
      if (!item) return ''

      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      const borderRule = borderCSS ? `\n      ${borderCSS}` : ''
      return `    .grid-item-${index + 1} {
      grid-column-start: ${item.colStart};
      grid-column-end: ${colEnd};
      grid-row-start: ${item.rowStart};
      grid-row-end: ${rowEnd};${borderRule}
    }`
    })
    .filter(Boolean)
    .join('\n')

  const mediaQueries = entries
    .slice(1)
    .map(({ breakpoint, state }) => {
      const itemStyles = itemIds
        .map((itemId, index) => {
          const item = getItemById(state, itemId)
          if (!item) return ''

          const { colEnd, rowEnd } = calculateGridItemEnds(item)
          return `      .grid-item-${index + 1} {
        grid-column-start: ${item.colStart};
        grid-column-end: ${colEnd};
        grid-row-start: ${item.rowStart};
        grid-row-end: ${rowEnd};
      }`
        })
        .filter(Boolean)
        .join('\n')

      return `    @media (min-width: ${breakpoint.minWidth}px) {
      .grid-container {
${generateContainerCss(state)}
      }
${itemStyles}
    }`
    })
    .join('\n')

  return `    .grid-container {
      display: grid;
${generateContainerCss(baseEntry.state)}
    }
${baseItemStyles}
${mediaQueries}`
}

function generateResponsiveRawCSSCode(
  gridState: GridState,
  format: 'jsx' | 'html',
  options: GeneratorOptions
): string {
  const css = generateResponsiveCss(gridState, options)
  const entries = getResponsiveLayoutEntries(gridState, options)
  const itemIds = getResponsiveItemIds(entries)
  const gridItems = itemIds
    .map(
      (_, index) => `    <div class="grid-item-${index + 1}">
      Item ${index + 1}
    </div>`
    )
    .join('\n')

  if (format === 'jsx') {
    const jsxItems = gridItems.replaceAll('class=', 'className=')

    return `import React from 'react'

const MyGrid = () => {
  return (
    <>
      <style>{\`
${css}
      \`}</style>
      <div className="grid-container">
${jsxItems || '        {/* Grid items code will appear here */}'}
      </div>
    </>
  )
}

export default MyGrid;`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Grid Layout</title>
  <style>
${css}
  </style>
</head>
<body>
  <div class="grid-container">
${gridItems || '    <!-- Add grid items here -->'}
  </div>
</body>
</html>`
}

export function generateRawCSSCode(
  gridState: GridState,
  format: 'jsx' | 'html' = 'html',
  options: GeneratorOptions = {}
): string {
  const { withStyledBorders = true } = options
  const { config, items } = gridState
  const responsiveEntries = getResponsiveLayoutEntries(gridState, options)

  if (hasResponsiveEntries(responsiveEntries)) {
    return generateResponsiveRawCSSCode(gridState, format, options)
  }

  const sortedItems = sortGridItems(items)
  const borderStyle = generateBorderStyle(withStyledBorders)
  const borderCSS = generateBorderCSS(withStyledBorders)

  const gridItems = sortedItems
    .map((item, index) => {
      const itemNumber = index + 1
      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      
      if (format === 'jsx') {
        const baseStyle = `gridColumnStart: ${item.colStart}, gridColumnEnd: ${colEnd}, gridRowStart: ${item.rowStart}, gridRowEnd: ${rowEnd}`
        const style = borderStyle ? `${baseStyle}, ${borderStyle}` : baseStyle
        return `      <div style={{ ${style} }}>
        Item ${itemNumber}
      </div>`
      }
      return `    <div class="grid-item-${itemNumber}">
      Item ${itemNumber}
    </div>`
    })
    .join('\n')

  const gridItemStyles = sortedItems
    .map((item, index) => {
      const itemNumber = index + 1
      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      const borderRule = borderCSS ? `\n      ${borderCSS}` : ''
      return `    .grid-item-${itemNumber} {
      grid-column-start: ${item.colStart};
      grid-column-end: ${colEnd};
      grid-row-start: ${item.rowStart};
      grid-row-end: ${rowEnd};${borderRule}
    }`
    })
    .join('\n')

  if (format === 'jsx') {
    if (items.length === 0) {
      return `import React from 'react'

const MyGrid = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`, gridTemplateRows: \`repeat(${config.rows}, 1fr)\`, gap: \`${config.gap}px\` }}>
      {/* Grid items code will appear here */}
    </div>
  )
}

export default MyGrid;`
    }
    return `import React from 'react'

const MyGrid = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`, gridTemplateRows: \`repeat(${config.rows}, 1fr)\`, gap: \`${config.gap}px\` }}>
${gridItems}
    </div>
  )
}

export default MyGrid;`
  }

  // HTML format
  if (items.length === 0) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grid Layout</title>
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(${config.columns}, 1fr);
      grid-template-rows: repeat(${config.rows}, 1fr);
      gap: ${config.gap}px;
    }
  </style>
</head>
<body>
  <div class="grid-container">
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
  <title>Grid Layout</title>
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(${config.columns}, 1fr);
      grid-template-rows: repeat(${config.rows}, 1fr);
      gap: ${config.gap}px;
    }
${gridItemStyles}
  </style>
</head>
<body>
  <div class="grid-container">
${gridItems}
  </div>
</body>
</html>`
}
