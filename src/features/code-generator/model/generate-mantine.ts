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
  generateBorderStyle,
  calculateGridItemEnds,
  type ResponsiveGeneratorOptions,
} from './utils'

interface GeneratorOptions extends ResponsiveGeneratorOptions {
  withStyledBorders?: boolean
  withTailwind?: boolean
}

function generateResponsiveMantineCSSGridCode(
  gridState: GridState,
  options: GeneratorOptions
): string {
  const { withStyledBorders = true } = options
  const entries = getResponsiveLayoutEntries(gridState, options)
  const itemIds = getResponsiveItemIds(entries)
  const baseEntry = entries[0]
  const borderCSS = withStyledBorders ? 'border: 1px solid #4a5565;' : ''
  const gridItems = itemIds
    .map((_, index) => `      <Card className="grid-item-${index + 1}">
        Item ${index + 1}
      </Card>`)
    .join('\n')
  const baseItemStyles = itemIds
    .map((itemId, index) => {
      const item = getItemById(baseEntry.state, itemId)
      if (!item) return ''

      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      const borderRule = borderCSS ? `\n          ${borderCSS}` : ''
      return `        .grid-item-${index + 1} {
          grid-column: ${item.colStart} / ${colEnd};
          grid-row: ${item.rowStart} / ${rowEnd};${borderRule}
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
          return `          .grid-item-${index + 1} {
            grid-column: ${item.colStart} / ${colEnd};
            grid-row: ${item.rowStart} / ${rowEnd};
          }`
        })
        .filter(Boolean)
        .join('\n')

      return `        @media (min-width: ${breakpoint.minWidth}px) {
          .grid-container {
            grid-template-columns: repeat(${state.config.columns}, 1fr);
            grid-template-rows: repeat(${state.config.rows}, 1fr);
            gap: ${state.config.gap}px;
          }
${itemStyles}
        }`
    })
    .join('\n')

  return `// Quickstart: https://mantine.dev/getting-started/
import { Card } from "@mantine/core";

const MyGrid = () => {
  return (
    <>
      <style>{\`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(${baseEntry.state.config.columns}, 1fr);
          grid-template-rows: repeat(${baseEntry.state.config.rows}, 1fr);
          gap: ${baseEntry.state.config.gap}px;
        }
${baseItemStyles}
${mediaQueries}
      \`}</style>
      <div className="grid-container">
${gridItems || '        {/* Grid items code will appear here */}'}
      </div>
    </>
  );
}

export default MyGrid;`
}

export function generateMantineCode(gridState: GridState, options: GeneratorOptions = {}): string {
  const { withStyledBorders = true, withTailwind = false } = options
  const { config, items } = gridState
  const responsiveEntries = getResponsiveLayoutEntries(gridState, options)

  if (hasResponsiveEntries(responsiveEntries)) {
    return generateResponsiveMantineCSSGridCode(gridState, options)
  }

  const header = `// Quickstart: https://mantine.dev/getting-started/`

  if (items.length === 0) {
    const gapClass = generateTailwindGapClass(config.gap)
    const gridColsClass = generateTailwindGridColsClass(config.columns)
    const gridRowsClass = generateTailwindGridRowsClass(config.rows)
    const containerStyle = withTailwind
      ? `className="grid ${gridColsClass} ${gridRowsClass} ${gapClass}"`
      : `style={{
          display: 'grid',
          gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`,
          gridTemplateRows: \`repeat(${config.rows}, 1fr)\`,
          gap: \`${config.gap}px\`,
        }}`
    
    const gridTag = withTailwind
      ? `<Grid ${containerStyle}>`
      : `<Grid
      ${containerStyle}
    >`
    return `${header}
import { Grid } from "@mantine/core";

const MyGrid = () => {
  return (
    ${gridTag}
      {/* Grid items code will appear here */}
    </Grid>
  );
}

export default MyGrid;`
  }

  const sortedItems = sortGridItems(items)
  const borderStyle = generateBorderStyle(withStyledBorders)
  const gapClass = generateTailwindGapClass(config.gap)
  const gridColsClass = generateTailwindGridColsClass(config.columns)
  const gridRowsClass = generateTailwindGridRowsClass(config.rows)
  
  const gridItems = sortedItems
    .map((item, index) => {
      const itemNumber = index + 1
      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      
      if (withTailwind) {
        const classes = generateTailwindGridClasses(item, withStyledBorders)
        return `      <Card className="${classes}">
        Item ${itemNumber}
      </Card>`
      } else {
        const styleContent = borderStyle
          ? `{
          gridColumnStart: ${item.colStart},
          gridColumnEnd: ${colEnd},
          gridRowStart: ${item.rowStart},
          gridRowEnd: ${rowEnd},
          ${borderStyle}
        }`
          : `{
          gridColumnStart: ${item.colStart},
          gridColumnEnd: ${colEnd},
          gridRowStart: ${item.rowStart},
          gridRowEnd: ${rowEnd},
        }`
        return `      <Card
        style={${styleContent}}
      >
        Item ${itemNumber}
      </Card>`
      }
    })
    .join('\n')

  const containerStyle = withTailwind
    ? `className="grid ${gridColsClass} ${gridRowsClass} ${gapClass}"`
    : `style={{
        display: 'grid',
        gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`,
        gridTemplateRows: \`repeat(${config.rows}, 1fr)\`,
        gap: \`${config.gap}px\`,
      }}`

  const containerTag = withTailwind
    ? `<div ${containerStyle}>`
    : `<div
      ${containerStyle}
    >`
  return `${header}
import { Card } from "@mantine/core";

const MyGrid = () => {
  return (
    ${containerTag}
${gridItems}
    </div>
  );
}

export default MyGrid;`
}
