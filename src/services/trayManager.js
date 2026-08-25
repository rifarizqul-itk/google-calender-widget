const { Tray, Menu, nativeImage, shell, app } = require('electron');
const { getIconPath } = require('../utils/paths');
const { authService } = require('./authService');
const { calendarService } = require('./calendarService');

let trayInstance = null;
let currentMainWindow = null;

/**
 * Create or update system tray icon and menu for the native widget
 * @param {import('electron').BrowserWindow} mainWindow 
 * @returns {import('electron').Tray}
 */
const createTray = (mainWindow) => {
    currentMainWindow = mainWindow;

    const buildContextMenu = () => {
        const isAlwaysOnTop = currentMainWindow && !currentMainWindow.isDestroyed() ? currentMainWindow.isAlwaysOnTop() : false;
        const isAuth = authService.isAuthenticated();

        return Menu.buildFromTemplate([
            {
                label: 'Google Calendar Widget',
                enabled: false
            },
            { type: 'separator' },
            {
                label: 'Mode: Menempel di Desktop (Rainmeter)',
                type: 'radio',
                checked: !isAlwaysOnTop,
                click: () => {
                    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                        currentMainWindow.setAlwaysOnTop(false);
                        if (trayInstance) trayInstance.setContextMenu(buildContextMenu());
                    }
                }
            },
            {
                label: 'Mode: Melayang di Atas (Always on Top)',
                type: 'radio',
                checked: isAlwaysOnTop,
                click: () => {
                    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                        currentMainWindow.setAlwaysOnTop(true, 'floating');
                        if (trayInstance) trayInstance.setContextMenu(buildContextMenu());
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Jalankan Otomatis saat Startup (Boot)',
                type: 'checkbox',
                checked: (() => {
                    try {
                        return app.getLoginItemSettings().openAtLogin;
                    } catch {
                        return false;
                    }
                })(),
                click: (menuItem) => {
                    try {
                        app.setLoginItemSettings({
                            openAtLogin: menuItem.checked,
                            path: process.execPath,
                            args: ['--hidden']
                        });
                        if (trayInstance) trayInstance.setContextMenu(buildContextMenu());
                    } catch (e) {
                        console.warn('[Tray] Error setting login items:', e.message);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Refresh Jadwal',
                click: async () => {
                    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                        const res = await calendarService.getUpcomingEvents();
                        currentMainWindow.webContents.send('calendar:events-updated', res);
                    }
                }
            },
            {
                label: 'Buka di Browser (Google Calendar)',
                click: () => {
                    shell.openExternal('https://calendar.google.com');
                }
            },
            { type: 'separator' },
            {
                label: isAuth ? 'Logout Akun Google' : 'Login Akun Google',
                click: async () => {
                    if (isAuth) {
                        calendarService.clearCache();
                        authService.logout();
                        if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                            currentMainWindow.reload();
                        }
                    } else {
                        try {
                            await authService.loginWithBrowser();
                            if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                                currentMainWindow.reload();
                            }
                        } catch (err) {
                            console.error('[Tray] Login error:', err.message);
                        }
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Tampilkan / Sembunyikan Widget',
                click: () => {
                    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                        if (currentMainWindow.isVisible()) {
                            currentMainWindow.hide();
                        } else {
                            if (currentMainWindow.isMinimized()) currentMainWindow.restore();
                            currentMainWindow.show();
                            currentMainWindow.focus();
                        }
                    }
                }
            },
            {
                label: 'Reset Ukuran Standar (360x580)',
                click: () => {
                    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
                        currentMainWindow.setSize(360, 580);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Buka Folder Log',
                click: () => {
                    const { logger } = require('../utils/logger');
                    logger.openLogsFolder();
                }
            },
            {
                label: 'Keluar',
                click: () => {
                    app.quit();
                }
            }
        ]);
    };

    if (trayInstance) {
        trayInstance.setContextMenu(buildContextMenu());
        return trayInstance;
    }

    const iconPath = getIconPath();
    const trayIcon = nativeImage.createFromPath(iconPath);

    trayInstance = new Tray(trayIcon);
    trayInstance.setContextMenu(buildContextMenu());
    trayInstance.setToolTip('Google Calendar Widget');
    trayInstance.setTitle('Calendar Widget');

    trayInstance.on('click', () => {
        if (currentMainWindow && !currentMainWindow.isDestroyed()) {
            if (currentMainWindow.isVisible()) {
                currentMainWindow.focus();
            } else {
                if (currentMainWindow.isMinimized()) currentMainWindow.restore();
                currentMainWindow.show();
                currentMainWindow.focus();
            }
        }
    });

    return trayInstance;
};

module.exports = {
    createTray
};
