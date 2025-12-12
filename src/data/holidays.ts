export type Holiday = {
    date: string // Format: YYYY-MM-DD
    name: string
}

export const holidays: Holiday[] = [
    // 2025
    { date: '2025-01-01', name: '中華民國開國紀念日' },
    { date: '2025-01-27', name: '調整放假日' },
    { date: '2025-01-28', name: '除夕' },
    { date: '2025-01-29', name: '春節' },
    { date: '2025-01-30', name: '春節' },
    { date: '2025-01-31', name: '春節' },
    { date: '2025-02-28', name: '和平紀念日' },
    { date: '2025-04-03', name: '兒童節' },
    { date: '2025-04-04', name: '民族掃墓節(清明節)' },
    { date: '2025-05-30', name: '補假' },
    { date: '2025-05-31', name: '端午節' },
    { date: '2025-09-28', name: '孔子誕辰紀念日' },
    { date: '2025-09-29', name: '補假' },
    { date: '2025-10-06', name: '中秋節' },
    { date: '2025-10-10', name: '國慶日' },
    { date: '2025-10-24', name: '補假' },
    { date: '2025-10-25', name: '臺灣光復節' },
    { date: '2025-12-25', name: '行憲紀念日' },

    // 2026
    { date: '2026-01-01', name: '中華民國開國紀念日' },
    { date: '2026-02-15', name: '小年夜' },
    { date: '2026-02-16', name: '除夕' },
    { date: '2026-02-17', name: '春節' },
    { date: '2026-02-18', name: '春節' },
    { date: '2026-02-19', name: '春節' },
    { date: '2026-02-20', name: '春節' },
    { date: '2026-02-27', name: '補假' },
    { date: '2026-02-28', name: '和平紀念日' },
    { date: '2026-03-02', name: '調整放假日' },
    { date: '2026-04-03', name: '兒童節' },
    { date: '2026-04-04', name: '民族掃墓節(清明節)' },
    { date: '2026-04-06', name: '補假' },
    { date: '2026-05-01', name: '勞動節' },
    { date: '2026-06-19', name: '端午節' },
    { date: '2026-09-25', name: '中秋節' },
    { date: '2026-09-28', name: '教師節' },
    { date: '2026-10-09', name: '國慶日' },
    { date: '2026-10-10', name: '國慶日' },
    { date: '2026-10-25', name: '臺灣光復暨金門古寧頭大捷紀念日' },
    { date: '2026-10-26', name: '補假' },
    { date: '2026-12-25', name: '行憲紀念日' },
]

// Helper function to check if a date is a holiday
export function getHoliday(date: Date): Holiday | undefined {
    const dateStr = formatDateToString(date)
    return holidays.find(h => h.date === dateStr)
}

// Helper function to format date as YYYY-MM-DD
function formatDateToString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
