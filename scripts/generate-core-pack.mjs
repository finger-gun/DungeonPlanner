import { runImportModels } from './import-models.mjs'

runImportModels({
  target: 'core',
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
