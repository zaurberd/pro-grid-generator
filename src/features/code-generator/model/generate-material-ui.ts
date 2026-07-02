import type { GridState } from '@/entities/grid'
import {
  formatResponsiveObject,
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

function generateResponsiveMaterialUICode(
  gridState: GridState,
  options: GeneratorOptions
): string {
  const { withStyledBorders = true } = options
  const entries = getResponsiveLayoutEntries(gridState, options)
  const itemIds = getResponsiveItemIds(entries)
  const containerColumns = formatResponsiveObject(
    entries.map(({ breakpoint, state }) => [
      breakpoint.id,
      `repeat(${state.config.columns}, 1fr)`,
    ])
  )
  const containerRows = formatResponsiveObject(
    entries.map(({ breakpoint, state }) => [
      breakpoint.id,
      `repeat(${state.config.rows}, 1fr)`,
    ])
  )
  const containerGap = formatResponsiveObject(
    entries.map(({ breakpoint, state }) => [breakpoint.id, `${state.config.gap}px`])
  )
  const elevationAttr = withStyledBorders ? '' : '\n        elevation={0}'
  const gridItems = itemIds
    .map((itemId, index) => {
      const values = entries
        .map(({ breakpoint, state }) => {
          const item = getItemById(state, itemId)
          if (!item) return null

          const { colEnd, rowEnd } = calculateGridItemEnds(item)
          return {
            breakpoint: breakpoint.id,
            item,
            colEnd,
            rowEnd,
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)

      return `      <Card${elevationAttr}
        sx={{
          gridColumnStart: ${formatResponsiveObject(values.map(({ breakpoint, item }) => [breakpoint, item.colStart]))},
          gridColumnEnd: ${formatResponsiveObject(values.map(({ breakpoint, colEnd }) => [breakpoint, colEnd]))},
          gridRowStart: ${formatResponsiveObject(values.map(({ breakpoint, item }) => [breakpoint, item.rowStart]))},
          gridRowEnd: ${formatResponsiveObject(values.map(({ breakpoint, rowEnd }) => [breakpoint, rowEnd]))},
        }}
      >
        Item ${index + 1}
      </Card>`
    })
    .join('\n')

  return `// Quickstart: https://mui.com/material-ui/getting-started/installation/
import { Box, Card } from '@mui/material'

const MyGrid = () => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: ${containerColumns},
        gridTemplateRows: ${containerRows},
        gap: ${containerGap},
      }}
    >
${gridItems || '      {/* Grid items code will appear here */}'}
    </Box>
  )
}

export default MyGrid;`
}

export function generateMaterialUICode(gridState: GridState, options: GeneratorOptions = {}): string {
  const { withStyledBorders = true } = options
  const { config, items } = gridState
  const responsiveEntries = getResponsiveLayoutEntries(gridState, options)

  if (hasResponsiveEntries(responsiveEntries)) {
    return generateResponsiveMaterialUICode(gridState, options)
  }

  const header = `// Quickstart: https://mui.com/material-ui/getting-started/installation/`

  if (items.length === 0) {
    return `${header}
import { Box } from '@mui/material'

const MyGrid = () => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`,
        gridTemplateRows: \`repeat(${config.rows}, 1fr)\`,
        gap: \`${config.gap}px\`,
      }}
    >
      {/* Grid items code will appear here */}
    </Box>
  )
}

export default MyGrid;`
  }

  const sortedItems = sortGridItems(items)
  const withElevationZero = !withStyledBorders

  const gridItems = sortedItems
    .map((item, index) => {
      const itemNumber = index + 1
      const { colEnd, rowEnd } = calculateGridItemEnds(item)
      const sxContent = `{
          gridColumnStart: ${item.colStart},
          gridColumnEnd: ${colEnd},
          gridRowStart: ${item.rowStart},
          gridRowEnd: ${rowEnd},
        }`
      const elevationAttr = withElevationZero ? '\n        elevation={0}' : ''
      return `      <Card${elevationAttr}
        sx={${sxContent}}
      >
        Item ${itemNumber}
      </Card>`
    })
    .join('\n')

  return `${header}
import { Box, Card } from '@mui/material'

const MyGrid = () => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: \`repeat(${config.columns}, 1fr)\`,
        gridTemplateRows: \`repeat(${config.rows}, 1fr)\`,
        gap: \`${config.gap}px\`,
      }}
    >
${gridItems}
    </Box>
  )
}

export default MyGrid;`
}
