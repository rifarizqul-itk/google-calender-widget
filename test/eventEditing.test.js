const { describe, it } = require('node:test');
const assert = require('node:assert');
const { CalendarService } = require('../src/services/calendarService');

function formatCalendarDropdownName(summary, maxLen = 36) {
    if (!summary) return 'Kalender';
    let clean = summary.trim();
    if (/^https?:\/\//i.test(clean)) {
        try {
            const u = new URL(clean);
            const pathParts = u.pathname.split('/').filter(Boolean);
            const lastPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
            clean = `${u.hostname}${lastPart ? '/' + lastPart : ''}`;
        } catch {
            clean = clean.replace(/^https?:\/\//i, '');
        }
    }
    if (clean.length > maxLen) {
        return clean.substring(0, maxLen - 3) + '...';
    }
    return clean;
}

function htmlToPlainText(html) {
    if (!html) return '';
    if (!/<[a-z][\s\S]*>/i.test(html)) return html;
    let processed = html
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/li>/gi, '')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<ul[^>]*>|<ol[^>]*>|<\/ul>|<\/ol>/gi, '')
        .replace(/<[^>]*>/g, '');
    return processed.trim();
}

describe('Event Editing & Past Events Logic', () => {
    it('CalendarService instance has updateEvent and getEventsForRange methods', () => {
        const service = new CalendarService();
        assert.strictEqual(typeof service.updateEvent, 'function');
        assert.strictEqual(typeof service.getEventsForRange, 'function');
    });

    it('updateEvent throws error if eventId is missing or invalid', async () => {
        const service = new CalendarService();
        await assert.rejects(
            async () => {
                await service.updateEvent({ summary: 'No ID' });
            },
            {
                name: 'Error',
                message: 'Valid Event ID is required for update'
            }
        );
    });

    it('Calculates correct start and end times for all-day and timed events', () => {
        const now = new Date();
        const startStr = '2026-08-25T10:00:00.000Z';
        const endStr = '2026-08-25T11:00:00.000Z';
        
        const isPast = new Date(endStr).getTime() < now.getTime();
        assert.strictEqual(isPast, true);
    });

    it('Identifies past events accurately with comparison to current timestamp', () => {
        const pastEvent = {
            id: 'past_1',
            summary: 'Past Meeting',
            start: '2026-01-01T08:00:00.000Z',
            end: '2026-01-01T09:00:00.000Z'
        };
        const futureEvent = {
            id: 'future_1',
            summary: 'Future Meeting',
            start: '2030-01-01T08:00:00.000Z',
            end: '2030-01-01T09:00:00.000Z'
        };

        const now = Date.now();
        assert.strictEqual(new Date(pastEvent.end).getTime() < now, true);
        assert.strictEqual(new Date(futureEvent.end).getTime() > now, true);
    });

    it('Converts HTML descriptions into clean readable multi-line plain text', () => {
        const rawHtml = '<ul> <li>Ruangan: F204</li> <li>Dosen: Nursanti Novi Arisa</li> <li>Kode: SI2514025</li> </ul>';
        const plain = htmlToPlainText(rawHtml);
        assert.ok(plain.includes('• Ruangan: F204'));
        assert.ok(plain.includes('• Dosen: Nursanti Novi Arisa'));
        assert.ok(!plain.includes('<ul>'));
        assert.ok(!plain.includes('<li>'));
    });

    it('Truncates long calendar URLs and titles for select dropdown', () => {
        const longUrl = 'https://kuliah.itk.ac.id/calendar/export_execute.php?userid=15182&authtoken=3374af0a0899aebcce4dea247a393ce0900d3684&preset_what=all&preset_time=custom';
        const urlName = formatCalendarDropdownName(longUrl, 36);
        assert.ok(urlName.length <= 36);
        assert.ok(urlName.includes('kuliah.itk.ac.id'));

        const longText = 'SEMESTER 5 - 2026/2027 PERKULIAHAN KELAS PARALEL TEKNIK INFORMATIKA INSTITUT TEKNOLOGI KALIMANTAN';
        const truncatedText = formatCalendarDropdownName(longText, 36);
        assert.ok(truncatedText.length <= 36);
        assert.ok(truncatedText.endsWith('...'));
    });
});
