/**
 * Date helper utilities for formatting calendar dates, times, and countdowns
 */

/**
 * Formats time to 24h or 12h string (e.g. 09:30 or 09:30 - 10:30)
 * @param {string|Date} startIso 
 * @param {string|Date} [endIso] 
 * @param {boolean} [isAllDay] 
 * @returns {string}
 */
const formatEventTime = (startIso, endIso, isAllDay = false) => {
    if (isAllDay) {
        return 'Sepanjang Hari';
    }

    const startDate = new Date(startIso);
    const startStr = startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (!endIso) {
        return startStr;
    }

    const endDate = new Date(endIso);
    const endStr = endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${startStr} - ${endStr}`;
};

/**
 * Returns human-readable relative day header (Hari Ini, Besok, Lusa, or formatted date)
 * @param {string|Date} dateInput 
 * @returns {string}
 */
const getDayHeader = (dateInput) => {
    const target = new Date(dateInput);
    const today = new Date();
    
    // Normalize to date only
    const dTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffDays = Math.round((dTarget - dToday) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari Ini';
    if (diffDays === 1) return 'Besok';
    if (diffDays === 2) return 'Lusa';

    const dayName = target.toLocaleDateString('id-ID', { weekday: 'long' });
    const formatted = target.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    return `${dayName}, ${formatted}`;
};

/**
 * Calculate countdown string to next upcoming event
 * @param {string|Date} startIso 
 * @returns {{ text: string, isNow: boolean }}
 */
const getEventCountdown = (startIso) => {
    const now = Date.now();
    const start = new Date(startIso).getTime();
    const diffMs = start - now;

    if (diffMs <= 0) {
        return { text: 'Sedang Berlangsung', isNow: true };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return { text: `${diffDays} hari lagi`, isNow: false };
    }
    if (diffHours > 0) {
        const remainingMinutes = diffMinutes % 60;
        return { text: remainingMinutes > 0 ? `${diffHours}j ${remainingMinutes}m lagi` : `${diffHours} jam lagi`, isNow: false };
    }
    if (diffMinutes > 0) {
        return { text: `${diffMinutes} menit lagi`, isNow: false };
    }

    return { text: 'Kurang dari 1 menit lagi', isNow: true };
};

module.exports = {
    formatEventTime,
    getDayHeader,
    getEventCountdown
};
