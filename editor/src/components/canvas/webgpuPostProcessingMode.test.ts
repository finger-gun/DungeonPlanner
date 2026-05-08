import { describe, expect, it } from 'vitest'
import {
  applyWebGpuScenePassStencilSupport,
  shouldEnableActiveFloorPostProcessing,
  WEBGPU_SCENE_PASS_OPTIONS,
} from './webgpuPostProcessingMode'
import { DepthStencilFormat, FloatType, UnsignedInt248Type } from 'three'

describe('webgpuPostProcessingMode', () => {
  it('keeps post-processing disabled when active-floor effects and selection mode are both inactive', () => {
    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: false,
      tool: 'room',
      selection: null,
    })).toBe(false)
  })

  it('enables post-processing for lens blur, pixelation, or select mode', () => {
    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: true,
      pixelateEnabled: false,
      tool: 'room',
      selection: null,
    })).toBe(true)

    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: true,
      tool: 'room',
      selection: null,
    })).toBe(true)

    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: false,
      tool: 'select',
      selection: null,
    })).toBe(true)

    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: false,
      tool: 'select',
      selection: 'wall:1',
    })).toBe(true)
  })

  it('requests stencil support for the shared scene pass so floor masks survive post-processing', () => {
    expect(WEBGPU_SCENE_PASS_OPTIONS).toEqual({
      stencilBuffer: true,
    })
  })

  it('upgrades the shared scene pass depth texture to a depth-stencil format', () => {
    const scenePass = {
      renderTarget: {
        stencilBuffer: false,
        depthTexture: {
          format: 0,
          type: 0,
        },
      },
    }

    applyWebGpuScenePassStencilSupport(scenePass, false)
    expect(scenePass.renderTarget.stencilBuffer).toBe(true)
    expect(scenePass.renderTarget.depthTexture.format).toBe(DepthStencilFormat)
    expect(scenePass.renderTarget.depthTexture.type).toBe(UnsignedInt248Type)

    applyWebGpuScenePassStencilSupport(scenePass, true)
    expect(scenePass.renderTarget.depthTexture.type).toBe(FloatType)
  })
})
