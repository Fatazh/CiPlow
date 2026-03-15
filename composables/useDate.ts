// composables/useDate.ts
// Indonesian date formatting & relative time utilities for PPLow

export const useDate = () => {
  const LOCALE = 'id-ID'

  const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  const MONTHS_SHORT_ID = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ]

  const DAYS_ID = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
  ]

  const DAYS_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  /**
   * Parse a date input safely
   * Accepts Date | string | number | null | undefined
   */
  const toDate = (value: Date | string | number | null | undefined): Date => {
    if (!value) return new Date()
    if (value instanceof Date) return value
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date() : d
  }

  /**
   * Format as full Indonesian date
   * e.g. "10 Maret 2025"
   */
  const formatDate = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Format as short Indonesian date
   * e.g. "10 Mar 2025"
   */
  const formatDateShort = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    return `${d.getDate()} ${MONTHS_SHORT_ID[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Format as date with day name
   * e.g. "Senin, 10 Maret 2025"
   */
  const formatDateFull = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Format as time only (HH:mm)
   * e.g. "14:30"
   */
  const formatTime = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  /**
   * Format as date + time
   * e.g. "10 Mar 2025, 14:30"
   */
  const formatDateTime = (value: Date | string | number | null | undefined): string => {
    return `${formatDateShort(value)}, ${formatTime(value)}`
  }

  /**
   * Format as month + year only
   * e.g. "Maret 2025"
   */
  const formatMonthYear = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    return `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Format as short month + year
   * e.g. "Mar 2025"
   */
  const formatMonthYearShort = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    return `${MONTHS_SHORT_ID[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Get relative time label in Indonesian
   * e.g. "Hari ini", "Kemarin", "3 hari lalu", "2 minggu lalu"
   */
  const formatRelative = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    const now = new Date()

    // Normalize to start of day for date comparison
    const startOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

    const dDay = startOfDay(d).getTime()
    const nowDay = startOfDay(now).getTime()
    const diffMs = nowDay - dDay
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hari ini'
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`
    if (diffDays < 14) return '1 minggu lalu'
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
    if (diffDays < 60) return '1 bulan lalu'
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`
    if (diffDays < 730) return '1 tahun lalu'
    return `${Math.floor(diffDays / 365)} tahun lalu`
  }

  /**
   * Smart format: shows relative for recent, date for older
   * Within 6 days → relative | within current year → "10 Mar" | older → "10 Mar 2024"
   */
  const formatSmart = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    const now = new Date()

    const startOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

    const diffDays = Math.round(
      (startOfDay(now).getTime() - startOfDay(d).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays <= 6) return formatRelative(d)
    if (d.getFullYear() === now.getFullYear()) {
      return `${d.getDate()} ${MONTHS_SHORT_ID[d.getMonth()]}`
    }
    return formatDateShort(d)
  }

  /**
   * Get the current month name in Indonesian
   * e.g. "Maret"
   */
  const currentMonthName = (): string => {
    return MONTHS_ID[new Date().getMonth()]
  }

  /**
   * Get the current month + year
   * e.g. "Maret 2025"
   */
  const currentMonthYear = (): string => {
    return formatMonthYear(new Date())
  }

  /**
   * Get current year as number
   */
  const currentYear = (): number => new Date().getFullYear()

  /**
   * Get current month as number (1–12)
   */
  const currentMonth = (): number => new Date().getMonth() + 1

  /**
   * Get start of a month as Date
   * e.g. startOfMonth(3, 2025) → 2025-03-01T00:00:00
   */
  const startOfMonth = (month: number, year: number): Date => {
    return new Date(year, month - 1, 1, 0, 0, 0, 0)
  }

  /**
   * Get end of a month as Date
   * e.g. endOfMonth(3, 2025) → 2025-03-31T23:59:59
   */
  const endOfMonth = (month: number, year: number): Date => {
    return new Date(year, month, 0, 23, 59, 59, 999)
  }

  /**
   * Get start of today
   */
  const startOfToday = (): Date => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  }

  /**
   * Get end of today
   */
  const endOfToday = (): Date => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  }

  /**
   * Check if a date is today
   */
  const isToday = (value: Date | string | number | null | undefined): boolean => {
    const d = toDate(value)
    const now = new Date()
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  }

  /**
   * Check if a date is yesterday
   */
  const isYesterday = (value: Date | string | number | null | undefined): boolean => {
    const d = toDate(value)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    )
  }

  /**
   * Check if two dates are in the same month/year
   */
  const isSameMonth = (
    a: Date | string | number | null | undefined,
    b: Date | string | number | null | undefined,
  ): boolean => {
    const da = toDate(a)
    const db = toDate(b)
    return da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()
  }

  /**
   * Group an array of items by date label (Hari ini / Kemarin / full date)
   * The item must have a `date` field
   */
  const groupByDate = <T extends { date: string | Date | number }>(
    items: T[],
  ): { label: string; items: T[] }[] => {
    const groups: Record<string, T[]> = {}

    for (const item of items) {
      const d = toDate(item.date)
      let label: string

      if (isToday(d)) {
        label = 'Hari ini'
      } else if (isYesterday(d)) {
        label = 'Kemarin'
      } else {
        label = formatDate(d)
      }

      if (!groups[label]) groups[label] = []
      groups[label].push(item)
    }

    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  }

  /**
   * Build an array of the last N months as { month, year, label } objects
   * Useful for period selectors
   */
  const getLastNMonths = (n: number = 6): { month: number; year: number; label: string }[] => {
    const result = []
    const now = new Date()

    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      result.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: formatMonthYear(d),
      })
    }

    return result
  }

  /**
   * Format a date as ISO date string (YYYY-MM-DD)
   * e.g. "2025-03-10"
   */
  const toISODate = (value: Date | string | number | null | undefined): string => {
    const d = toDate(value)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return {
    // Helpers
    toDate,
    toISODate,
    // Formatting
    formatDate,
    formatDateShort,
    formatDateFull,
    formatTime,
    formatDateTime,
    formatMonthYear,
    formatMonthYearShort,
    formatRelative,
    formatSmart,
    // Current period
    currentMonthName,
    currentMonthYear,
    currentYear,
    currentMonth,
    // Date math
    startOfMonth,
    endOfMonth,
    startOfToday,
    endOfToday,
    // Checks
    isToday,
    isYesterday,
    isSameMonth,
    // Grouping / utils
    groupByDate,
    getLastNMonths,
    // Constants
    MONTHS_ID,
    MONTHS_SHORT_ID,
    DAYS_ID,
    DAYS_SHORT_ID,
  }
}
