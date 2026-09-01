const { app, BrowserWindow, ipcMain, shell, Menu, powerMonitor } = require('electron');
const path = require('path');
const { getIconPath } = require('./utils/paths');
const { windowStateKeeper } = require('./services/windowState');
const { authService } = require('./services/authService');
const { calendarService } = require('./services/calendarService');
const { createTray } = require('./services/trayManager');
const { logger } = require('./utils/logger');
const { detectActiveSemesterCalendar, calculateWeekNumber, generateWeekSchedule, formatLocalDate, SEMESTER_TOTAL_WEEKS } = require('./services/academicService');
const { getSemesterStartDate, saveSemesterStartDate, getSemesterTotalWeeks, saveSemesterTotalWeeks } = require('./services/preferences');



// Lightweight Chromium & V8 Memory Optimizations for Ambient Desktop Widget
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=32 --lite-mode --expose-gc');
app.commandLine.appendSwitch('disable-speech-api');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-print-preview');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,SpareRendererForSitePerProcess,MediaRouter,OptimizationHints,Translate');

// Global crash handlers
process.on('uncaughtException', (err) => {
    logger.logFatalCrash(err, 'UncaughtException');
});

process.on('unhandledRejection', (reason) => {
    logger.logFatalCrash(reason, 'UnhandledRejection');
});

let mainWindow = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    logger.warn('App', 'Second instance blocked by single-instance lock. Quitting.');
    app.quit();
} else {
    app.on('second-instance', () => {
        logger.info('App', 'Second instance detected, focusing main window.');
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function registerIpcHandlers() {
    // Auto-launch at Windows Startup
    ipcMain.handle('system:get-auto-launch', () => {
        try {
            return app.getLoginItemSettings().openAtLogin;
        } catch {
            return false;
        }
    });

    ipcMain.handle('system:set-auto-launch', (_event, enable) => {
        try {
            app.setLoginItemSettings({
                openAtLogin: Boolean(enable),
                path: process.execPath,
                args: ['--hidden']
            });
            logger.info('System', `Auto-launch on startup set to: ${enable}`);
            return true;
        } catch (err) {
            logger.error('System', 'Failed to update auto-launch setting:', err);
            return false;
        }
    });
    // Auth Handlers
    ipcMain.handle('auth:status', () => {
        return {
            authenticated: authService.isAuthenticated(),
            hasCredentials: authService.hasCredentials()
        };
    });

    ipcMain.handle('auth:login', async () => {
        logger.info('Auth', 'OAuth login requested from UI');
        try {
            const tokens = await authService.loginWithBrowser();
            return { success: true, tokens };
        } catch (err) {
            logger.error('Auth', 'OAuth login failed:', err);
            return { success: false, error: err.message || 'Gagal login ke Google Calendar' };
        }
    });

    ipcMain.handle('auth:logout', () => {
        logger.info('Auth', 'Logout requested from UI');
        calendarService.clearCache();
        return authService.logout();
    });

    // Logging & Diagnostics
    ipcMain.on('system:open-logs', () => {
        logger.openLogsFolder();
    });

    ipcMain.on('system:open-credentials-folder', () => {
        const dir = authService.getCredentialsDirectory();
        shell.openPath(dir);
    });

    ipcMain.on('logger:log', (_event, { level, context, message, meta }) => {
        logger.write(level || 'INFO', context || 'Renderer', message, meta);
    });

    // Calendar Handlers
    ipcMain.handle('calendar:get-events', async (_event, options) => {
        return await calendarService.getUpcomingEvents(options);
    });

    ipcMain.handle('calendar:refresh-events', async () => {
        return await calendarService.getUpcomingEvents();
    });

    ipcMain.handle('calendar:get-calendar-list', async () => {
        return await calendarService.getCalendarList();
    });

    ipcMain.handle('calendar:set-selected-calendars', async (_event, ids) => {
        calendarService.setSelectedCalendarIds(ids);
        const res = await calendarService.getUpcomingEvents();
        return res;
    });

    ipcMain.handle('calendar:create-event', async (_event, data) => {
        if (!data || typeof data !== 'object') throw new Error('Invalid event payload');
        return await calendarService.createQuickEvent(data);
    });

    ipcMain.handle('calendar:update-event', async (_event, data) => {
        if (!data || typeof data !== 'object' || !data.eventId) {
            throw new Error('Invalid update event payload: eventId is required');
        }
        return await calendarService.updateEvent(data);
    });

    ipcMain.handle('calendar:delete-event', async (_event, data) => {
        if (!data || !data.eventId) throw new Error('Invalid delete payload: eventId is required');
        return await calendarService.deleteEvent(data);
    });

    ipcMain.handle('calendar:get-events-for-range', async (_event, rangeOptions) => {
        return await calendarService.getEventsForRange(rangeOptions || {});
    });

    // Window Controls
    ipcMain.on('window:close', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.hide(); // Hide to tray instead of quitting
        }
    });

    ipcMain.on('window:minimize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });

    ipcMain.handle('window:toggle-pin', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const next = !mainWindow.isAlwaysOnTop();
            mainWindow.setAlwaysOnTop(next, 'floating');
            return next;
        }
        return false;
    });

    ipcMain.handle('window:is-pinned', () => {
        return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isAlwaysOnTop() : false;
    });

    ipcMain.on('window:resize', (_event, { x, y, width, height }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const currentBounds = mainWindow.getBounds();
            const newWidth = Math.max(300, Math.min(1200, Math.round(width || currentBounds.width)));
            const newHeight = Math.max(400, Math.min(1400, Math.round(height || currentBounds.height)));
            const newX = typeof x === 'number' ? Math.round(x) : currentBounds.x;
            const newY = typeof y === 'number' ? Math.round(y) : currentBounds.y;
            mainWindow.setBounds({
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            });
        }
    });

    // Helper for safely opening external URLs with strict protocol validation
    function safeOpenExternal(targetUrl) {
        if (!targetUrl || typeof targetUrl !== 'string') return;
        try {
            const parsed = new URL(targetUrl);
            if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                shell.openExternal(parsed.href);
            } else {
                logger.warn('Security', `Blocked external link with unsafe protocol: ${parsed.protocol}`);
            }
        } catch (e) {
            logger.warn('Security', `Blocked invalid external URL: ${targetUrl}`);
        }
    }

    // Academic (Semester Week) Handlers
    // Cache: avoid extra API calls on every tab switch
    let _academicCache = null;
    let _academicCacheTs = 0;
    const ACADEMIC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

    ipcMain.handle('academic:get-week-info', async () => {
        const now = Date.now();
        if (_academicCache && (now - _academicCacheTs) < ACADEMIC_CACHE_TTL_MS) {
            return _academicCache;
        }

        try {
            // 1. Load calendar list to detect active semester calendar
            const { calendars, selectedIds } = await calendarService.getCalendarList();
            const detected = detectActiveSemesterCalendar(calendars, selectedIds);

            // 2. Determine semester start date (manual override > auto-detect)
            let startDateStr = getSemesterStartDate() || null;
            let startDateSource = 'manual';

            if (!startDateStr && detected.calendar) {
                // Auto-detect: fetch events from active semester calendar,
                // use the earliest event's start date as Week 1
                try {
                    const { calendar: getCalendarClient } = require('googleapis/build/src/apis/calendar');
                    const auth = await authService.getAuthenticatedClient();
                    const gcal = getCalendarClient({ version: 'v3', auth });

                    const res = await gcal.events.list({
                        calendarId: detected.calendar.id,
                        maxResults: 1,
                        singleEvents: true,
                        orderBy: 'startTime',
                        timeMin: new Date(new Date().getFullYear() - 1, 0, 1).toISOString()
                    });

                    const items = res.data.items || [];
                    if (items.length > 0) {
                        const firstEvent = items[0];
                        let rawStart = null;
                        if (firstEvent.start) {
                            if (firstEvent.start.date) {
                                rawStart = firstEvent.start.date;
                            } else if (firstEvent.start.dateTime) {
                                const d = new Date(firstEvent.start.dateTime);
                                if (!isNaN(d.getTime())) {
                                    rawStart = formatLocalDate(d);
                                }
                            }
                        }
                        if (rawStart) {
                            startDateStr = rawStart;
                            startDateSource = 'auto';
                        }
                    }
                } catch (fetchErr) {
                    logger.warn('Academic', `Auto-detect event fetch failed: ${fetchErr.message}`);
                }

            }

            const savedTotalWeeks = getSemesterTotalWeeks();
            const totalWeeks = (typeof savedTotalWeeks === 'number' && savedTotalWeeks > 0)
                ? savedTotalWeeks
                : SEMESTER_TOTAL_WEEKS;

            const weekNumber = startDateStr ? calculateWeekNumber(startDateStr) : null;
            const schedule = startDateStr ? generateWeekSchedule(startDateStr, totalWeeks) : [];

            _academicCache = {
                detected: {
                    calendarId: detected.calendar ? detected.calendar.id : null,
                    calendarName: detected.calendar ? detected.calendar.summary : null,
                    semesterNumber: detected.semesterNumber,
                    academicYear: detected.academicYear
                },
                startDateStr,
                startDateSource,
                weekNumber,
                totalWeeks,
                schedule: schedule.map(w => ({
                    weekNum: w.weekNum,
                    startDate: w.startDateStr || formatLocalDate(w.startDate),
                    endDate: w.endDateStr || formatLocalDate(w.endDate),
                    isCurrent: w.isCurrent,
                    isPast: w.isPast
                }))
            };
            _academicCacheTs = now;

            logger.info('Academic', `Week info: Sem ${detected.semesterNumber || '?'}, Week ${weekNumber || '?'}, totalWeeks=${totalWeeks}, source=${startDateSource}`);
            return _academicCache;
        } catch (err) {
            logger.error('Academic', `get-week-info error: ${err.message}`);
            const savedTotalWeeks = getSemesterTotalWeeks();
            const fallbackWeeks = (typeof savedTotalWeeks === 'number' && savedTotalWeeks > 0) ? savedTotalWeeks : SEMESTER_TOTAL_WEEKS;
            return { detected: null, startDateStr: null, weekNumber: null, totalWeeks: fallbackWeeks, schedule: [], error: err.message };
        }
    });

    ipcMain.handle('academic:save-semester-start', async (_event, dateStr) => {
        // Accept null (clear override) or valid YYYY-MM-DD
        if (dateStr !== null && (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr))) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD or null.');
        }
        saveSemesterStartDate(dateStr);
        // Invalidate cache so next fetch uses updated preference
        _academicCache = null;
        _academicCacheTs = 0;
        logger.info('Academic', `Manual semester start date set to: ${dateStr}`);
        return { success: true, semesterStartDate: dateStr };
    });

    ipcMain.handle('academic:save-semester-total-weeks', async (_event, weeks) => {
        // Accept null (clear override) or valid integer 1..30
        if (weeks !== null) {
            const parsed = Number(weeks);
            if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
                throw new Error('Invalid total weeks. Expected an integer between 1 and 30, or null.');
            }
            saveSemesterTotalWeeks(parsed);
        } else {
            saveSemesterTotalWeeks(null);
        }
        // Invalidate cache so next fetch uses updated preference
        _academicCache = null;
        _academicCacheTs = 0;
        logger.info('Academic', `Semester total weeks set to: ${weeks}`);
        return { success: true, semesterTotalWeeks: weeks };
    });


    // System Actions
    ipcMain.on('system:open-external', (_event, url) => {
        safeOpenExternal(url);
    });
}


const BASE_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SYNC_INTERVAL_MS = 30 * 60 * 1000;  // 30 minutes max backoff
let currentSyncIntervalMs = BASE_SYNC_INTERVAL_MS;
let autoSyncTimerId = null;

function scheduleNextSync(delayMs) {
    if (autoSyncTimerId) clearTimeout(autoSyncTimerId);
    autoSyncTimerId = setTimeout(async () => {
        if (mainWindow && !mainWindow.isDestroyed() && authService.isAuthenticated()) {
            try {
                const res = await calendarService.getUpcomingEvents();
                if (res && res.error) {
                    // Backoff on network or API failure
                    currentSyncIntervalMs = Math.min(Math.round(currentSyncIntervalMs * 1.5), MAX_SYNC_INTERVAL_MS);
                    console.warn(`[AutoSync] Temporary error, backing off next sync to ${Math.round(currentSyncIntervalMs / 60000)}m`);
                } else {
                    // Reset to base interval on success
                    currentSyncIntervalMs = BASE_SYNC_INTERVAL_MS;
                }
                mainWindow.webContents.send('calendar:events-updated', res);
            } catch (err) {
                currentSyncIntervalMs = Math.min(Math.round(currentSyncIntervalMs * 1.5), MAX_SYNC_INTERVAL_MS);
                console.warn('[AutoSync] Background sync error:', err.message);
            }
        }
        scheduleNextSync(currentSyncIntervalMs);
    }, delayMs);
}

function startAutoSync() {
    scheduleNextSync(BASE_SYNC_INTERVAL_MS);
}

async function createMainWindow() {
    let bounds = { width: 360, height: 580, x: undefined, y: undefined };
    let trackFunction = null;

    try {
        const state = await windowStateKeeper('main');
        if (state) {
            bounds = state;
            trackFunction = state.track;
        }
    } catch (e) {
        console.warn('[App] Warning loading window state:', e.message);
    }

    mainWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width || 360,
        height: bounds.height || 580,
        minWidth: 300,
        minHeight: 400,
        maxWidth: 1200,
        maxHeight: 1400,
        resizable: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        hasShadow: false, // Prevents Windows DWM sharp rectangular shadow on rounded transparent window
        icon: getIconPath(),
        skipTaskbar: true, // Rainmeter style: ambient on desktop, lives in system tray
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            webviewTag: false,
            allowRunningInsecureContent: false,
            spellcheck: false,
            backgroundThrottling: true
        }
    });

    if (trackFunction) {
        trackFunction(mainWindow);
    }

    // Strip default menubar
    Menu.setApplicationMenu(null);
    mainWindow.setMenu(null);

    // Navigation and external link security guards
    mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
        try {
            const parsed = new URL(targetUrl);
            if (parsed.protocol !== 'file:') {
                event.preventDefault();
                safeOpenExternal(targetUrl);
            }
        } catch {
            event.preventDefault();
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
        safeOpenExternal(targetUrl);
        return { action: 'deny' };
    });

    // Disable DevTools shortcuts in production
    if (app.isPackaged) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
                event.preventDefault();
            }
        });
    }

    const widgetHtmlPath = path.join(__dirname, 'renderer', 'widget.html');
    mainWindow.loadFile(widgetHtmlPath);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        setTimeout(() => {
            if (typeof global.gc === 'function') {
                try { global.gc(); } catch {}
            }
        }, 1500);
    });

    // Immediate memory trim when window is hidden to system tray
    mainWindow.on('hide', () => {
        if (typeof global.gc === 'function') {
            try { global.gc(); } catch {}
        }
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[App] Failed to load widget HTML:', errorCode, errorDescription);
    });

    // Open DevTools only if explicitly debugged
    if (process.env.DEBUG === 'true') {
        mainWindow.webContents.openDevTools({ mode: 'undocked' });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createTray(mainWindow);
    startAutoSync();
}

function initApp() {
    registerIpcHandlers();

    // OS Power Management: pause sync on sleep, resume immediately on wake
    if (powerMonitor) {
        powerMonitor.on('suspend', () => {
            logger.info('Power', 'System suspended/sleeping — pausing background auto-sync');
            if (autoSyncTimerId) {
                clearTimeout(autoSyncTimerId);
                autoSyncTimerId = null;
            }
        });

        powerMonitor.on('resume', () => {
            logger.info('Power', 'System resumed/woke — triggering immediate sync');
            scheduleNextSync(3000);
        });

        powerMonitor.on('unlock-screen', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('calendar:events-updated', {});
            }
        });
    }

    app.whenReady().then(async () => {
        await createMainWindow();

        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                await createMainWindow();
            }
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('before-quit', () => {
        if (autoSyncTimerId) clearTimeout(autoSyncTimerId);
    });
}

module.exports = {
    initApp
};
