const path = require('path');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { CALENDAR_VIEWS, DEFAULT_VIEW } = require('../config/constants');

/**
 * Get user preferences file path
 * @param {string} [customUserDataPath] Optional custom user data path (for tests)
 * @returns {string}
 */
const getPreferencesPath = (customUserDataPath) => {
    let userDataPath = customUserDataPath;
    if (!userDataPath) {
        try {
            const { app } = require('electron');
            userDataPath = app.getPath('userData');
        } catch {
            userDataPath = process.cwd();
        }
    }
    return path.join(userDataPath, 'preferences.json');
};

/**
 * Save the last selected calendar view
 * @param {string} view 
 * @param {string} [customUserDataPath] 
 */
const saveLastView = (view, customUserDataPath) => {
    if (!view || !CALENDAR_VIEWS[view]) {
        return;
    }

    try {
        const prefsPath = getPreferencesPath(customUserDataPath);
        const prefsDir = path.dirname(prefsPath);

        if (!existsSync(prefsDir)) {
            mkdirSync(prefsDir, { recursive: true });
        }

        let preferences = {};
        if (existsSync(prefsPath)) {
            try {
                const prefsContent = readFileSync(prefsPath, 'utf8');
                preferences = JSON.parse(prefsContent) || {};

                if (preferences.lastView === view) {
                    return; // View unchanged, skip disk write
                }
            } catch (error) {
                console.warn(`[Preferences] Warning parsing existing preferences:`, error.message);
                preferences = {};
            }
        }

        preferences.lastView = view;
        writeFileSync(prefsPath, JSON.stringify(preferences, null, 2), 'utf8');
        console.log(`[Preferences] Saved last view: ${view}`);
    } catch (error) {
        console.error(`[Preferences] Error saving last view:`, error.message);
    }
};

/**
 * Load the last selected calendar view
 * @param {string} [customUserDataPath] 
 * @returns {string} View name (e.g. 'AGENDA')
 */
const getLastView = (customUserDataPath) => {
    try {
        const prefsPath = getPreferencesPath(customUserDataPath);

        if (existsSync(prefsPath)) {
            const prefsContent = readFileSync(prefsPath, 'utf8');
            const preferences = JSON.parse(prefsContent);
            if (preferences && preferences.lastView && CALENDAR_VIEWS[preferences.lastView]) {
                return preferences.lastView;
            }
        }
    } catch (error) {
        console.warn(`[Preferences] Error loading last view, falling back to default:`, error.message);
    }

    return DEFAULT_VIEW;
};

/**
 * Save a manual semester start date override.
 * Store as "YYYY-MM-DD" string. Pass null to clear the override.
 * @param {string|null} dateStr  e.g. "2026-09-01", or null to remove
 * @param {string} [customUserDataPath]
 */
const saveSemesterStartDate = (dateStr, customUserDataPath) => {
    // Validate format when a value is provided
    if (dateStr !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return;
    }

    try {
        const prefsPath = getPreferencesPath(customUserDataPath);
        const prefsDir = path.dirname(prefsPath);

        if (!existsSync(prefsDir)) {
            mkdirSync(prefsDir, { recursive: true });
        }

        let preferences = {};
        if (existsSync(prefsPath)) {
            try {
                const prefsContent = readFileSync(prefsPath, 'utf8');
                preferences = JSON.parse(prefsContent) || {};

                if (preferences.semesterStartDate === dateStr) {
                    return; // Value unchanged, skip disk write
                }
            } catch (error) {
                console.warn(`[Preferences] Warning parsing existing preferences:`, error.message);
                preferences = {};
            }
        }

        if (dateStr === null) {
            delete preferences.semesterStartDate;
        } else {
            preferences.semesterStartDate = dateStr;
        }

        writeFileSync(prefsPath, JSON.stringify(preferences, null, 2), 'utf8');
        console.log(`[Preferences] Saved semesterStartDate: ${dateStr}`);
    } catch (error) {
        console.error(`[Preferences] Error saving semesterStartDate:`, error.message);
    }
};

/**
 * Load the manual semester start date override.
 * Returns null if not set, allowing auto-detect to take over.
 * @param {string} [customUserDataPath]
 * @returns {string|null} "YYYY-MM-DD" or null
 */
const getSemesterStartDate = (customUserDataPath) => {
    try {
        const prefsPath = getPreferencesPath(customUserDataPath);

        if (existsSync(prefsPath)) {
            const prefsContent = readFileSync(prefsPath, 'utf8');
            const preferences = JSON.parse(prefsContent);
            const val = preferences && preferences.semesterStartDate;
            if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                return val;
            }
        }
    } catch (error) {
        console.warn(`[Preferences] Error loading semesterStartDate:`, error.message);
    }

    return null; // Null means: use auto-detect
};

/**
 * Save a manual semester total weeks override.
 * Store as integer (e.g., 17). Pass null to clear the override (reverting to default 16).
 * @param {number|null} weeks
 * @param {string} [customUserDataPath]
 */
const saveSemesterTotalWeeks = (weeks, customUserDataPath) => {
    if (weeks !== null) {
        const parsed = Number(weeks);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
            return;
        }
        weeks = parsed;
    }

    try {
        const prefsPath = getPreferencesPath(customUserDataPath);
        const prefsDir = path.dirname(prefsPath);

        if (!existsSync(prefsDir)) {
            mkdirSync(prefsDir, { recursive: true });
        }

        let preferences = {};
        if (existsSync(prefsPath)) {
            try {
                const prefsContent = readFileSync(prefsPath, 'utf8');
                preferences = JSON.parse(prefsContent) || {};

                if (preferences.semesterTotalWeeks === weeks) {
                    return; // Value unchanged
                }
            } catch (error) {
                console.warn(`[Preferences] Warning parsing existing preferences:`, error.message);
                preferences = {};
            }
        }

        if (weeks === null) {
            delete preferences.semesterTotalWeeks;
        } else {
            preferences.semesterTotalWeeks = weeks;
        }

        writeFileSync(prefsPath, JSON.stringify(preferences, null, 2), 'utf8');
        console.log(`[Preferences] Saved semesterTotalWeeks: ${weeks}`);
    } catch (error) {
        console.error(`[Preferences] Error saving semesterTotalWeeks:`, error.message);
    }
};

/**
 * Load the manual semester total weeks override.
 * Returns null if not set, allowing default (16) to take over.
 * @param {string} [customUserDataPath]
 * @returns {number|null}
 */
const getSemesterTotalWeeks = (customUserDataPath) => {
    try {
        const prefsPath = getPreferencesPath(customUserDataPath);

        if (existsSync(prefsPath)) {
            const prefsContent = readFileSync(prefsPath, 'utf8');
            const preferences = JSON.parse(prefsContent);
            const val = preferences && preferences.semesterTotalWeeks;
            if (typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 30) {
                return val;
            }
        }
    } catch (error) {
        console.warn(`[Preferences] Error loading semesterTotalWeeks:`, error.message);
    }

    return null;
};

module.exports = {
    getPreferencesPath,
    saveLastView,
    getLastView,
    saveSemesterStartDate,
    getSemesterStartDate,
    saveSemesterTotalWeeks,
    getSemesterTotalWeeks
};


