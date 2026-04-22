import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {
  defaultKtxTranscoderSourceDir,
  defaultKtxTranscoderTargetDir,
} from './model-pipeline.mjs'

function main() {
  if (!existsSync(defaultKtxTranscoderSourceDir)) {
    throw new Error(`Basis transcoder source directory not found: ${defaultKtxTranscoderSourceDir}`)
  }

  mkdirSync(defaultKtxTranscoderTargetDir, { recursive: true })

  const fileNames = ['basis_transcoder.js', 'basis_transcoder.wasm']
  for (const fileName of fileNames) {
    copyFileSync(
      path.join(defaultKtxTranscoderSourceDir, fileName),
      path.join(defaultKtxTranscoderTargetDir, fileName),
    )
  }

  console.log(`Synced ${fileNames.length} KTX2 transcoder files to public/three/basis`)
}

main()
