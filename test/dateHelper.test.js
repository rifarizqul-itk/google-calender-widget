const test = require('node:test');
const assert = require('node:assert');
const { formatEventTime, getDayHeader, getEventCountdown } = require('../src/utils/dateHelper');

test('formatEventTime: formats all-day events correctly (ID & EN)', () => {
    const resultId = formatEventTime('2026-03-25', '2026-03-26', true, 'id');
    assert.strictEqual(resultId, 'Sepanjang Hari');
    const resultEn = formatEventTime('2026-03-25', '2026-03-26', true, 'en');
    assert.strictEqual(resultEn, 'All Day');
});

test('formatEventTime: formats timed events correctly', () => {
    const start = '2026-03-25T09:00:00.000Z';
    const end = '2026-03-25T11:00:00.000Z';
    const result = formatEventTime(start, end, false);
    assert.ok(result.includes('-'));
});

test('getDayHeader: identifies today correctly (ID & EN)', () => {
    const today = new Date();
    assert.strictEqual(getDayHeader(today, 'id'), 'Hari Ini');
    assert.strictEqual(getDayHeader(today, 'en'), 'Today');
});

test('getDayHeader: identifies tomorrow correctly (ID & EN)', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    assert.strictEqual(getDayHeader(tomorrow, 'id'), 'Besok');
    assert.strictEqual(getDayHeader(tomorrow, 'en'), 'Tomorrow');
});

test('getEventCountdown: calculates future countdown (ID & EN)', () => {
    const in30Mins = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const resultId = getEventCountdown(in30Mins, 'id');
    assert.ok(resultId.text.includes('menit lagi') || resultId.text.includes('30'));
    assert.strictEqual(resultId.isNow, false);

    const resultEn = getEventCountdown(in30Mins, 'en');
    assert.ok(resultEn.text.includes('in') && resultEn.text.includes('m'));
    assert.strictEqual(resultEn.isNow, false);
});

test('getEventCountdown: identifies ongoing event (ID & EN)', () => {
    const past = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    assert.strictEqual(getEventCountdown(past, 'id').text, 'Sedang Berlangsung');
    assert.strictEqual(getEventCountdown(past, 'en').text, 'In Progress');
});
