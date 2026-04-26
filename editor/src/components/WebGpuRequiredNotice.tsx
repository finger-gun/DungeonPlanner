type Props = {
  title?: string
  message?: string
}

export function WebGpuRequiredNotice({
  title = 'WebGPU required',
  message = 'DungeonPlanner needs WebGPU to render the scene.',
}: Props) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-stone-950 px-6">
      <div className="max-w-lg rounded-3xl border border-amber-300/20 bg-stone-950/90 p-6 text-center shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-300/80">
          {title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          {message}
        </p>
      </div>
    </div>
  )
}
