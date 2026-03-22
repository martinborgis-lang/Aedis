import { ImportLot, DateRange } from './types'

export function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) added++ // skip weekend
  }
  return result
}

export function topologicalSort(lots: ImportLot[]): ImportLot[] {
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const result: ImportLot[] = []

  function visit(lotNumber: string) {
    if (visiting.has(lotNumber)) {
      // Cycle détecté - on ignore cette dépendance
      return
    }
    if (visited.has(lotNumber)) {
      return
    }

    const lot = lots.find(l => l.number === lotNumber)
    if (!lot) return

    visiting.add(lotNumber)

    // Visiter d'abord toutes les dépendances
    for (const dep of lot.depends_on) {
      const cleanDep = dep.replace('_partial', '')
      visit(cleanDep)
    }

    visiting.delete(lotNumber)
    visited.add(lotNumber)
    result.push(lot)
  }

  // Démarrer par les lots sans dépendances
  for (const lot of lots) {
    if (lot.depends_on.length === 0) {
      visit(lot.number)
    }
  }

  // Puis visiter les lots restants
  for (const lot of lots) {
    visit(lot.number)
  }

  return result
}

export function calculateAllDates(
  lots: ImportLot[],
  startDate: Date
): Map<string, DateRange> {
  const resolved = new Map<string, DateRange>()

  function resolveLot(lotNumber: string): DateRange {
    if (resolved.has(lotNumber)) {
      return resolved.get(lotNumber)!
    }

    const lot = lots.find(l => l.number === lotNumber)
    if (!lot) {
      // Fallback si le lot n'existe pas
      const fallback = { start: startDate, end: addWorkingDays(startDate, 1) }
      resolved.set(lotNumber, fallback)
      return fallback
    }

    let start: Date

    if (lot.depends_on.length === 0) {
      start = new Date(startDate)
    } else {
      // Gérer les dépendances partielles (_partial = peut commencer
      // quand le lot précédent est à 50%)
      const depEnds = lot.depends_on.map(dep => {
        const isPartial = dep.endsWith('_partial')
        const depNum = dep.replace('_partial', '')
        const depDates = resolveLot(depNum)

        if (isPartial) {
          // Peut commencer à mi-chemin du lot précédent
          const depLot = lots.find(l => l.number === depNum)
          if (depLot) {
            const halfDuration = Math.floor(depLot.duration_days / 2)
            return addWorkingDays(depDates.start, halfDuration)
          }
        }
        return depDates.end
      }).filter(date => date instanceof Date)

      if (depEnds.length > 0) {
        const latestEnd = new Date(Math.max(...depEnds.map(d => d.getTime())))
        start = addWorkingDays(latestEnd, 1) // 1 jour de battement
      } else {
        start = new Date(startDate)
      }
    }

    const end = addWorkingDays(start, lot.duration_days)
    const range = { start, end }
    resolved.set(lotNumber, range)
    return range
  }

  // Tri topologique pour résoudre dans le bon ordre
  const sorted = topologicalSort(lots)
  sorted.forEach(lot => resolveLot(lot.number))

  return resolved
}

export function calculateProjectEndDate(lots: ImportLot[], startDate: Date): Date {
  if (lots.length === 0) return startDate

  const dateRanges = calculateAllDates(lots, startDate)
  const allEndDates = Array.from(dateRanges.values()).map(range => range.end)

  return new Date(Math.max(...allEndDates.map(d => d.getTime())))
}

export function calculateProjectDurationWeeks(lots: ImportLot[], startDate: Date): number {
  const endDate = calculateProjectEndDate(lots, startDate)
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.ceil(diffDays / 7)
}

export function recalculateLotsWithDates(
  lots: ImportLot[],
  startDate: Date
): ImportLot[] {
  const dateRanges = calculateAllDates(lots, startDate)

  return lots.map(lot => ({
    ...lot,
    calculated_start: dateRanges.get(lot.number)?.start.toISOString() || '',
    calculated_end: dateRanges.get(lot.number)?.end.toISOString() || ''
  }))
}