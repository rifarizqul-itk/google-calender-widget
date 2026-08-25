const CALENDAR_BASE_URL = 'https://calendar.google.com/calendar/u/0/r';

const CALENDAR_VIEWS = Object.freeze({
    AGENDA: `${CALENDAR_BASE_URL}/agenda`,
    DAY: `${CALENDAR_BASE_URL}/day`,
    WEEK: `${CALENDAR_BASE_URL}/week`,
    MONTH: `${CALENDAR_BASE_URL}/month`,
    YEAR: `${CALENDAR_BASE_URL}/year`
});

const DEFAULT_VIEW = 'AGENDA';
const GOOGLE_ACCOUNTS_URL = 'https://accounts.google.com';

const DEFAULT_WINDOW_BOUNDS = Object.freeze({
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 400,
    maximizable: true,
    minimizable: true
});

/**
 * Detect calendar view name from URL
 * @param {string} url 
 * @returns {'AGENDA' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null}
 */
const detectViewFromUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('calendar.google.com')) {
        return null;
    }

    if (url.includes('/agenda') || url.includes('/schedule')) return 'AGENDA';
    if (url.includes('/day')) return 'DAY';
    if (url.includes('/week')) return 'WEEK';
    if (url.includes('/month')) return 'MONTH';
    if (url.includes('/year')) return 'YEAR';

    return null;
};

module.exports = {
    CALENDAR_BASE_URL,
    CALENDAR_VIEWS,
    DEFAULT_VIEW,
    GOOGLE_ACCOUNTS_URL,
    DEFAULT_WINDOW_BOUNDS,
    detectViewFromUrl
};
