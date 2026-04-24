import { describe, expect, it } from 'vitest'
import { getAssetBrowserCategory, getAssetBrowserSubcategory, getAssetPlacementMode } from './browserMetadata'
import { getContentPackAssetsByCategory } from './registry'

describe('browserMetadata', () => {
  it('categorizes openings separately from props', () => {
    const opening = getContentPackAssetsByCategory('opening')[0]
    expect(opening).toBeDefined()
    expect(getAssetBrowserCategory(opening!)).toBe('openings')
    expect(['doors', 'stairs']).toContain(getAssetBrowserSubcategory(opening!))
    expect(['opening-floor', 'opening-wall']).toContain(getAssetPlacementMode(opening!))
  })

  it('categorizes wall banners as decor banners', () => {
    const banner = getContentPackAssetsByCategory('prop').find((asset) => asset.id.includes('banner_blue'))
    expect(banner).toBeDefined()
    expect(getAssetBrowserCategory(banner!)).toBe('decor')
    expect(getAssetBrowserSubcategory(banner!)).toBe('banners')
  })

  it('categorizes forest props as nature assets', () => {
    const tree = getContentPackAssetsByCategory('prop').find((asset) => asset.id.includes('kaykit.forest_tree_1_a_color1'))
    const rock = getContentPackAssetsByCategory('prop').find((asset) => asset.id.includes('kaykit.forest_rock_2_a_color4'))

    expect(tree).toBeDefined()
    expect(rock).toBeDefined()
    expect(getAssetBrowserCategory(tree!)).toBe('nature')
    expect(getAssetBrowserSubcategory(tree!)).toBe('trees')
    expect(getAssetBrowserCategory(rock!)).toBe('nature')
    expect(getAssetBrowserSubcategory(rock!)).toBe('rocks')
  })

  it('categorizes floor and wall assets as surfaces', () => {
    const floor = getContentPackAssetsByCategory('floor')[0]
    const wall = getContentPackAssetsByCategory('wall')[0]

    expect(getAssetBrowserCategory(floor!)).toBe('surfaces')
    expect(getAssetBrowserSubcategory(floor!)).toBe('floors')
    expect(getAssetPlacementMode(floor!)).toBe('surface-floor')

    expect(getAssetBrowserCategory(wall!)).toBe('surfaces')
    expect(getAssetBrowserSubcategory(wall!)).toBe('walls')
    expect(getAssetPlacementMode(wall!)).toBe('surface-wall')
  })
})
