const { calendar: getCalendarClient } = require('googleapis/build/src/apis/calendar');
const path = require('path');
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require('fs');
const { app } = require('electron');
const { authService } = require('./authService');

class CalendarService {
    constructor() {
        this.cachePath = null;
        this.selectedCalendarsPath = null;
        this.initPaths();
    }

    initPaths() {
        const appData = process.env.APPDATA;
        const cacheCandidates = [];
        const selectedCandidates = [];

        try {
            const userData = app.getPath('userData');
            if (userData) {
                cacheCandidates.push(path.join(userData, 'calendar_cache.json'));
                selectedCandidates.push(path.join(userData, 'selected_calendars.json'));
            }
        } catch {}

        if (appData) {
            cacheCandidates.push(path.join(appData, 'google-calender-widget', 'calendar_cache.json'));
            cacheCandidates.push(path.join(appData, 'p32929.google-calender-widget', 'calendar_cache.json'));
            selectedCandidates.push(path.join(appData, 'google-calender-widget', 'selected_calendars.json'));
            selectedCandidates.push(path.join(appData, 'p32929.google-calender-widget', 'selected_calendars.json'));
        }

        cacheCandidates.push(path.join(process.cwd(), 'calendar_cache.json'));
        selectedCandidates.push(path.join(process.cwd(), 'selected_calendars.json'));

        this.cachePath = cacheCandidates.find(p => existsSync(p)) || cacheCandidates[0];
        this.selectedCalendarsPath = selectedCandidates.find(p => existsSync(p)) || selectedCandidates[0];
    }

    getSelectedCalendarIds() {
        try {
            if (this.selectedCalendarsPath && existsSync(this.selectedCalendarsPath)) {
                const raw = readFileSync(this.selectedCalendarsPath, 'utf8');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return null; // Null means all calendars selected by default
    }

    setSelectedCalendarIds(ids) {
        try {
            if (Array.isArray(ids)) {
                writeFileSync(this.selectedCalendarsPath, JSON.stringify(ids, null, 2), 'utf8');
                const { logger } = require('../utils/logger');
                logger.info('CalendarService', `Saved ${ids.length} selected calendar preferences.`);
            }
        } catch (err) {
            console.warn('[CalendarService] Error saving selected calendars:', err.message);
        }
    }

    saveCache(events) {
        try {
            const payload = {
                timestamp: Date.now(),
                events
            };
            writeFileSync(this.cachePath, JSON.stringify(payload, null, 2), 'utf8');
        } catch (error) {
            console.warn('[CalendarService] Warning saving cache:', error.message);
        }
    }

    getCachedEvents() {
        try {
            if (this.cachePath && existsSync(this.cachePath)) {
                const raw = readFileSync(this.cachePath, 'utf8');
                const parsed = JSON.parse(raw);
                return parsed.events || [];
            }
        } catch {
            return [];
        }
        return [];
    }

    clearCache() {
        try {
            if (this.cachePath && existsSync(this.cachePath)) {
                unlinkSync(this.cachePath);
            }
            if (this.selectedCalendarsPath && existsSync(this.selectedCalendarsPath)) {
                unlinkSync(this.selectedCalendarsPath);
            }
            const { logger } = require('../utils/logger');
            logger.info('CalendarService', 'Local calendar cache and preferences cleared.');
        } catch (err) {
            console.warn('[CalendarService] Error clearing cache:', err.message);
        }
    }

    async getCalendarList() {
        if (!authService.isAuthenticated()) {
            return { authenticated: false, calendars: [], selectedIds: [] };
        }

        try {
            const auth = await authService.getAuthenticatedClient();
            const calendar = getCalendarClient({ version: 'v3', auth });

            const res = await calendar.calendarList.list();
            const items = res.data.items || [];
            const calendars = items.map(c => ({
                id: c.id,
                summary: c.summary || 'Kalender',
                description: c.description || '',
                backgroundColor: c.backgroundColor || '#38bdf8',
                foregroundColor: c.foregroundColor || '#ffffff',
                primary: Boolean(c.primary),
                selected: Boolean(c.selected !== false && !c.hidden),
                accessRole: c.accessRole || 'reader'
            }));

            const savedIds = this.getSelectedCalendarIds();
            const selectedIds = savedIds !== null 
                ? savedIds 
                : calendars.filter(c => c.selected).map(c => c.id);

            return {
                authenticated: true,
                calendars,
                selectedIds
            };
        } catch (err) {
            console.error('[CalendarService] Error getting calendar list:', err.message);
            return { authenticated: true, calendars: [], selectedIds: [], error: err.message };
        }
    }

    async getUpcomingEvents(options = {}) {
        const { maxResults = 250, daysAhead = 90, daysPast = 60 } = options;

        if (!authService.isAuthenticated()) {
            return {
                authenticated: false,
                events: this.getCachedEvents(),
                calendars: [],
                selectedCalendarIds: []
            };
        }

        try {
            const auth = await authService.getAuthenticatedClient();
            const calendar = getCalendarClient({ version: 'v3', auth });

            const now = new Date();
            const pastDate = new Date(now.getTime() - daysPast * 24 * 60 * 60 * 1000);
            const timeMin = options.timeMin || new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate()).toISOString();
            const timeMax = options.timeMax || new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

            // 1. Fetch all user's calendars
            let allCalendars = [{ id: 'primary', summary: 'Primary', backgroundColor: '#38bdf8' }];
            try {
                const calListRes = await calendar.calendarList.list();
                if (calListRes.data && calListRes.data.items) {
                    allCalendars = calListRes.data.items.map(c => ({
                        id: c.id,
                        summary: c.summary || 'Kalender',
                        backgroundColor: c.backgroundColor || '#38bdf8',
                        primary: Boolean(c.primary),
                        selected: Boolean(c.selected !== false && !c.hidden),
                        accessRole: c.accessRole || 'reader'
                    }));
                }
            } catch (listErr) {
                console.warn('[CalendarService] Could not list all calendars, fallback to primary:', listErr.message);
            }

            // 2. Filter by user's selected/checked calendar preferences
            const savedSelectedIds = this.getSelectedCalendarIds();
            const activeCalendars = allCalendars.filter(cal => {
                if (savedSelectedIds === null) {
                    return cal.selected !== false;
                }
                return savedSelectedIds.includes(cal.id);
            });

            // Google Calendar official 11 event colors map
            const GOOGLE_EVENT_COLORS = {
                '1': '#7986cb',  // Lavender
                '2': '#33b679',  // Sage
                '3': '#8e24aa',  // Grape
                '4': '#e67c73',  // Flamingo
                '5': '#f6bf26',  // Banana
                '6': '#f4511e',  // Tangerine
                '7': '#039be5',  // Peacock
                '8': '#616161',  // Graphite
                '9': '#3f51b5',  // Blueberry
                '10': '#0b8043', // Basil
                '11': '#d50000'  // Tomato
            };

            // 3. Fetch events from active/checked calendars in parallel
            const fetchPromises = activeCalendars.map(async (cal) => {
                try {
                    const res = await calendar.events.list({
                        calendarId: cal.id,
                        timeMin,
                        timeMax,
                        maxResults,
                        singleEvents: true,
                        orderBy: 'startTime'
                    });

                    const items = res.data.items || [];
                    return items.map((item) => {
                        // Extract video conference & entry points
                        let hangoutLink = item.hangoutLink || null;
                        let conferenceDetails = null;

                        if (item.conferenceData) {
                            if (Array.isArray(item.conferenceData.entryPoints)) {
                                const videoEntry = item.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
                                if (videoEntry && !hangoutLink) hangoutLink = videoEntry.uri;
                            }
                            conferenceDetails = {
                                solutionName: item.conferenceData.conferenceSolution ? item.conferenceData.conferenceSolution.name : 'Google Meet',
                                solutionIcon: item.conferenceData.conferenceSolution ? item.conferenceData.conferenceSolution.iconUri : null,
                                entryPoints: (item.conferenceData.entryPoints || []).map(ep => ({
                                    entryPointType: ep.entryPointType,
                                    uri: ep.uri,
                                    label: ep.label || null,
                                    pin: ep.pin || null,
                                    passcode: ep.passcode || null,
                                    regionCode: ep.regionCode || null
                                })),
                                notes: item.conferenceData.notes || null
                            };
                        }

                        // Determine color (custom event color override takes priority over calendar color)
                        const eventColor = (item.colorId && GOOGLE_EVENT_COLORS[item.colorId])
                            ? GOOGLE_EVENT_COLORS[item.colorId]
                            : (cal.backgroundColor || '#38bdf8');

                        return {
                            id: item.id,
                            summary: item.summary || '(Tanpa Judul)',
                            description: item.description || '',
                            location: item.location || '',
                            htmlLink: item.htmlLink || 'https://calendar.google.com',
                            start: item.start.dateTime || item.start.date,
                            end: item.end.dateTime || item.end.date,
                            timeZone: item.start.timeZone || item.end.timeZone || '',
                            isAllDay: Boolean(!item.start.dateTime && item.start.date),
                            calendarId: cal.id,
                            calendarName: cal.summary || 'Kalender',
                            calendarColor: cal.backgroundColor || '#38bdf8',
                            eventColor: eventColor,
                            colorId: item.colorId || null,
                            hangoutLink,
                            conferenceDetails,
                            eventType: item.eventType || 'default', // 'default', 'outOfOffice', 'focusTime', 'workingLocation', 'fromGmail', 'birthday'
                            workingLocationProperties: item.workingLocationProperties || null,
                            outOfOfficeProperties: item.outOfOfficeProperties || null,
                            focusTimeProperties: item.focusTimeProperties || null,
                            transparency: item.transparency || 'opaque', // 'opaque' (Busy) vs 'transparent' (Free)
                            visibility: item.visibility || 'default',     // 'default', 'public', 'private', 'confidential'
                            status: item.status || 'confirmed',          // 'confirmed', 'tentative', 'cancelled'
                            created: item.created || null,
                            updated: item.updated || null,
                            iCalUID: item.iCalUID || null,
                            organizer: item.organizer ? { email: item.organizer.email, displayName: item.organizer.displayName || item.organizer.email } : null,
                            creator: item.creator ? { email: item.creator.email, displayName: item.creator.displayName || item.creator.email } : null,
                            attendees: (item.attendees || []).map(a => ({
                                email: a.email,
                                displayName: a.displayName || a.email,
                                responseStatus: a.responseStatus || 'needsAction', // 'accepted', 'tentative', 'declined', 'needsAction'
                                self: Boolean(a.self),
                                organizer: Boolean(a.organizer),
                                optional: Boolean(a.optional),
                                comment: a.comment || null,
                                additionalGuests: a.additionalGuests || 0,
                                resource: Boolean(a.resource)
                            })),
                            reminders: item.reminders ? (
                                item.reminders.useDefault ? ['Default'] :
                                (item.reminders.overrides || []).map(r => `${r.minutes}m (${r.method || 'popup'})`)
                            ) : [],
                            remindersData: item.reminders ? {
                                useDefault: Boolean(item.reminders.useDefault),
                                overrides: (item.reminders.overrides || []).map(r => ({
                                    minutes: r.minutes,
                                    method: r.method || 'popup'
                                }))
                            } : null,
                            recurring: Boolean(item.recurringEventId || item.recurrence),
                            recurrence: item.recurrence || null,
                            recurringEventId: item.recurringEventId || null,
                            attachments: (item.attachments || []).map(att => ({
                                fileUrl: att.fileUrl,
                                title: att.title || 'Lampiran Dokumen',
                                iconLink: att.iconLink || '',
                                mimeType: att.mimeType || '',
                                fileId: att.fileId || ''
                            }))
                        };
                    });
                } catch (err) {
                    console.warn(`[CalendarService] Error fetching calendar ${cal.summary}:`, err.message);
                    return [];
                }
            });

            const results = await Promise.allSettled(fetchPromises);
            let combinedEvents = [];
            for (const result of results) {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    combinedEvents.push(...result.value);
                }
            }

            // Deduplicate and Sort chronologically by start time
            const uniqueMap = new Map();
            combinedEvents.forEach(ev => {
                const uniqueKey = `${ev.id}_${ev.start}`;
                if (!uniqueMap.has(uniqueKey)) {
                    uniqueMap.set(uniqueKey, ev);
                }
            });

            const sortedEvents = Array.from(uniqueMap.values()).sort((a, b) => {
                return new Date(a.start).getTime() - new Date(b.start).getTime();
            });

            this.saveCache(sortedEvents);
            const { logger } = require('../utils/logger');
            logger.info('CalendarService', `Fetched ${sortedEvents.length} rich events across ${activeCalendars.length} active checked calendars.`);

            const selectedIdsList = savedSelectedIds !== null ? savedSelectedIds : allCalendars.map(c => c.id);

            return {
                authenticated: true,
                events: sortedEvents,
                calendars: allCalendars,
                selectedCalendarIds: selectedIdsList,
                fromCache: false
            };
        } catch (error) {
            const { logger } = require('../utils/logger');
            logger.warn('CalendarService', `Failed to fetch events from API, falling back to cache: ${error.message}`);
            return {
                authenticated: true,
                events: this.getCachedEvents(),
                calendars: [],
                selectedCalendarIds: [],
                fromCache: true,
                error: error.message
            };
        }
    }

    async createQuickEvent({ calendarId = 'primary', summary, startDateTime, endDateTime, location, description, isAllDay = false }) {
        const auth = await authService.getAuthenticatedClient();
        const calendar = getCalendarClient({ version: 'v3', auth });

        let eventPayload = {
            summary: summary || 'Acara Baru',
            location: location || '',
            description: description || ''
        };

        if (isAllDay) {
            const startDateStr = startDateTime.split('T')[0];
            const rawEndDateStr = endDateTime ? endDateTime.split('T')[0] : startDateStr;
            const [y, m, d] = rawEndDateStr.split('-').map(Number);
            // Google Calendar API v3 requires exclusive end date (next day) for all-day events
            const endObj = new Date(y, m - 1, d + 1);
            const pad = n => String(n).padStart(2, '0');
            const exclusiveEndDateStr = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}`;

            eventPayload.start = { date: startDateStr };
            eventPayload.end = { date: exclusiveEndDateStr };
        } else {
            eventPayload.start = { dateTime: new Date(startDateTime).toISOString() };
            eventPayload.end = { dateTime: new Date(endDateTime).toISOString() };
        }

        const res = await calendar.events.insert({
            calendarId: calendarId || 'primary',
            requestBody: eventPayload
        });

        const { logger } = require('../utils/logger');
        logger.info('CalendarService', `Created new event "${summary}" in calendar "${calendarId}".`);

        return res.data;
    }

    async updateEvent({
        calendarId = 'primary',
        eventId,
        summary,
        startDateTime,
        endDateTime,
        location,
        description,
        isAllDay = false,
        transparency = 'opaque',
        visibility = 'default',
        colorId = null
    }) {
        if (!eventId || typeof eventId !== 'string') {
            throw new Error('Valid Event ID is required for update');
        }
        const auth = await authService.getAuthenticatedClient();
        const calendar = getCalendarClient({ version: 'v3', auth });

        const requestBody = {};
        if (summary !== undefined) requestBody.summary = String(summary);
        if (location !== undefined) requestBody.location = String(location);
        if (description !== undefined) requestBody.description = String(description);
        if (transparency) requestBody.transparency = transparency;
        if (visibility && visibility !== 'default') requestBody.visibility = visibility;
        if (colorId) requestBody.colorId = String(colorId);

        if (startDateTime && endDateTime) {
            if (isAllDay) {
                const startDateStr = startDateTime.split('T')[0];
                const rawEndDateStr = endDateTime.split('T')[0];
                const [y, m, d] = rawEndDateStr.split('-').map(Number);
                const endObj = new Date(y, m - 1, d + 1);
                const pad = n => String(n).padStart(2, '0');
                const exclusiveEndDateStr = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}`;

                requestBody.start = { date: startDateStr };
                requestBody.end = { date: exclusiveEndDateStr };
            } else {
                requestBody.start = { dateTime: new Date(startDateTime).toISOString() };
                requestBody.end = { dateTime: new Date(endDateTime).toISOString() };
            }
        }

        const res = await calendar.events.patch({
            calendarId: calendarId || 'primary',
            eventId,
            requestBody
        });

        const { logger } = require('../utils/logger');
        logger.info('CalendarService', `Updated event "${eventId}" (${summary || ''}) in calendar "${calendarId}".`);

        return res.data;
    }

    async getEventsForRange({ timeMin, timeMax, maxResults = 250 }) {
        return this.getUpcomingEvents({ timeMin, timeMax, maxResults });
    }

    async deleteEvent({ calendarId = 'primary', eventId }) {
        if (!eventId) throw new Error('Event ID is required for deletion');
        const auth = await authService.getAuthenticatedClient();
        const calendar = getCalendarClient({ version: 'v3', auth });

        await calendar.events.delete({
            calendarId: calendarId || 'primary',
            eventId
        });

        const { logger } = require('../utils/logger');
        logger.info('CalendarService', `Deleted event "${eventId}" from calendar "${calendarId}".`);

        return { success: true, eventId };
    }
}

const calendarService = new CalendarService();
module.exports = { calendarService, CalendarService };
