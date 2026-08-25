const test = require('node:test');
const assert = require('node:assert/strict');
const {
    CALENDAR_BASE_URL,
    CALENDAR_VIEWS,
    DEFAULT_VIEW,
    detectViewFromUrl
} = require('../src/config/constants');

test('constants - verify views and urls', () => {
    assert.strictEqual(CALENDAR_BASE_URL, 'https://calendar.google.com/calendar/u/0/r');
    assert.strictEqual(DEFAULT_VIEW, 'AGENDA');
    assert.strictEqual(CALENDAR_VIEWS.AGENDA, 'https://calendar.google.com/calendar/u/0/r/agenda');
    assert.strictEqual(CALENDAR_VIEWS.DAY, 'https://calendar.google.com/calendar/u/0/r/day');
    assert.strictEqual(CALENDAR_VIEWS.WEEK, 'https://calendar.google.com/calendar/u/0/r/week');
    assert.strictEqual(CALENDAR_VIEWS.MONTH, 'https://calendar.google.com/calendar/u/0/r/month');
    assert.strictEqual(CALENDAR_VIEWS.YEAR, 'https://calendar.google.com/calendar/u/0/r/year');
});

test('detectViewFromUrl - correctly detects all views', () => {
    assert.strictEqual(detectViewFromUrl('https://calendar.google.com/calendar/u/0/r/agenda'), 'AGENDA');
    assert.strictEqual(detectViewFromUrl('https://calendar.google.com/calendar/u/0/r/day?tab=1'), 'DAY');
    assert.strictEqual(detectViewFromUrl('https://calendar.google.com/calendar/u/0/r/week'), 'WEEK');
    assert.strictEqual(detectViewFromUrl('https://calendar.google.com/calendar/u/0/r/month'), 'MONTH');
    assert.strictEqual(detectViewFromUrl('https://calendar.google.com/calendar/u/0/r/year'), 'YEAR');
});

test('detectViewFromUrl - handles invalid or non-calendar urls', () => {
    assert.strictEqual(detectViewFromUrl(null), null);
    assert.strictEqual(detectViewFromUrl(''), null);
    assert.strictEqual(detectViewFromUrl('https://accounts.google.com/signin'), null);
    assert.strictEqual(detectViewFromUrl('https://example.com/agenda'), null);
});
