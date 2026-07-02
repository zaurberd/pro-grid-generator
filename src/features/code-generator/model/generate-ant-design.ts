import type { GridState } from '@/entities/grid'
import {
  getItemById,
  getResponsiveItemIds,
  getResponsiveLayoutEntries,
  hasResponsiveEntries,
  sortGridItems,
  calculateGridItemEnds,
  type ResponsiveGeneratorOptions,
} from './utils'

interface GeneratorOptions extends ResponsiveGeneratorOptions {
  withStyledBorders?: boolean
}

function generateResponsiveAntCSSGridCode(
  gridState: GridState,
  options: GeneratorOptions
): string {
  const { withStyledBorders = true } = options
  const entries = getResponsiveLayoutEntries(gridState, options)
  const itemIds = getResponsiveItemIds(entries)
  const baseEntry = entries[0]
  const variantAttr = withStyledBorders ? '' : '\n        variant="borderless"'
  const gridItems = itemIds
    .map((_, index) => `      <Card${variantAttr} className="grid-item-${index + 1}">
        Item ${index + 1}
      </Card>`)
    .join('\n')
  const baseItemStyles = itemIds
    .map((itemId, index) => {
      const item = getItemById(baseEntry.state, itemId)
      if (!item) return ''

      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      return `        .grid-item-${index + 1} {
          grid-column: ${item.colStart} / ${colEnd};
          grid-row: ${item.rowStart} / ${rowEnd};
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

  return `// Quickstart: https://ant.design/docs/react/introduce
import { Card } from 'antd'

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
  )
}

export default MyGrid;`
}

export function generateAntDesignCode(gridState: GridState, options: GeneratorOptions = {}): string {
  const { withStyledBorders = true } = options
  const { config, items } = gridState
  const responsiveEntries = getResponsiveLayoutEntries(gridState, options)

  if (hasResponsiveEntries(responsiveEntries)) {
    return generateResponsiveAntCSSGridCode(gridState, options)
  }

  const header = `// Quickstart: https://ant.design/docs/react/introduce`

  if (items.length === 0) {
    return `${header}
import { Card } from 'antd'

const MyGrid = () => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`,
        gridTemplateRows: \`repeat(${config.rows}, 1fr)\`,
        gap: \`${config.gap}px\`,
      }}
    >
      {/* Grid items code will appear here */}
    </div>
  )
}

export default MyGrid;`
  }

  const variantProp = !withStyledBorders
  const sortedItems = sortGridItems(items)
  const gridItems = sortedItems
    .map((item, index) => {
      const itemNumber = index + 1
      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      const styleContent = `{
          gridColumnStart: ${item.colStart},
          gridColumnEnd: ${colEnd},
          gridRowStart: ${item.rowStart},
          gridRowEnd: ${rowEnd},
        }`
      const variantAttr = variantProp ? '\n        variant="borderless"' : ''
      return `      <Card${variantAttr}
        style={${styleContent}}
      >
        Item ${itemNumber}
      </Card>`
    })
    .join('\n')

  return `${header}
import { Card } from 'antd'

const MyGrid = () => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`,
        gridTemplateRows: \`repeat(${config.rows}, 1fr)\`,
        gap: \`${config.gap}px\`,
      }}
    >
${gridItems}
    </div>
  )
}

export default MyGrid;`
}
