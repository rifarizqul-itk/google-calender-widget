/**
 * Academic Service — Semester Week Tracker
 *
 * Pure functions only. No I/O, no direct API calls.
 * Calendar fetching stays in calendarService.js; this module
 * only receives parsed data and returns computed results.
 */

'use strict';

/**
 * Regex that matches calendar names like:
 *   "SEMESTER 5 - 2026/2027"
 *   "SEMESTER 3 – 2024/2025"  (en-dash)
 *   "semester 7 - 2027"       (case-insensitive)
 *
 * Capture groups:
 *   [1] semester number (string of digits)
 *   [2] academic year label (everything after the dash)
 */
const SEMESTER_CALENDAR_PATTERN = /^SEMESTER\s+(\d+)\s*[-–]\s*(.+)$/i;

/**
 * Default total weeks per semester (easily configurable, never hardcoded).
 * Change this constant to adjust the displayed schedule length.
 */
const SEMESTER_TOTAL_WEEKS = 16;

/**
 * Detect the active semester calendar from a list of calendars.
 *
 * "Active" means: the calendar name matches SEMESTER_CALENDAR_PATTERN
 * AND the calendar is currently visible/selected by the user.
 *
 * If multiple matching calendars are all visible (edge case: during
 * semester transition), the one with the highest semester number wins.
 *
 * @param {Array<{ id: string, summary: string, selected: boolean }>} allCalendars
 *   Full calendar list from calendarService.getCalendarList().calendars
 * @param {string[]|null} selectedCalendarIds
 *   IDs of calendars currently checked in the filter modal.
 *   If null -> use the calendar's own `selected` flag (all-checked default).
 * @returns {{
 *   calendar: Object|null,
 *   semesterNumber: number|null,
 *   academicYear: string|null
 * }}
 */
function detectActiveSemesterCalendar(allCalendars, selectedCalendarIds) {
    if (!Array.isArray(allCalendars) || allCalendars.length === 0) {
        return { calendar: null, semesterNumber: null, academicYear: null };
    }

    const candidates = [];

    for (const cal of allCalendars) {
        const name = (cal.summary || '').trim();
        const match = name.match(SEMESTER_CALENDAR_PATTERN);
        if (!match) continue;

        // Determine if this calendar is visible/active
        const isVisible = selectedCalendarIds !== null
            ? selectedCalendarIds.includes(cal.id)
            : cal.selected !== false;

        if (!isVisible) continue;

        candidates.push({
            calendar: cal,
            semesterNumber: parseInt(match[1], 10),
            academicYear: match[2].trim()
        });
    }

    if (candidates.length === 0) {
        return { calendar: null, semesterNumber: null, academicYear: null };
    }

    // If multiple active semester calendars exist (transition period),
    // pick the one with the highest semester number (most recent).
    candidates.sort((a, b) => b.semesterNumber - a.semesterNumber);

    const winner = candidates[0];
    return {
        calendar: winner.calendar,
        semesterNumber: winner.semesterNumber,
        academicYear: winner.academicYear
    };
}

/**
 * Calculate which week number "today" falls into, relative to a semester
 * start date. Week 1 starts on startDate itself (no Monday normalization).
 *
 * Returns:
 *   null  -- if startDateStr is missing/invalid
 *   0     -- if today is before the semester start (semester not yet begun)
 *   1..N  -- week number (can exceed SEMESTER_TOTAL_WEEKS after semester ends)
 *
 * @param {string} startDateStr  ISO date string, e.g. "2026-09-01"
 * @param {Date}  [referenceDate] Defaults to today. Injectable for testing.
 * @returns {number|null}
 */
function calculateWeekNumber(startDateStr, referenceDate) {
    if (!startDateStr || typeof startDateStr !== 'string') return null;

    const start = _parseDateLocal(startDateStr);
    if (!start || isNaN(start.getTime())) return null;

    const today = referenceDate instanceof Date && !isNaN(referenceDate.getTime())
        ? referenceDate
        : new Date();

    // Strip time components: compare calendar dates only
    const startDay = _stripTime(start);
    const todayDay = _stripTime(today);

    const diffMs = todayDay.getTime() - startDay.getTime();
    if (diffMs < 0) return 0; // Semester hasn't started yet

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
}

/**
 * Generate the full week schedule for a semester.
 * Each entry covers 7 calendar days starting from the semester start date.
 *
 * @param {string} startDateStr  ISO date string for the first day of Week 1
 * @param {number} [totalWeeks]  Defaults to SEMESTER_TOTAL_WEEKS (16)
 * @param {Date}   [referenceDate] Defaults to today. Injectable for testing.
 * @returns {Array<{
 *   weekNum: number,
 *   startDate: Date,
 *   endDate: Date,
 *   isCurrent: boolean,
 *   isPast: boolean
 * }>}  Empty array if startDateStr is invalid.
 */
function generateWeekSchedule(startDateStr, totalWeeks, referenceDate) {
    const weeks = typeof totalWeeks === 'number' && totalWeeks > 0
        ? totalWeeks
        : SEMESTER_TOTAL_WEEKS;

    if (!startDateStr || typeof startDateStr !== 'string') return [];

    const start = _parseDateLocal(startDateStr);
    if (!start || isNaN(start.getTime())) return [];

    const today = referenceDate instanceof Date && !isNaN(referenceDate.getTime())
        ? referenceDate
        : new Date();
    const todayDay = _stripTime(today);
    const currentWeek = calculateWeekNumber(startDateStr, today);

    const schedule = [];

    for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7);
        const weekEnd   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7 + 6);

        const isPast = todayDay.getTime() > weekEnd.getTime();
        const isCurrent = currentWeek !== null && currentWeek > 0 && (i + 1) === currentWeek;

        schedule.push({
            weekNum: i + 1,
            startDate: weekStart,
            endDate: weekEnd,
            startDateStr: formatLocalDate(weekStart),
            endDateStr: formatLocalDate(weekEnd),
            isCurrent,
            isPast
        });
    }

    return schedule;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date object as a local "YYYY-MM-DD" string without UTC offset conversion.
 * @param {Date} date
 * @returns {string}
 */
function formatLocalDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Parse a "YYYY-MM-DD" date string as a local date (not UTC).
 * Avoids the midnight UTC-off-by-one problem of `new Date("2026-09-01")`.
 * @param {string} str
 * @returns {Date|null}
 */
function _parseDateLocal(str) {
    const parts = str.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d); // local time, midnight
}

/**
 * Return a new Date with hours/minutes/seconds/ms zeroed (local time).
 * @param {Date} date
 * @returns {Date}
 */
function _stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

module.exports = {
    SEMESTER_CALENDAR_PATTERN,
    SEMESTER_TOTAL_WEEKS,
    detectActiveSemesterCalendar,
    calculateWeekNumber,
    generateWeekSchedule,
    formatLocalDate
};

