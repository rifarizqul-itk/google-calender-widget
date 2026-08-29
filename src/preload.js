const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure IPC Context Bridge following Electron security best practices.
 * Exposes only strictly whitelisted APIs to the renderer process.
 */
contextBridge.exposeInMainWorld('calendarWidgetAPI', {
    auth: {
        checkStatus: () => ipcRenderer.invoke('auth:status'),
        login: () => ipcRenderer.invoke('auth:login'),
        logout: () => ipcRenderer.invoke('auth:logout')
    },
    calendar: {
        getEvents: (options) => ipcRenderer.invoke('calendar:get-events', options),
        refreshEvents: () => ipcRenderer.invoke('calendar:refresh-events'),
        getCalendarList: () => ipcRenderer.invoke('calendar:get-calendar-list'),
        setSelectedCalendars: (ids) => ipcRenderer.invoke('calendar:set-selected-calendars', ids),
        createQuickEvent: (data) => ipcRenderer.invoke('calendar:create-event', data),
        updateEvent: (data) => ipcRenderer.invoke('calendar:update-event', data),
        deleteEvent: (data) => ipcRenderer.invoke('calendar:delete-event', data),
        getEventsForRange: (data) => ipcRenderer.invoke('calendar:get-events-for-range', data)
    },
    window: {
        close: () => ipcRenderer.send('window:close'),
        minimize: () => ipcRenderer.send('window:minimize'),
        togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
        isPinned: () => ipcRenderer.invoke('window:is-pinned'),
        resize: (size) => ipcRenderer.send('window:resize', size)
    },
    system: {
        openExternal: (url) => ipcRenderer.send('system:open-external', url),
        openLogs: () => ipcRenderer.send('system:open-logs'),
        openCredentialsFolder: () => ipcRenderer.send('system:open-credentials-folder'),
        getAutoLaunch: () => ipcRenderer.invoke('system:get-auto-launch'),
        setAutoLaunch: (enable) => ipcRenderer.invoke('system:set-auto-launch', enable)
    },
    onEventsUpdated: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('calendar:events-updated', subscription);
        return () => ipcRenderer.removeListener('calendar:events-updated', subscription);
    }
});
