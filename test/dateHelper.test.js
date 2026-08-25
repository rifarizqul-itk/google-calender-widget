const test = require('node:test');
const assert = require('node:assert');
const { formatEventTime, getDayHeader, getEventCountdown } = require('../src/utils/dateHelper');

test('formatEventTime: formats all-day events correctly', () => {
    const result = formatEventTime('2026-03-25', '2026-03-26', true);
    assert.strictEqual(result, 'Sepanjang Hari');
});

test('formatEventTime: formats timed events correctly', () => {
    const start = '2026-03-25T09:00:00.000Z';
    const end = '2026-03-25T11:00:00.000Z';
    const result = formatEventTime(start, end, false);
    assert.ok(result.includes('-'));
});

test('getDayHeader: identifies today correctly', () => {
    const today = new Date();
    const result = getDayHeader(today);
    assert.strictEqual(result, 'Hari Ini');
});

test('getDayHeader: identifies tomorrow correctly', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = getDayHeader(tomorrow);
    assert.strictEqual(result, 'Besok');
});

test('getEventCountdown: calculates future countdown', () => {
    const in30Mins = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = getEventCountdown(in30Mins);
    assert.ok(result.text.includes('menit lagi') || result.text.includes('30'));
    assert.strictEqual(result.isNow, false);
});

test('getEventCountdown: identifies ongoing event', () => {
    const past = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const result = getEventCountdown(past);
    assert.strictEqual(result.text, 'Sedang Berlangsung');
    assert.strictEqual(result.isNow, true);
});
