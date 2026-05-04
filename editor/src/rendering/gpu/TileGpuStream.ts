import * as THREE from 'three'
import {
  applyInstancedMeshUpdateRanges,
  disposeInstancedMeshEntries,
  makeInstancedMeshEntries,
  setInstancedMeshEntryCount,
  TILE_PAGE_SIZE,
  type InstancedMeshEntry,
  type TileUploadRange,
  writeInstancedMeshSlot,
} from '../../components/canvas/instancedTileMesh'
import type { BatchDescriptor, ResolvedStaticTileEntry } from '../../components/canvas/batchDescriptors'
import { getBelowGroundClipMinY, applyBuildAnimationToMaterial, applyBelowGroundClipToMaterial } from '../../components/canvas/buildAnimationMaterial'
import { applyBakedLightToMaterial } from '../../components/canvas/bakedLightMaterial'
import { applyFogOfWarToMaterial } from '../../components/canvas/fogOfWar'
import { requestContinuousRender, releaseContinuousRender } from '../renderActivity'
import { recordBuildPerfEvent, traceBuildPerf } from '../../performance/runtimeBuildTrace'
import { TileGpuUploadScheduler, type TileUploadBudget, type TileUploadBudgetResult } from './TileGpuUploadScheduler'
import { resolveBatchedTileAsset } from '../../components/canvas/tileAssetResolution'
import { useGLTF } from '../useGLTF'
import type { GridCell } from '../../hooks/useSnapToGrid'

type FogRuntime = Parameters<typeof applyFogOfWarToMaterial>[1]

const TILE_UPLOAD_RENDER_ACTIVITY = 'tile-page-uploads'

export type TilePageStatus = 'idle' | 'dirty' | 'uploading' | 'ready' | 'disposed'
export type TileStreamTransactionStatus = 'preview' | 'committed' | 'cancelled'

export type TileUploadProgress = {
  totalPages: number
  readyPages: number
  pendingPages: number
}

export type TileStreamPreviewMode = 'paint' | 'erase' | null

export type TileStreamAssetContext = {
  mountId: string
  assetId?: string | null
}

export type ResolvedTileStreamGroup = BatchDescriptor & {
  sourceScene: THREE.Object3D
  fogRuntime: FogRuntime
}

type TileStreamSourceKind = 'static' | 'transaction'

type TileStreamSourceRegistration = {
  kind: TileStreamSourceKind
  floorId: string
  transactionId?: string
  groups: ResolvedTileStreamGroup[]
}

type StoredTileStreamSourceRegistration = TileStreamSourceRegistration & {
  signature: string
}

type TileStreamEntryState = {
  entry: ResolvedStaticTileEntry
  renderVisible: boolean
}

type TilePage = {
  pageKey: string
  pageIndex: number
  root: THREE.Group
  meshEntries: InstancedMeshEntry[]
  depthMaterials: Map<string, THREE.MeshDepthMaterial>
  slotKeys: Array<string | null>
  freeSlots: number[]
  activeCount: number
  status: TilePageStatus
  pendingDirtyRanges: TileUploadRange[]
}

type TilePageGroup = {
  descriptor: ResolvedTileStreamGroup
  pages: Map<number, TilePage>
  keyToSlot: Map<string, { pageIndex: number; slotIndex: number }>
  entryStates: Map<string, TileStreamEntryState>
  renderSignature: string
}

type TileStreamMount = {
  group: THREE.Group
  pageGroups: Map<string, TilePageGroup>
  sources: Map<string, StoredTileStreamSourceRegistration>
}

type TileStreamTransaction = {
  id: string
  floorId: string
  mountId: string | null
  previewMode: TileStreamPreviewMode
  status: TileStreamTransactionStatus
  startedAt: number | null
  progress: TileUploadProgress
}

type TileGpuStreamOptions = {
  invalidate: () => void
}

export function getTileGpuStreamMountId(floorId: string, scopeKey: string) {
  return `${scopeKey}:${floorId}`
}

export class TileGpuStream {
  private readonly invalidate: () => void
  private readonly mounts = new Map<string, TileStreamMount>()
  private readonly transactions = new Map<string, TileStreamTransaction>()
  private readonly listeners = new Set<() => void>()
  private readonly uploadScheduler = new TileGpuUploadScheduler()
  private version = 0

  constructor(options: TileGpuStreamOptions) {
    this.invalidate = options.invalidate
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = () => this.version

  getMountGroup(mountId: string) {
    return this.ensureMount(mountId).group
  }

  setSourceRegistration(mountId: string, sourceId: string, registration: TileStreamSourceRegistration) {
    const mount = this.ensureMount(mountId)
    const signature = buildSourceRegistrationSignature(registration)
    const existing = mount.sources.get(sourceId)
    if (existing?.signature === signature) {
      return
    }

    mount.sources.set(sourceId, {
      ...registration,
      signature,
    })
    this.rebuildMount(mountId)
  }

  clearSourceRegistration(mountId: string, sourceId: string) {
    const mount = this.mounts.get(mountId)
    if (!mount) {
      return
    }

    if (!mount.sources.delete(sourceId)) {
      return
    }

    this.rebuildMount(mountId)
  }

  beginTileStreamTransaction(id: string, floorId: string) {
    this.transactions.set(id, {
      id,
      floorId,
      mountId: null,
      previewMode: null,
      status: 'preview',
      startedAt: null,
      progress: {
        totalPages: 0,
        readyPages: 0,
        pendingPages: 0,
      },
    })
    this.notify()
  }

  updateTileStreamPreview(
    id: string,
    cells: GridCell[],
    mode: TileStreamPreviewMode,
    assetContext: TileStreamAssetContext,
  ) {
    const transaction = this.transactions.get(id)
    if (!transaction) {
      return
    }

    transaction.mountId = assetContext.mountId
    transaction.previewMode = mode
    if (transaction.status !== 'committed') {
      transaction.status = 'preview'
    }

    if (mode === 'paint' && cells.length > 0 && assetContext.assetId) {
      const previewAsset = resolveBatchedTileAsset(assetContext.assetId)
      if (previewAsset?.assetUrl) {
        useGLTF.preload(previewAsset.assetUrl)
      }
    }

    this.notify()
  }

  commitTileStreamTransaction(id: string, startedAt: number | null) {
    const transaction = this.transactions.get(id)
    if (!transaction) {
      return
    }

    transaction.status = 'committed'
    transaction.startedAt = startedAt
    this.refreshTransactionProgress(transaction)
    this.notify()
  }

  cancelTileStreamTransaction(id: string) {
    const transaction = this.transactions.get(id)
    if (!transaction) {
      return
    }

    transaction.status = 'cancelled'
    transaction.progress = {
      totalPages: 0,
      readyPages: 0,
      pendingPages: 0,
    }
    this.transactions.delete(id)
    this.notify()
  }

  getTransactionProgress(id: string | null | undefined) {
    if (!id) {
      return null
    }

    return this.transactions.get(id)?.progress ?? null
  }

  enqueueTilePageUpload(pageKey: string, dirtyRanges: TileUploadRange[]) {
    const hadPending = this.uploadScheduler.hasPendingTileUploads()
    this.uploadScheduler.enqueueTilePageUpload(pageKey, dirtyRanges)
    if (!hadPending && this.uploadScheduler.hasPendingTileUploads()) {
      requestContinuousRender(TILE_UPLOAD_RENDER_ACTIVITY)
    }
    this.invalidate()
  }

  processTileUploadBudget(options: TileUploadBudget = {}): TileUploadBudgetResult {
    const result = this.uploadScheduler.processTileUploadBudget(options)
    result.processedUploads.forEach(({ pageKey, dirtyRanges }) => {
      const page = this.findPageByKey(pageKey)
      if (!page || page.status === 'disposed') {
        return
      }

      page.status = 'uploading'
      applyInstancedMeshUpdateRanges(page.meshEntries, dirtyRanges)
      page.status = 'ready'
      page.pendingDirtyRanges = []
      recordBuildPerfEvent('tile-stream-upload', {
        pageKey,
        rangeCount: dirtyRanges.length,
      })
    })

    if (!this.uploadScheduler.hasPendingTileUploads()) {
      releaseContinuousRender(TILE_UPLOAD_RENDER_ACTIVITY)
    } else {
      this.invalidate()
    }

    this.transactions.forEach((transaction) => this.refreshTransactionProgress(transaction))
    if (result.processedPages > 0) {
      this.notify()
    }
    return result
  }

  hasPendingTileUploads() {
    return this.uploadScheduler.hasPendingTileUploads()
  }

  getDebugSnapshot(mountId: string) {
    const mount = this.mounts.get(mountId)
    if (!mount) {
      return {
        pageCount: 0,
        pages: [],
      }
    }

    const pages = [...mount.pageGroups.values()]
      .flatMap((group) => [...group.pages.values()])
      .map((page) => ({
        pageKey: page.pageKey,
        status: page.status,
        activeCount: page.activeCount,
        dirtyRanges: [...page.pendingDirtyRanges],
        keys: page.slotKeys.filter((value): value is string => value !== null),
      }))

    return {
      pageCount: pages.length,
      pages,
    }
  }

  dispose() {
    this.mounts.forEach((mount) => {
      mount.pageGroups.forEach((pageGroup) => this.disposePageGroup(mount, pageGroup))
      mount.sources.clear()
      mount.group.clear()
    })
    this.mounts.clear()
    this.transactions.clear()
    this.uploadScheduler.clear()
    releaseContinuousRender(TILE_UPLOAD_RENDER_ACTIVITY)
    this.notify()
  }

  private ensureMount(mountId: string) {
    const existing = this.mounts.get(mountId)
    if (existing) {
      return existing
    }

    const created: TileStreamMount = {
      group: new THREE.Group(),
      pageGroups: new Map(),
      sources: new Map(),
    }
    created.group.name = `TileGpuStreamMount:${mountId}`
    this.mounts.set(mountId, created)
    return created
  }

  private rebuildMount(mountId: string) {
    const mount = this.ensureMount(mountId)
    const nextGroups = new Map<string, { descriptor: ResolvedTileStreamGroup; entries: TileStreamEntryState[] }>()

    mount.sources.forEach((registration) => {
      registration.groups.forEach((group) => {
        const existing = nextGroups.get(group.bucketKey)
        const entryStates = existing?.entries ?? []
        const entryMap = new Map(entryStates.map((entryState) => [entryState.entry.key, entryState]))
        group.entries.forEach((entry) => {
          const previous = entryMap.get(entry.key)
          const nextState: TileStreamEntryState = {
            entry,
            renderVisible: registration.kind === 'static',
          }
          if (!previous) {
            entryMap.set(entry.key, nextState)
            return
          }

          entryMap.set(entry.key, {
            entry: nextState.renderVisible ? nextState.entry : previous.entry,
            renderVisible: previous.renderVisible || nextState.renderVisible,
          })
        })

        nextGroups.set(group.bucketKey, {
          descriptor: group,
          entries: [...entryMap.values()].sort((left, right) => left.entry.key.localeCompare(right.entry.key)),
        })
      })
    })

    const staleKeys = new Set(mount.pageGroups.keys())
    nextGroups.forEach(({ descriptor, entries }, groupKey) => {
      staleKeys.delete(groupKey)
      this.syncPageGroup(mount, descriptor, entries)
    })

    staleKeys.forEach((groupKey) => {
      const staleGroup = mount.pageGroups.get(groupKey)
      if (!staleGroup) {
        return
      }
      this.disposePageGroup(mount, staleGroup)
      mount.pageGroups.delete(groupKey)
    })

    this.transactions.forEach((transaction) => this.refreshTransactionProgress(transaction))
    this.notify()
  }

  private syncPageGroup(
    mount: TileStreamMount,
    descriptor: ResolvedTileStreamGroup,
    nextEntries: TileStreamEntryState[],
  ) {
    let pageGroup = mount.pageGroups.get(descriptor.bucketKey)
    if (!pageGroup) {
      pageGroup = {
        descriptor,
        pages: new Map(),
        keyToSlot: new Map(),
        entryStates: new Map(),
        renderSignature: descriptor.renderSignature,
      }
      mount.pageGroups.set(descriptor.bucketKey, pageGroup)
    }

    pageGroup.descriptor = descriptor
    if (pageGroup.renderSignature !== descriptor.renderSignature) {
      pageGroup.pages.forEach((page) => this.configureTilePage(page, descriptor))
      pageGroup.renderSignature = descriptor.renderSignature
    }

    const nextKeys = new Set(nextEntries.map((entryState) => entryState.entry.key))
    const currentKeys = [...pageGroup.keyToSlot.keys()]
    currentKeys.forEach((entryKey) => {
      if (nextKeys.has(entryKey)) {
        return
      }

      this.removeEntryFromPageGroup(mount, pageGroup!, entryKey)
    })

    nextEntries.forEach((entryState) => {
      const previousState = pageGroup!.entryStates.get(entryState.entry.key)
      const nextSignature = buildTileStreamEntrySignature(entryState)
      if (previousState && buildTileStreamEntrySignature(previousState) === nextSignature) {
        return
      }

      const assignment = pageGroup!.keyToSlot.get(entryState.entry.key)
      const page = assignment
        ? pageGroup!.pages.get(assignment.pageIndex) ?? null
        : this.allocatePageForEntry(mount, pageGroup!, descriptor)
      if (!page) {
        return
      }

      const slotIndex = assignment?.slotIndex ?? this.allocateSlot(page)
      if (slotIndex === null) {
        return
      }

      page.slotKeys[slotIndex] = entryState.entry.key
      pageGroup!.keyToSlot.set(entryState.entry.key, {
        pageIndex: page.pageIndex,
        slotIndex,
      })

      writeInstancedMeshSlot(
        page.meshEntries,
        slotIndex,
        entryState.renderVisible ? entryState.entry : null,
      )
      page.activeCount = Math.max(page.activeCount, slotIndex + 1)
      setInstancedMeshEntryCount(page.meshEntries, page.activeCount)
      this.markPageDirty(page, { start: slotIndex, count: 1 })
      pageGroup!.entryStates.set(entryState.entry.key, entryState)
    })
  }

  private allocatePageForEntry(
    mount: TileStreamMount,
    pageGroup: TilePageGroup,
    descriptor: ResolvedTileStreamGroup,
  ) {
    const reusable = [...pageGroup.pages.values()]
      .sort((left, right) => left.pageIndex - right.pageIndex)
      .find((page) => page.freeSlots.length > 0)
    if (reusable) {
      return reusable
    }

    const nextPageIndex = getNextPageIndex(pageGroup.pages)
    const pageKey = `${descriptor.bucketKey}|${nextPageIndex}`
    const pageRoot = new THREE.Group()
    pageRoot.name = pageKey
    const meshEntries = traceBuildPerf('tile-page-create', {
      bucketKey: descriptor.bucketKey,
      pageKey,
      pageIndex: nextPageIndex,
    }, () => makeInstancedMeshEntries(descriptor.sourceScene, descriptor.entries[0]?.transform, TILE_PAGE_SIZE))

    const page: TilePage = {
      pageKey,
      pageIndex: nextPageIndex,
      root: pageRoot,
      meshEntries,
      depthMaterials: new Map(),
      slotKeys: Array.from({ length: TILE_PAGE_SIZE }, () => null),
      freeSlots: Array.from({ length: TILE_PAGE_SIZE }, (_, index) => TILE_PAGE_SIZE - index - 1),
      activeCount: 0,
      status: 'idle',
      pendingDirtyRanges: [],
    }

    this.configureTilePage(page, descriptor)
    pageGroup.pages.set(nextPageIndex, page)
    mount.group.add(page.root)
    return page
  }

  private configureTilePage(page: TilePage, descriptor: ResolvedTileStreamGroup) {
    page.root.clear()
    page.depthMaterials.forEach((material) => material.dispose())
    page.depthMaterials.clear()

    const visibility = descriptor.visibility
    const overlayOpacity = visibility === 'explored' ? 0.6 : 0
    const useBuildAnimation = descriptor.useBuildAnimation
    const bakedLightField = descriptor.entries[0]?.bakedLightField ?? null
    const clipMinY = getBelowGroundClipMinY(descriptor.variant)

    page.meshEntries.forEach((entry) => {
      const material = getInstancedMaterial(entry)
      applyBuildAnimationToMaterial(material, useBuildAnimation, clipMinY)
        applyBakedLightToMaterial(
          material,
          descriptor.useBakedLight
            ? {
            useLightAttribute: true,
            useDirectionAttribute: descriptor.variant === 'wall',
            useSecondaryDirectionAttribute: descriptor.variant === 'wall' && descriptor.useSecondaryDirectionAttribute,
            useTopSurfaceMask: descriptor.variant === 'floor',
            useFlicker: descriptor.useBakedFlicker,
            lightField: bakedLightField,
          }
          : null,
      )
      applyFogOfWarToMaterial(
        material,
        descriptor.usesGpuFog ? descriptor.fogRuntime : null,
        {
          variant: descriptor.variant,
          useCellAttribute: descriptor.usesGpuFog && descriptor.variant === 'floor',
        },
      )

      const depthMaterial = new THREE.MeshDepthMaterial()
      depthMaterial.depthPacking = THREE.RGBADepthPacking
      applyBelowGroundClipToMaterial(depthMaterial, useBuildAnimation, clipMinY)
      page.depthMaterials.set(entry.meshKey, depthMaterial)

      entry.instancedMesh.castShadow = !useBuildAnimation
      entry.instancedMesh.receiveShadow = descriptor.receiveShadow
      entry.instancedMesh.customDepthMaterial = entry.instancedMesh.castShadow ? depthMaterial : undefined
      entry.tintMesh.visible = visibility === 'explored'
      setTintOpacity(entry.tintMesh, overlayOpacity)

      if (descriptor.shouldRenderBase) {
        page.root.add(entry.instancedMesh)
      }
      if (!descriptor.usesGpuFog && visibility === 'explored') {
        page.root.add(entry.tintMesh)
      }
    })
  }

  private removeEntryFromPageGroup(
    mount: TileStreamMount,
    pageGroup: TilePageGroup,
    entryKey: string,
  ) {
    const assignment = pageGroup.keyToSlot.get(entryKey)
    if (!assignment) {
      return
    }

    const page = pageGroup.pages.get(assignment.pageIndex)
    if (!page) {
      pageGroup.keyToSlot.delete(entryKey)
      pageGroup.entryStates.delete(entryKey)
      return
    }

    writeInstancedMeshSlot(page.meshEntries, assignment.slotIndex, null)
    page.slotKeys[assignment.slotIndex] = null
    page.freeSlots.push(assignment.slotIndex)
    page.activeCount = getActiveCount(page.slotKeys)
    setInstancedMeshEntryCount(page.meshEntries, page.activeCount)
    this.markPageDirty(page, { start: assignment.slotIndex, count: 1 })
    pageGroup.keyToSlot.delete(entryKey)
    pageGroup.entryStates.delete(entryKey)

    if (page.slotKeys.every((key) => key === null)) {
      this.disposePage(mount, pageGroup, page)
    }
  }

  private disposePage(mount: TileStreamMount, pageGroup: TilePageGroup, page: TilePage) {
    page.status = 'disposed'
    mount.group.remove(page.root)
    page.root.clear()
    page.depthMaterials.forEach((material) => material.dispose())
    page.depthMaterials.clear()
    disposeInstancedMeshEntries(page.meshEntries)
    pageGroup.pages.delete(page.pageIndex)
  }

  private disposePageGroup(mount: TileStreamMount, pageGroup: TilePageGroup) {
    pageGroup.pages.forEach((page) => this.disposePage(mount, pageGroup, page))
    pageGroup.keyToSlot.clear()
    pageGroup.entryStates.clear()
  }

  private allocateSlot(page: TilePage) {
    const slotIndex = page.freeSlots.pop()
    return slotIndex === undefined ? null : slotIndex
  }

  private markPageDirty(page: TilePage, range: TileUploadRange) {
    page.pendingDirtyRanges = [...page.pendingDirtyRanges, range]
    page.status = 'dirty'
    this.enqueueTilePageUpload(page.pageKey, page.pendingDirtyRanges)
  }

  private refreshTransactionProgress(transaction: TileStreamTransaction) {
    if (transaction.status !== 'committed' || !transaction.mountId || transaction.startedAt === null) {
      transaction.progress = {
        totalPages: 0,
        readyPages: 0,
        pendingPages: 0,
      }
      return
    }

    const mount = this.mounts.get(transaction.mountId)
    if (!mount) {
      transaction.progress = {
        totalPages: 0,
        readyPages: 0,
        pendingPages: 0,
      }
      return
    }

    const trackedPages = new Map<string, TilePage>()
    mount.pageGroups.forEach((pageGroup) => {
      pageGroup.entryStates.forEach((entryState, entryKey) => {
        if (entryState.entry.buildAnimationStart === undefined) {
          return
        }
        if (entryState.entry.buildAnimationStart < transaction.startedAt! - 0.5) {
          return
        }
        const assignment = pageGroup.keyToSlot.get(entryKey)
        const page = assignment ? pageGroup.pages.get(assignment.pageIndex) ?? null : null
        if (page) {
          trackedPages.set(page.pageKey, page)
        }
      })
    })

    const pages = [...trackedPages.values()]
    const readyPages = pages.filter((page) => page.status === 'ready').length
    transaction.progress = {
      totalPages: pages.length,
      readyPages,
      pendingPages: pages.length - readyPages,
    }
  }

  private findPageByKey(pageKey: string) {
    for (const mount of this.mounts.values()) {
      for (const pageGroup of mount.pageGroups.values()) {
        for (const page of pageGroup.pages.values()) {
          if (page.pageKey === pageKey) {
            return page
          }
        }
      }
    }
    return null
  }

  private notify() {
    this.version += 1
    this.invalidate()
    this.listeners.forEach((listener) => listener())
  }
}

function getNextPageIndex(pages: ReadonlyMap<number, TilePage>) {
  let pageIndex = 0
  while (pages.has(pageIndex)) {
    pageIndex += 1
  }
  return pageIndex
}

function getInstancedMaterial(entry: InstancedMeshEntry) {
  const material = entry.instancedMesh.material
  return Array.isArray(material) ? material[0]! : material
}

function setTintOpacity(mesh: THREE.InstancedMesh, opacity: number) {
  const material = mesh.material
  if (Array.isArray(material)) {
    material.forEach((entry) => {
      entry.opacity = opacity
    })
    return
  }

  material.opacity = opacity
}

function getActiveCount(slotKeys: readonly (string | null)[]) {
  for (let index = slotKeys.length - 1; index >= 0; index -= 1) {
    if (slotKeys[index] !== null) {
      return index + 1
    }
  }
  return 0
}

function buildTileStreamEntrySignature(entryState: TileStreamEntryState) {
  return [
    entryState.entry.key,
    entryState.renderVisible ? 'visible' : 'hidden',
    entryState.entry.position.join(','),
    entryState.entry.rotation.join(','),
    entryState.entry.buildAnimationStart ?? '',
    entryState.entry.buildAnimationDelay ?? '',
    entryState.entry.bakedLightDirection?.join(',') ?? '',
    entryState.entry.bakedLightDirectionSecondary?.join(',') ?? '',
    entryState.entry.fogCell?.join(',') ?? '',
  ].join('|')
}

function buildSourceRegistrationSignature(registration: TileStreamSourceRegistration) {
  const groupSignatures = registration.groups
    .map((group) => buildResolvedTileStreamGroupSignature(group))
    .sort()

  return [
    registration.kind,
    registration.floorId,
    registration.transactionId ?? '',
    ...groupSignatures,
  ].join('||')
}

function buildResolvedTileStreamGroupSignature(group: ResolvedTileStreamGroup) {
  return [
    group.bucketKey,
    group.chunkKey,
    group.assetUrl,
    group.geometrySignature,
    group.renderSignature,
    group.variant,
    group.visibility,
    group.receiveShadow ? 'shadow' : 'flat',
    group.useBuildAnimation ? 'animated' : 'static',
    group.useBakedLight ? 'baked' : 'unlit',
    group.useBakedFlicker ? 'flicker' : 'steady',
    group.useSecondaryDirectionAttribute ? 'double-direction' : 'single-direction',
    group.shouldRenderBase ? 'base' : 'overlay-only',
    group.useLineOfSightPostMask ? 'post-mask' : 'scene-mask',
    group.usesGpuFog ? 'gpu-fog' : 'no-fog',
    group.sourceScene.uuid,
  ].join('|')
}
