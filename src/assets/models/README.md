Drop raw `.glb` source files here.

Current pack layout:

- `src/assets/models/core/` contains the copied raw GLBs for the core pack.

Recommended workflow:

1. Add a model to this folder.
2. Run `npm run generate:content-pack:core` to rebuild the current core pack outputs.
3. Import the generated component or pass the asset path into `DungeonObject`.
