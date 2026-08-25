const { app } = require('electron');
const path = require('path');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { debounce } = require('../utils/debounce');

/**
 * Get path to window state json file
 */
const getWindowStateFilePath = () => {
    try {
        const userData = app ? app.getPath('userData') : process.cwd();
        if (!existsSync(userData)) {
            mkdirSync(userData, { recursive: true });
        }
        return path.join(userData, 'windowState.json');
    } catch {
        return path.join(process.cwd(), 'windowState.json');
    }
};

/**
 * Read all window states from disk
 */
const readAllStates = () => {
    try {
        const filePath = getWindowStateFilePath();
        if (existsSync(filePath)) {
            const raw = readFileSync(filePath, 'utf8');
            return JSON.parse(raw) || {};
        }
    } catch (e) {
        console.warn('[WindowState] Error reading state file:', e.message);
    }
    return {};
};

/**
 * Write all window states to disk
 */
const writeAllStates = (states) => {
    try {
        const filePath = getWindowStateFilePath();
        writeFileSync(filePath, JSON.stringify(states, null, 2), 'utf8');
    } catch (e) {
        console.warn('[WindowState] Error writing state file:', e.message);
    }
};

/**
 * Manages saving and restoring window size and position with debouncing
 * @param {string} windowName 
 * @returns {Promise<{ x: number|undefined, y: number|undefined, width: number, height: number, isMaximized: boolean, track: Function }>}
 */
const windowStateKeeper = async (windowName = 'main') => {
    let windowInstance = null;
    let windowState = {
        x: undefined,
        y: undefined,
        height: 600,
        width: 400,
        isMaximized: false
    };

    const stateKey = `windowState.${windowName}`;

    const loadBounds = () => {
        try {
            const allStates = readAllStates();
            if (allStates && allStates[stateKey] && typeof allStates[stateKey] === 'object') {
                windowState = { ...windowState, ...allStates[stateKey] };
            }
        } catch (error) {
            console.warn(`[WindowState] Error restoring state for ${windowName}:`, error.message);
        }
    };

    const saveStateImmediate = () => {
        if (!windowInstance || windowInstance.isDestroyed()) {
            return;
        }

        try {
            const isMaximized = windowInstance.isMaximized();
            if (!isMaximized) {
                const bounds = windowInstance.getBounds();
                windowState = {
                    ...windowState,
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    isMaximized: false
                };
            } else {
                windowState.isMaximized = true;
            }

            const allStates = readAllStates();
            allStates[stateKey] = windowState;
            writeAllStates(allStates);
        } catch (error) {
            console.warn(`[WindowState] Error saving state for ${windowName}:`, error.message);
        }
    };

    // Debounce saveState to prevent disk hammering during resize/move
    const debouncedSaveState = debounce(saveStateImmediate, 250);

    const track = (win) => {
        windowInstance = win;

        win.on('resize', debouncedSaveState);
        win.on('move', debouncedSaveState);
        win.on('close', () => {
            debouncedSaveState.cancel();
            saveStateImmediate();
        });
    };

    loadBounds();

    return {
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
        isMaximized: windowState.isMaximized,
        track
    };
};

module.exports = { windowStateKeeper };
