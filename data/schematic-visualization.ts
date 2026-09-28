/**
 * Structure and media for the schematic-visualization page.
 *
 * Object key order is the render order. All visible copy lives in
 * `messages/{locale}.json` under `SchematicVisualizationPage`.
 */
export const schematicVisualizationContent = {
  'hero-image': {
    light: 'schematic-visualization-hero-light-mode.v.2.jpg',
    dark: 'schematic-visualization-hero-dark-mode.v.6.jpg',
    width: 1309,
    height: 1148,
  },
  'parallax-image': {
    light: 'schematic-visualization-parallax-light-mode.v.2.jpg',
    dark: 'schematic-visualization-parallax-dark-mode.v.6.jpg',
  },
  sections: {
    'section-1': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        location: 'schematic-visualization-executive-dashboard.1.jpg',
      },
      'image-2': {
        type: 'image',
        hasDescription: true,
        location: 'schematic-visualization-ruby-on-rails-preview.1.jpg',
        width: 938,
        height: 625,
        diagram: {
          src: 'schematic-visualization-rails-portfolio-enlarged.1.jpg',
          width: 7700,
          height: 5969,
        },
      },
    },
    'section-2': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        closed: {
          light: {
            desktop: {
              src: 'schematic-visualization-treasure-map-light-mode-desktop.1.jpg',
              width: 1000,
              height: 741,
            },
            mobile: {
              src: 'schematic-visualization-treasure-map-light-mode-mobile.1.jpg',
              width: 400,
              height: 466,
            },
          },
          dark: {
            desktop: {
              src: 'schematic-visualization-treasure-map-dark-mode-desktop.1.jpg',
              width: 1000,
              height: 741,
            },
            mobile: {
              src: 'schematic-visualization-treasure-map-dark-mode-mobile.1.jpg',
              width: 400,
              height: 466,
            },
          },
        },
        open: {
          en: {
            desktop: {
              src: 'schematic-visualization-treasure-map-workflow-desktop-english.1.jpg',
              width: 1000,
              height: 721,
            },
            mobile: {
              src: 'schematic-visualization-treasure-map-workflow-mobile-english.1.jpg',
              width: 400,
              height: 811,
            },
          },
          ar: {
            desktop: {
              src: 'schematic-visualization-treasure-map-workflow-desktop-arabic.1.jpg',
              width: 1000,
              height: 721,
            },
            mobile: {
              src: 'schematic-visualization-treasure-map-workflow-mobile-arabic.1.jpg',
              width: 400,
              height: 811,
            },
          },
          he: {
            desktop: {
              src: 'schematic-visualization-treasure-map-workflow-desktop-hebrew.1.jpg',
              width: 1000,
              height: 721,
            },
            mobile: {
              src: 'schematic-visualization-treasure-map-workflow-mobile-hebrew.1.jpg',
              width: 400,
              height: 811,
            },
          },
        },
      },
      'paragraph-2': { type: 'paragraph' },
    },
    'section-3': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        hasDescription: true,
        byLocale: {
          en: {
            desktop: {
              src: 'schematic-visualization-blueprint-cloud-desktop-english.1.jpg',
              width: 1000,
              height: 687,
            },
            mobile: {
              src: 'schematic-visualization-blueprint-cloud-mobile-englsih.1.jpg',
              width: 400,
              height: 582,
            },
          },
          ar: {
            desktop: {
              src: 'schematic-visualization-blueprint-cloud-desktop-arabic.1.jpg',
              width: 1000,
              height: 687,
            },
            mobile: {
              src: 'schematic-visualization-blueprint-cloud-mobile-arabic.1.jpg',
              width: 400,
              height: 582,
            },
          },
          he: {
            desktop: {
              src: 'schematic-visualization-blueprint-cloud-desktop-hebrew.1.jpg',
              width: 1000,
              height: 687,
            },
            mobile: {
              src: 'schematic-visualization-blueprint-cloud-mobile-hebrew.1.jpg',
              width: 400,
              height: 582,
            },
          },
        },
      },
      'image-2': {
        type: 'image',
        byLocale: {
          en: {
            desktop: {
              src: 'schematic-visualization-blueprint-box-desktop-english.1.jpg',
              width: 1000,
              height: 687,
            },
            mobile: {
              src: 'schematic-visualization-blueprint-box-mobile-english.1.jpg',
              width: 400,
              height: 582,
            },
          },
          ar: {
            desktop: {
              src: 'schematic-visualization-blueprint-box-desktop-arabic.1.jpg',
              width: 1000,
              height: 687,
            },
            mobile: {
              src: 'schematic-visualization-blueprint-box-mobile-arabic.1.jpg',
              width: 400,
              height: 582,
            },
          },
          he: {
            desktop: {
              src: 'schematic-visualization-blueprint-box-desktop-hebrew.1.jpg',
              width: 1000,
              height: 687,
            },
            mobile: {
              src: 'schematic-visualization-blueprint-box-mobile-hebrew.1.jpg',
              width: 472,
              height: 687,
            },
          },
        },
      },
    },
  },
} as const

export type SchematicParagraphBlock = {
  type: 'paragraph'
}

type SchematicImageBase = {
  type: 'image'
  hasDescription?: boolean
}

export type SchematicSingleImageBlock = SchematicImageBase & {
  location: string
}

/** Light and dark files, each with its own pixel size, as on the Kurdistan page. */
export type SchematicThemedImageBlock = SchematicImageBase & {
  light: string
  dark: string
  width: number
  height: number
  darkWidth: number
  darkHeight: number
}

export type SchematicArtSrc = {
  src: string
  width: number
  height: number
}

export type SchematicArtPair = {
  desktop: SchematicArtSrc
  mobile: SchematicArtSrc
}

/** Desktop and mobile files for each locale, as on the Kurdistan page. */
export type SchematicArtDirectedImageBlock = SchematicImageBase & {
  byLocale: Record<'en' | 'ar' | 'he', SchematicArtPair>
}

/**
 * Closed frame is light/dark and desktop/mobile. Opening it reveals the
 * workflow for the current locale, desktop or mobile.
 */
export type SchematicTreasureMapBlock = SchematicImageBase & {
  closed: { light: SchematicArtPair; dark: SchematicArtPair }
  open: Record<'en' | 'ar' | 'he', SchematicArtPair>
}

/** Rail preview. Opening it shows a pannable, zoomable diagram. */
export type SchematicDiagramImageBlock = SchematicImageBase & {
  location: string
  width: number
  height: number
  diagram: SchematicArtSrc
}

export type SchematicImageBlock =
  | SchematicSingleImageBlock
  | SchematicThemedImageBlock
  | SchematicArtDirectedImageBlock
  | SchematicTreasureMapBlock
  | SchematicDiagramImageBlock

export type SchematicBlock = SchematicParagraphBlock | SchematicImageBlock

export type SchematicSectionId =
  keyof typeof schematicVisualizationContent.sections

export type SchematicBlockEntry = {
  id: string
  block: SchematicBlock
}

export type SchematicSection = {
  id: SchematicSectionId
  blocks: SchematicBlockEntry[]
}

export function getSchematicSections(): SchematicSection[] {
  return (
    Object.entries(schematicVisualizationContent.sections) as [
      SchematicSectionId,
      (typeof schematicVisualizationContent.sections)[SchematicSectionId],
    ][]
  ).map(([id, items]) => ({
    id,
    blocks: (Object.entries(items) as [string, SchematicBlock][]).map(
      ([blockId, block]) => ({ id: blockId, block })
    ),
  }))
}

export function isSchematicImageBlock(
  block: SchematicBlock
): block is SchematicImageBlock {
  return block.type === 'image'
}

export function isTreasureMapBlock(
  block: SchematicBlock
): block is SchematicTreasureMapBlock {
  return block.type === 'image' && 'closed' in block && 'open' in block
}

export function isDiagramImageBlock(
  block: SchematicBlock
): block is SchematicDiagramImageBlock {
  return block.type === 'image' && 'diagram' in block && 'location' in block
}

function pageLocale(locale: string): 'en' | 'ar' | 'he' {
  if (locale === 'ar' || locale === 'he') return locale
  return 'en'
}

export function schematicImageSources(
  block: Exclude<
    SchematicImageBlock,
    SchematicTreasureMapBlock | SchematicDiagramImageBlock
  >,
  locale: string
) {
  if ('byLocale' in block) {
    return { artDirected: block.byLocale[pageLocale(locale)] }
  }

  if ('location' in block) {
    return { src: block.location }
  }

  return {
    src: block.light,
    darkSrc: block.dark,
    width: block.width,
    height: block.height,
    darkWidth: block.darkWidth,
    darkHeight: block.darkHeight,
  }
}
