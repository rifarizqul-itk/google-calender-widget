/**
 * Date helper utilities for formatting calendar dates, times, and countdowns
 */

/**
 * Formats time to 24h or 12h string (e.g. 09:30 or 09:30 - 10:30)
 * @param {string|Date} startIso 
 * @param {string|Date} [endIso] 
 * @param {boolean} [isAllDay] 
 * @param {string} [locale] 'id' or 'en'
 * @returns {string}
 */
const formatEventTime = (startIso, endIso, isAllDay = false, locale = 'id') => {
    if (isAllDay) {
        return locale === 'en' ? 'All Day' : 'Sepanjang Hari';
    }

    const loc = locale === 'en' ? 'en-US' : 'id-ID';
    const startDate = new Date(startIso);
    const startStr = startDate.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', hour12: false });

    if (!endIso) {
        return startStr;
    }

    const endDate = new Date(endIso);
    const endStr = endDate.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${startStr} - ${endStr}`;
};

/**
 * Returns human-readable relative day header (Hari Ini, Besok, Lusa, or formatted date)
 * @param {string|Date} dateInput 
 * @param {string} [locale] 'id' or 'en'
 * @returns {string}
 */
const getDayHeader = (dateInput, locale = 'id') => {
    const target = new Date(dateInput);
    const today = new Date();
    
    // Normalize to date only
    const dTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffDays = Math.round((dTarget - dToday) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return locale === 'en' ? 'Today' : 'Hari Ini';
    if (diffDays === 1) return locale === 'en' ? 'Tomorrow' : 'Besok';
    if (diffDays === 2) return locale === 'en' ? 'In 2 days' : 'Lusa';

    const loc = locale === 'en' ? 'en-US' : 'id-ID';
    const dayName = target.toLocaleDateString(loc, { weekday: 'long' });
    const formatted = target.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
    return `${dayName}, ${formatted}`;
};

/**
 * Calculate countdown string to next upcoming event
 * @param {string|Date} startIso 
 * @param {string} [locale] 'id' or 'en'
 * @returns {{ text: string, isNow: boolean }}
 */
const getEventCountdown = (startIso, locale = 'id') => {
    const now = Date.now();
    const start = new Date(startIso).getTime();
    const diffMs = start - now;

    if (diffMs <= 0) {
        return { text: locale === 'en' ? 'In Progress' : 'Sedang Berlangsung', isNow: true };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return { text: locale === 'en' ? `in ${diffDays}d` : `${diffDays} hari lagi`, isNow: false };
    }
    if (diffHours > 0) {
        const remainingMinutes = diffMinutes % 60;
        if (locale === 'en') {
            return { text: remainingMinutes > 0 ? `in ${diffHours}h ${remainingMinutes}m` : `in ${diffHours}h`, isNow: false };
        }
        return { text: remainingMinutes > 0 ? `${diffHours}j ${remainingMinutes}m lagi` : `${diffHours} jam lagi`, isNow: false };
    }
    if (diffMinutes > 0) {
        return { text: locale === 'en' ? `in ${diffMinutes}m` : `${diffMinutes} menit lagi`, isNow: false };
    }

    return { text: locale === 'en' ? 'in less than a minute' : 'Kurang dari 1 menit lagi', isNow: true };
};

module.exports = {
    formatEventTime,
    getDayHeader,
    getEventCountdown
};
