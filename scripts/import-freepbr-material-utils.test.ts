import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  buildAuthoredWallMaterialSetModule,
  buildFreePbrWallMaterialSetId,
  buildFreePbrWallMaterialSetName,
  buildProcessedTextureFileName,
  extractFreePbrDownloadOptions,
  findFreePbrPreviewFile,
  getFreePbrTextureMapKind,
  isProcessableFreePbrTextureFile,
  parseImportFreePbrMaterialArgs,
  selectFreePbrDownloadOption,
} from './import-freepbr-material-utils.mjs'

const SAMPLE_PRODUCT_URL = 'https://freepbr.com/product/victorian-brick-pbr/'
const SAMPLE_HTML = `
  <form class="somdn-download-form" action="https://freepbr.com/product/victorian-brick-pbr/" method="post" id="somdn-md-form-1">
    <input type="hidden" name="somdn_download_key" value="key-value">
    <input type="hidden" name="action" value="somdn_download_multi_single">
    <input type="hidden" name="somdn_product" value="26378">
    <input type="hidden" name="somdn_productfile" value="1">
    <a class="somdn-download-link">victorian-brick-unity.zip</a>
  </form>
  <form class="somdn-download-form" action="https://freepbr.com/product/victorian-brick-pbr/" method="post" id="somdn-md-form-2">
    <input type="hidden" name="somdn_download_key" value="key-value">
    <input type="hidden" name="action" value="somdn_download_multi_single">
    <input type="hidden" name="somdn_product" value="26378">
    <input type="hidden" name="somdn_productfile" value="2">
    <a class="somdn-download-link">victorian-brick-ue.zip</a>
  </form>
`

describe('import-freepbr-material-utils', () => {
  it('extracts download options from the product page HTML', () => {
    expect(extractFreePbrDownloadOptions(SAMPLE_HTML, SAMPLE_PRODUCT_URL)).toEqual([
      {
        action: SAMPLE_PRODUCT_URL,
        fields: {
          action: 'somdn_download_multi_single',
          somdn_download_key: 'key-value',
          somdn_product: '26378',
          somdn_productfile: '1',
        },
        label: 'victorian-brick-unity.zip',
      },
      {
        action: SAMPLE_PRODUCT_URL,
        fields: {
          action: 'somdn_download_multi_single',
          somdn_download_key: 'key-value',
          somdn_product: '26378',
          somdn_productfile: '2',
        },
        label: 'victorian-brick-ue.zip',
      },
    ])
  })

  it('selects the unity archive from the parsed download options', () => {
    const options = extractFreePbrDownloadOptions(SAMPLE_HTML, SAMPLE_PRODUCT_URL)
    expect(selectFreePbrDownloadOption(options)).toEqual({
      action: SAMPLE_PRODUCT_URL,
      fields: {
        action: 'somdn_download_multi_single',
        somdn_download_key: 'key-value',
        somdn_product: '26378',
        somdn_productfile: '1',
      },
      label: 'victorian-brick-unity.zip',
    })
  })

  it('filters non-texture files and keeps real PBR texture maps', () => {
    expect(isProcessableFreePbrTextureFile('/tmp/victorian-brick_albedo.png')).toBe(true)
    expect(isProcessableFreePbrTextureFile('/tmp/victorian-brick_normal-ogl.png')).toBe(true)
    expect(isProcessableFreePbrTextureFile('/tmp/victorian-brick_roughness.tif')).toBe(true)
    expect(isProcessableFreePbrTextureFile('/tmp/victorian-brick_preview.jpg')).toBe(false)
    expect(isProcessableFreePbrTextureFile('/tmp/victorian-brick_metallic.psd')).toBe(false)
    expect(isProcessableFreePbrTextureFile('/tmp/readme.txt')).toBe(false)
  })

  it('normalizes processed texture output names to png files', () => {
    expect(buildProcessedTextureFileName('/tmp/victorian-brick_normal-ogl.tif')).toBe('victorian-brick_normal-ogl.png')
  })

  it('classifies processed texture maps by semantic role', () => {
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_albedo.png')).toBe('albedo')
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_normal-ogl.png')).toBe('normal')
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_ao.png')).toBe('ao')
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_height.png')).toBe('height')
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_roughness.png')).toBe('roughness')
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_metallic.png')).toBe('metallic')
    expect(getFreePbrTextureMapKind('/tmp/victorian-brick_preview.jpg')).toBeNull()
  })

  it('finds preview images and derives authored wall material set names', () => {
    expect(findFreePbrPreviewFile([
      '/tmp/victorian-brick_preview.jpg',
      '/tmp/victorian-brick_albedo.png',
    ])).toBe('/tmp/victorian-brick_preview.jpg')
    expect(buildFreePbrWallMaterialSetId('victorian-brick-pbr')).toBe('victorian-brick')
    expect(buildFreePbrWallMaterialSetName('victorian-brick-pbr')).toBe('Victorian Brick')
  })

  it('builds authored wall material set modules with import-meta URLs', () => {
    const source = buildAuthoredWallMaterialSetModule({
      setId: 'victorian-brick',
      name: 'Victorian Brick',
      textures: {
        albedo: '/repo/editor/src/assets/materials/dungeon/wall-materials/victorian-brick/albedo.png',
        normal: '/repo/editor/src/assets/materials/dungeon/wall-materials/victorian-brick/normal.png',
        ao: '/repo/editor/src/assets/materials/dungeon/wall-materials/victorian-brick/ao.png',
        height: '/repo/editor/src/assets/materials/dungeon/wall-materials/victorian-brick/height.png',
      },
      previewImage: '/repo/editor/src/assets/materials/dungeon/wall-materials/victorian-brick/preview.png',
      moduleFilePath: '/repo/editor/src/content-packs/dungeon/generated/wallMaterialSets/victorian-brick.ts',
    })

    expect(source).toContain("export const wallMaterialSet: ContentPackWallMaterialSet = {")
    expect(source).toContain("import type { ContentPackWallMaterialSet } from '../../../types'")
    expect(source).toContain("id: \"victorian-brick\"")
    expect(source).toContain("previewImageUrl: new URL(")
    expect(source).toContain("../../../../assets/materials/dungeon/wall-materials/victorian-brick/albedo.png")
  })

  it('parses CLI arguments for slug, size, and output directory', () => {
    expect(
      parseImportFreePbrMaterialArgs(
        ['victorian-brick-pbr', '--size', '2048', '--output-dir', 'editor/src/assets/materials/custom'],
        '/repo',
      ),
    ).toEqual({
      help: false,
      outputDir: path.resolve('/repo', 'editor/src/assets/materials/custom'),
      size: 2048,
      slug: 'victorian-brick-pbr',
    })
  })
})
