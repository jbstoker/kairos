/** Kairos's constructed 13-day rhythm, inspired by Tzolk'in day signs.
 * Not the historical 260-day Tzolk'in: this cycle resets every civil Jan 1.
 * Days 365 and 366 are The Closing, outside all 28 complete 13-day weeks.
 */
(function () {
    'use strict';
    const KAIROS_WEEK = Object.freeze({
        DAYS_PER_WEEK: 13,
        WEEKS_PER_YEAR: 28,
        DAY_NAMES: Object.freeze(['Imix', 'Ik', 'Akbal', 'Kan', 'Chicchan', 'Cimi',
            'Manik', 'Lamat', 'Muluc', 'Oc', 'Chuen', 'Eb', 'Ben']),
        DAY_SYMBOLS: Object.freeze(['💧', '💨', '🌙', '🌱', '🐍', '💀', '🦌', '⭐',
            '🌊', '🐕', '🐒', '🌿', '🎋'])
    });

    function dayOfYear(date) {
        return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
            - Date.UTC(date.getFullYear(), 0, 1)) / 86400000); // zero-based, DST safe
    }

    function getKairosWeekDay(date) {
        const day = dayOfYear(date);
        if (day < 0 || day >= 364) return null;
        const index = day % KAIROS_WEEK.DAYS_PER_WEEK;
        return { index, name: KAIROS_WEEK.DAY_NAMES[index], symbol: KAIROS_WEEK.DAY_SYMBOLS[index] };
    }

    function getKairosWeekNumber(date) {
        const day = dayOfYear(date);
        return day >= 0 && day < 364 ? Math.floor(day / 13) + 1 : null;
    }

    function getKairosWeekDisplay(date) {
        const weekDay = getKairosWeekDay(date);
        if (!weekDay) return { dayName: 'The Closing', daySymbol: '', dayIndex: null,
            weekNumber: null, display: 'The Closing · Outside the week' };
        const weekNumber = getKairosWeekNumber(date);
        return { dayName: weekDay.name, daySymbol: weekDay.symbol,
            dayIndex: weekDay.index + 1, weekNumber,
            display: `${weekDay.symbol} ${weekDay.name} · Week ${weekNumber}/28` };
    }

    const api = { KAIROS_WEEK, getKairosWeekDay, getKairosWeekNumber, getKairosWeekDisplay };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') Object.assign(window, api);
})();