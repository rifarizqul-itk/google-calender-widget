/**
 * Tauri Bridge Adapter for Google Calendar Widget
 * 
 * Maps `window.calendarWidgetAPI` calls directly to Tauri v2 Rust commands.
 * This preserves 100% of the existing frontend (widget.js, widget.css, widget.html)
 * without requiring changes to the UI business logic.
 */

(function() {
    'use strict';

    // Only activate if running inside Tauri (or fallback if global Tauri is present)
    const isTauri = Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

    if (!isTauri) {
        console.info('[TauriBridge] Not in Tauri environment (possibly running in Electron or standalone browser).');
        return;
    }

    console.info('[TauriBridge] Tauri environment detected. Initializing calendarWidgetAPI bridge.');

    function invoke(cmd, args = {}) {
        if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
            return window.__TAURI__.core.invoke(cmd, args);
        }
        if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
            return window.__TAURI_INTERNALS__.invoke(cmd, args);
        }
        return Promise.reject(new Error(`Tauri invoke not found for command: ${cmd}`));
    }

    window.calendarWidgetAPI = {
        auth: {
            checkStatus: () => invoke('auth_status'),
            login: () => invoke('auth_login'),
            logout: () => invoke('auth_logout')
        },
        calendar: {
            getEvents: (options) => invoke('calendar_get_events', { options }),
            refreshEvents: () => invoke('calendar_refresh_events'),
            getCalendarList: () => invoke('calendar_get_calendar_list'),
            setSelectedCalendars: (ids) => invoke('calendar_set_selected_calendars', { ids }),
            createQuickEvent: (data) => invoke('calendar_create_event', { data }),
            updateEvent: (data) => invoke('calendar_update_event', { data }),
            deleteEvent: (data) => invoke('calendar_delete_event', { data }),
            getEventsForRange: (data) => invoke('calendar_get_events_for_range', { data })
        },
        window: {
            close: () => invoke('window_close'),
            minimize: () => invoke('window_minimize'),
            togglePin: () => invoke('window_toggle_pin'),
            isPinned: () => invoke('window_is_pinned'),
            resize: (payload) => invoke('window_resize', { payload })
        },
        system: {
            openExternal: (url) => invoke('system_open_external', { url }),
            openLogs: () => invoke('system_open_logs'),
            openCredentialsFolder: () => invoke('system_open_credentials_folder'),
            getAutoLaunch: () => invoke('system_get_auto_launch'),
            setAutoLaunch: (enable) => invoke('system_set_auto_launch', { enable })
        },
        onEventsUpdated: (callback) => {
            let unlistenFn = null;
            if (window.__TAURI__ && window.__TAURI__.event && typeof window.__TAURI__.event.listen === 'function') {
                window.__TAURI__.event.listen('calendar:events-updated', (event) => {
                    callback(event.payload);
                }).then(fn => { unlistenFn = fn; });
            }
            return () => {
                if (unlistenFn) unlistenFn();
            };
        },
        academic: {
            getWeekInfo: () => invoke('academic_get_week_info'),
            saveSemesterStart: (dateStr) => invoke('academic_save_semester_start', { dateStr }),
            saveSemesterTotalWeeks: (weeks) => invoke('academic_save_semester_total_weeks', { weeks })
        }
    };

    // Native Window Dragging for frameless transparent widget
    document.addEventListener('mousedown', (e) => {
        // Only left mouse button initiates window drag
        if (e.button !== 0) return;

        // Prevent double click from triggering OS window maximize
        if (e.detail > 1) {
            e.preventDefault();
            return;
        }

        // Interactive UI elements that MUST NOT trigger window drag
        const isInteractive = e.target.closest(
            'button, ' +
            'input, ' +
            'a, ' +
            'select, ' +
            'textarea, ' +
            'label, ' +
            '.ctrl-btn, ' +
            '.tab-btn, ' +
            '.action-btn, ' +
            '.banner-action-arrow, ' +
            '.btn-join-meet, ' +
            '.event-meet-btn, ' +
            '.btn-copy-chip, ' +
            '.cal-nav-btn, ' +
            '.lang-pill-btn, ' +
            '.btn-logs-link, ' +
            '.btn-logout-link, ' +
            '.btn-byok-link, ' +
            '.btn-empty-add, ' +
            '.btn-empty-refresh, ' +
            '.btn-retry-sync, ' +
            '.modal-close-btn, ' +
            '.resize-handle, ' +
            '.modal-card, ' +
            '.modal-backdrop, ' +
            '.more-menu-popover, ' +
            '.popover-item, ' +
            '.item-badge, ' +
            '.auth-card, ' +
            '.event-card, ' +
            '.cal-day-cell, ' +
            '.day-events-list, ' +
            '.semester-settings-row, ' +
            '.toast, ' +
            '[data-no-drag]'
        );

        if (isInteractive) {
            return;
        }

        // All non-interactive areas (outer container background, header, brand logo/text,
        // date group headers like TODAY/TOMORROW, timeline gaps, margins, banner body)
        // trigger window dragging seamlessly across the entire widget.
        invoke('window_start_dragging').catch(() => {});
    });

    // Prevent OS maximize on double-clicking anywhere on the widget
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    });
})();
