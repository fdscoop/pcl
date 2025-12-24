const threadTonePalette = [
  {
    base: 'bg-sky-50/80',
    gradient: 'bg-gradient-to-br from-sky-200 via-sky-150 to-sky-100',
    hover: 'hover:bg-sky-100/80',
    border: 'border-sky-200/70',
    selected: 'bg-sky-100/90',
    title: 'text-sky-900'
  },
  {
    base: 'bg-emerald-50/80',
    gradient: 'bg-gradient-to-br from-emerald-200 via-emerald-150 to-emerald-100',
    hover: 'hover:bg-emerald-100/80',
    border: 'border-emerald-200/70',
    selected: 'bg-emerald-100/90',
    title: 'text-emerald-900'
  },
  {
    base: 'bg-amber-50/80',
    gradient: 'bg-gradient-to-br from-amber-200 via-amber-150 to-amber-100',
    hover: 'hover:bg-amber-100/80',
    border: 'border-amber-200/70',
    selected: 'bg-amber-100/90',
    title: 'text-amber-900'
  },
  {
    base: 'bg-rose-50/80',
    gradient: 'bg-gradient-to-br from-rose-200 via-rose-150 to-rose-100',
    hover: 'hover:bg-rose-100/80',
    border: 'border-rose-200/70',
    selected: 'bg-rose-100/90',
    title: 'text-rose-900'
  },
  {
    base: 'bg-indigo-50/80',
    gradient: 'bg-gradient-to-br from-indigo-200 via-indigo-150 to-indigo-100',
    hover: 'hover:bg-indigo-100/80',
    border: 'border-indigo-200/70',
    selected: 'bg-indigo-100/90',
    title: 'text-indigo-900'
  }
] as const

export const getThreadTone = (key: string) => {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 2147483647
  }
  return threadTonePalette[hash % threadTonePalette.length]
}

export const getToneForThread = (thread: { otherPartyType?: string; key: string }) => {
  if (thread.otherPartyType === 'club_owner') {
    return {
      base: 'bg-sky-200/70',
      gradient: 'bg-gradient-to-br from-sky-300 via-sky-200 to-sky-100',
      hover: 'hover:bg-sky-300/70',
      border: 'border-sky-300/70',
      selected: 'bg-sky-300/90',
      title: 'text-sky-900'
    }
  }

  if (thread.otherPartyType === 'player') {
    return {
      base: 'bg-amber-100/60',
      gradient: 'bg-gradient-to-br from-amber-200 via-amber-150 to-amber-100',
      hover: 'hover:bg-amber-200/60',
      border: 'border-amber-200/60',
      selected: 'bg-amber-100/80',
      title: 'text-amber-700'
    }
  }

  return getThreadTone(thread.key)
}

export type Tone = ReturnType<typeof getToneForThread>
