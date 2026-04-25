export function extendOpenPassageBrush(
  wallKeys: string[],
  wallKey: string | null,
) {
  if (!wallKey) {
    return wallKeys
  }
  if (wallKeys.includes(wallKey)) {
    return wallKeys
  }

  return [...wallKeys, wallKey]
}
