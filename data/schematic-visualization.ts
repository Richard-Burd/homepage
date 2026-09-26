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
        location: 'schematic-visualization-ruby-on-rails-preview.1.jpg',
        hasDescription: true,
      },
    },
    'section-2': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        light: 'schematic-visualization-treasure-map-light-mode.1.jpg',
        dark: 'schematic-visualization-treasure-map-dark-mode.1.jpg',
        width: 1992,
        height: 1476,
        darkWidth: 1992,
        darkHeight: 1476,
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
      'paragraph-2': { type: 'paragraph' },
      'paragraph-3': { type: 'paragraph' },
      'image-3': {
        type: 'image',
        location: 'schematic-vis-sec-3-img-3.jpg',
      },
      'paragraph-4': { type: 'paragraph' },
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

/** Desktop and mobile files for each locale, as on the Kurdistan page. */
export type SchematicArtDirectedImageBlock = SchematicImageBase & {
  byLocale: Record<
    'en' | 'ar' | 'he',
    { desktop: SchematicArtSrc; mobile: SchematicArtSrc }
  >
}

export type SchematicImageBlock =
  | SchematicSingleImageBlock
  | SchematicThemedImageBlock
  | SchematicArtDirectedImageBlock

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

function pageLocale(locale: string): 'en' | 'ar' | 'he' {
  if (locale === 'ar' || locale === 'he') return locale
  return 'en'
}

export function schematicImageSources(
  block: SchematicImageBlock,
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
