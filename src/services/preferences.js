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

module.exports = {
    getPreferencesPath,
    saveLastView,
    getLastView
};
