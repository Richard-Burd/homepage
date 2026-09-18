/**
 * Structure and media for the schematic-visualization page.
 *
 * Object key order is the render order. All visible copy lives in
 * `messages/{locale}.json` under `SchematicVisualizationPage`.
 */
export const schematicVisualizationContent = {
  'hero-image': {
    light: 'schematic-visualization-hero-light-mode.v.2.jpg',
    dark: 'schematic-visualization-hero-dark-mode.v.2.jpg',
    width: 1309,
    height: 1148,
  },
  'parallax-image': {
    light: 'schematic-visualization-parallax-light-mode.v.2.jpg',
    dark: 'schematic-visualization-parallax-dark-mode.v.4.jpg',
  },
  sections: {
    'section-1': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        location: 'schematic-vis-sec-1-img-1.jpg',
      },
      'image-2': {
        type: 'image',
        location: 'schematic-vis-sec-1-img-2.jpg',
        hasDescription: true,
      },
    },
    'section-2': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        location: 'schematic-vis-sec-2-img-1.jpg',
      },
      'paragraph-2': { type: 'paragraph' },
    },
    'section-3': {
      'paragraph-1': { type: 'paragraph' },
      'image-1': {
        type: 'image',
        location: 'schematic-vis-sec-3-img-1.jpg',
        hasDescription: true,
      },
      'image-2': {
        type: 'image',
        location: 'schematic-vis-sec-3-img-2.jpg',
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

export type SchematicImageBlock = {
  type: 'image'
  location: string
  hasDescription?: boolean
}

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
