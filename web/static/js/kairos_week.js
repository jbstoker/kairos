/** Frisian 13-day week, anchored to the first day of the Kairos year (Jan 1).
 * Days 365 and 366 are The Closing, outside all 28 complete 13-day weeks.
 */
(function () {
    'use strict';
    const KAIROS_WEEK = Object.freeze({
        DAYS_PER_WEEK: 13,
        WEEKS_PER_YEAR: 28,
        DAY_NAMES: Object.freeze(['Tiw', 'Wodan', 'Thuner', 'Fro', 'Njord', 'Balder',
            'Bragi', 'Heimdall', 'Hoder', 'Vidar', 'Vali', 'Ull', 'Forseti']),
        DAY_SYMBOLS: Object.freeze(['⚖️', '👁️', '⚡', '🌾', '🌊', '☀️', '🎵', '🛡️',
            '🌑', '🤫', '🎯', '❄️', '🕊️']),
        DAY_DOMAINS: Object.freeze(['Justice, law, heroic glory', 'Wisdom, war, poetry',
            'Strength, protection', 'Fertility, peace, harvest', 'Sea, wealth, seafaring',
            'Light, beauty, rebirth', 'Poetry, music, eloquence', 'Guardianship, foresight',
            'Darkness, winter, silence', 'Resilience, silence', 'Vengeance, precision',
            'Winter, skiing, archery', 'Justice, reconciliation'])
    });

    function dayOfYear(date) {
        return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
            - Date.UTC(date.getFullYear(), 0, 1)) / 86400000); // zero-based, DST safe
    }

    function getKairosWeekDay(date) {
        const day = dayOfYear(date);
        if (day < 0 || day >= 364) return null;
        const index = day % KAIROS_WEEK.DAYS_PER_WEEK;
        return { index, name: KAIROS_WEEK.DAY_NAMES[index], symbol: KAIROS_WEEK.DAY_SYMBOLS[index],
            domain: KAIROS_WEEK.DAY_DOMAINS[index] };
    }

    function getKairosWeekNumber(date) {
        const day = dayOfYear(date);
        return day >= 0 && day < 364 ? Math.floor(day / KAIROS_WEEK.DAYS_PER_WEEK) + 1 : null;
    }

    function getKairosWeekDisplay(date) {
        const weekDay = getKairosWeekDay(date);
        if (!weekDay) return { dayName: 'The Closing', daySymbol: '', dayDomain: '', dayIndex: null,
            weekNumber: null, display: 'The Closing · Outside the week' };
        const weekNumber = getKairosWeekNumber(date);
        return { dayName: weekDay.name, daySymbol: weekDay.symbol, dayDomain: weekDay.domain,
            dayIndex: weekDay.index + 1, weekNumber,
            display: `${weekDay.symbol} ${weekDay.name} · Week ${weekNumber}/28` };
    }

    const api = { KAIROS_WEEK, getKairosWeekDay, getKairosWeekNumber, getKairosWeekDisplay };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') Object.assign(window, api);
})();