// Temporary branch flag: keep Walls mode available for spline editing while
// disabling the legacy inner-wall brush that fights the spline handles.
export const LEGACY_INNER_WALL_EDITING_ENABLED = false

export const WALLS_MODE_LABEL = LEGACY_INNER_WALL_EDITING_ENABLED ? 'Inner walls' : 'Spline walls'
