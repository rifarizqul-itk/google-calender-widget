const test = require('node:test');
const assert = require('node:assert/strict');
const {
    detectActiveSemesterCalendar,
    calculateWeekNumber,
    generateWeekSchedule,
    formatLocalDate,
    SEMESTER_TOTAL_WEEKS
} = require('../src/services/academicService');


// ==========================================================================
// detectActiveSemesterCalendar
// ==========================================================================

test('detectActiveSemesterCalendar — empty array returns null result', () => {
    const res = detectActiveSemesterCalendar([], null);
    assert.strictEqual(res.calendar, null);
    assert.strictEqual(res.semesterNumber, null);
    assert.strictEqual(res.academicYear, null);
});

test('detectActiveSemesterCalendar — null input returns null result', () => {
    const res = detectActiveSemesterCalendar(null, null);
    assert.strictEqual(res.calendar, null);
});

test('detectActiveSemesterCalendar — no matching calendars returns null', () => {
    const cals = [
        { id: 'a', summary: 'Personal', selected: true },
        { id: 'b', summary: 'Work', selected: true }
    ];
    const res = detectActiveSemesterCalendar(cals, null);
    assert.strictEqual(res.calendar, null);
});

test('detectActiveSemesterCalendar — matching calendar not visible returns null', () => {
    const cals = [{ id: 'a', summary: 'SEMESTER 5 - 2026/2027', selected: false }];
    const res = detectActiveSemesterCalendar(cals, null);
    assert.strictEqual(res.calendar, null);
});

test('detectActiveSemesterCalendar — matching calendar excluded from selectedIds returns null', () => {
    const cals = [{ id: 'sem5', summary: 'SEMESTER 5 - 2026/2027', selected: true }];
    const res = detectActiveSemesterCalendar(cals, ['other-id']); // sem5 NOT in list
    assert.strictEqual(res.calendar, null);
});

test('detectActiveSemesterCalendar — single active match returns correct result', () => {
    const cals = [
        { id: 'sem5', summary: 'SEMESTER 5 - 2026/2027', selected: true },
        { id: 'personal', summary: 'Personal', selected: true }
    ];
    const res = detectActiveSemesterCalendar(cals, null);
    assert.strictEqual(res.semesterNumber, 5);
    assert.strictEqual(res.academicYear, '2026/2027');
    assert.deepEqual(res.calendar, cals[0]);
});

test('detectActiveSemesterCalendar — selectedIds filter overrides calendar.selected', () => {
    const cals = [
        { id: 'sem5', summary: 'SEMESTER 5 - 2026/2027', selected: false }, // unselected in API
        { id: 'personal', summary: 'Personal', selected: true }
    ];
    // But user re-enabled it via selectedIds
    const res = detectActiveSemesterCalendar(cals, ['sem5', 'personal']);
    assert.strictEqual(res.semesterNumber, 5);
});

test('detectActiveSemesterCalendar — two active matches picks highest semester number', () => {
    const cals = [
        { id: 'sem3', summary: 'SEMESTER 3 - 2024/2025', selected: true },
        { id: 'sem5', summary: 'SEMESTER 5 - 2026/2027', selected: true }
    ];
    const res = detectActiveSemesterCalendar(cals, null);
    assert.strictEqual(res.semesterNumber, 5);
});

test('detectActiveSemesterCalendar — case insensitive match', () => {
    const cals = [{ id: 's', summary: 'semester 7 - 2027/2028', selected: true }];
    const res = detectActiveSemesterCalendar(cals, null);
    assert.strictEqual(res.semesterNumber, 7);
    assert.strictEqual(res.academicYear, '2027/2028');
});

test('detectActiveSemesterCalendar — en-dash separator is accepted', () => {
    const cals = [{ id: 's', summary: 'SEMESTER 3 \u2013 2024/2025', selected: true }];
    const res = detectActiveSemesterCalendar(cals, null);
    assert.strictEqual(res.semesterNumber, 3);
});

// ==========================================================================
// calculateWeekNumber
// ==========================================================================

test('calculateWeekNumber — null/undefined input returns null', () => {
    assert.strictEqual(calculateWeekNumber(null), null);
    assert.strictEqual(calculateWeekNumber(undefined), null);
    assert.strictEqual(calculateWeekNumber(''), null);
    assert.strictEqual(calculateWeekNumber(42), null);
});

test('calculateWeekNumber — non-date string returns null', () => {
    assert.strictEqual(calculateWeekNumber('not-a-date'), null);
    assert.strictEqual(calculateWeekNumber('abc-def-ghi'), null);
});

test('calculateWeekNumber — today == startDate is Week 1', () => {
    const start = '2026-09-01';
    const today = new Date(2026, 8, 1); // Sep 1 2026 (local)
    assert.strictEqual(calculateWeekNumber(start, today), 1);
});

test('calculateWeekNumber — day 6 of Week 1 is still Week 1', () => {
    const start = '2026-09-01';
    const today = new Date(2026, 8, 6); // Sep 6 2026
    assert.strictEqual(calculateWeekNumber(start, today), 1);
});

test('calculateWeekNumber — day 7 (= 1 week later) is Week 2', () => {
    const start = '2026-09-01';
    const today = new Date(2026, 8, 8); // Sep 8 2026
    assert.strictEqual(calculateWeekNumber(start, today), 2);
});

test('calculateWeekNumber — before startDate returns 0', () => {
    const start = '2026-09-01';
    const today = new Date(2026, 7, 31); // Aug 31 2026
    assert.strictEqual(calculateWeekNumber(start, today), 0);
});

test('calculateWeekNumber — exactly at start of Week 16', () => {
    const start = '2026-09-01';
    // Week 16 begins at day 15*7 = 105 days after start
    const day105 = new Date(2026, 8, 1);
    day105.setDate(day105.getDate() + 105);
    assert.strictEqual(calculateWeekNumber(start, day105), 16);
});

test('calculateWeekNumber — beyond Week 16 still returns correct number', () => {
    const start = '2026-09-01';
    // 120 days later = floor(120/7)+1 = 17+1 = 18
    const day120 = new Date(2026, 8, 1);
    day120.setDate(day120.getDate() + 120);
    assert.strictEqual(calculateWeekNumber(start, day120), 18);
});

// ==========================================================================
// generateWeekSchedule
// ==========================================================================

test('generateWeekSchedule — invalid startDate returns empty array', () => {
    assert.deepEqual(generateWeekSchedule('invalid', 16), []);
    assert.deepEqual(generateWeekSchedule(null, 16), []);
    assert.deepEqual(generateWeekSchedule('', 16), []);
});

test('generateWeekSchedule — generates correct number of weeks', () => {
    const schedule = generateWeekSchedule('2026-09-01', 16);
    assert.strictEqual(schedule.length, 16);
});

test('generateWeekSchedule — uses default SEMESTER_TOTAL_WEEKS when not provided', () => {
    const schedule = generateWeekSchedule('2026-09-01');
    assert.strictEqual(schedule.length, SEMESTER_TOTAL_WEEKS);
});

test('generateWeekSchedule — custom totalWeeks is respected', () => {
    const schedule = generateWeekSchedule('2026-09-01', 8);
    assert.strictEqual(schedule.length, 8);
});

test('generateWeekSchedule — week 1 startDate matches semester start', () => {
    const schedule = generateWeekSchedule('2026-09-01', 4);
    // Sep 1 2026
    assert.strictEqual(schedule[0].startDate.getFullYear(), 2026);
    assert.strictEqual(schedule[0].startDate.getMonth(), 8); // September (0-indexed)
    assert.strictEqual(schedule[0].startDate.getDate(), 1);
});

test('generateWeekSchedule — each week endDate is 6 days after startDate', () => {
    const schedule = generateWeekSchedule('2026-09-01', 4);
    for (const week of schedule) {
        const diffMs = week.endDate.getTime() - week.startDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        assert.strictEqual(diffDays, 6);
    }
});

test('generateWeekSchedule — week 2 starts day 7 after week 1', () => {
    const schedule = generateWeekSchedule('2026-09-01', 4);
    const w1Start = schedule[0].startDate.getTime();
    const w2Start = schedule[1].startDate.getTime();
    assert.strictEqual(w2Start - w1Start, 7 * 24 * 60 * 60 * 1000);
});

test('generateWeekSchedule — isCurrent flag is set on the correct week', () => {
    // Reference: Sep 8 2026 = 7 days after Sep 1 -> Week 2
    const ref = new Date(2026, 8, 8);
    const schedule = generateWeekSchedule('2026-09-01', 4, ref);
    assert.strictEqual(schedule[0].isCurrent, false);
    assert.strictEqual(schedule[1].isCurrent, true);
    assert.strictEqual(schedule[2].isCurrent, false);
});

test('generateWeekSchedule — isPast flag is set for weeks before current', () => {
    // Reference: Sep 15 2026 = day 14 -> Week 3
    const ref = new Date(2026, 8, 15);
    const schedule = generateWeekSchedule('2026-09-01', 4, ref);
    assert.strictEqual(schedule[0].isPast, true);
    assert.strictEqual(schedule[1].isPast, true);
    assert.strictEqual(schedule[2].isCurrent, true);
    assert.strictEqual(schedule[3].isPast, false);
});

test('generateWeekSchedule — weekNum field is sequential from 1', () => {
    const schedule = generateWeekSchedule('2026-09-01', 4);
    schedule.forEach((week, i) => {
        assert.strictEqual(week.weekNum, i + 1);
    });
});

test('generateWeekSchedule — supports 17 weeks without capping at 16', () => {
    const schedule = generateWeekSchedule('2026-09-01', 17);
    assert.strictEqual(schedule.length, 17);
    assert.strictEqual(schedule[16].weekNum, 17);

    // Week 17 starts at 16 * 7 = 112 days after start
    const expectedW17StartMs = new Date(2026, 8, 1).getTime() + 16 * 7 * 24 * 60 * 60 * 1000;
    assert.strictEqual(schedule[16].startDate.getTime(), expectedW17StartMs);
});

test('calculateWeekNumber — correctly computes week 17 and is not capped at 16', () => {
    const start = '2026-09-01';
    // Day in week 17: 16 * 7 = 112 days after start
    const dayInW17 = new Date(2026, 8, 1);
    dayInW17.setDate(dayInW17.getDate() + 114); // mid week 17
    assert.strictEqual(calculateWeekNumber(start, dayInW17), 17);
});

// ==========================================================================
// formatLocalDate & Timezone Safety
// ==========================================================================

test('formatLocalDate — formats date locally without UTC shift', () => {
    const d = new Date(2026, 7, 24); // Aug 24, 2026
    assert.strictEqual(formatLocalDate(d), '2026-08-24');
});

test('generateWeekSchedule — preserves exact local start date (e.g. 2026-08-24)', () => {
    const schedule = generateWeekSchedule('2026-08-24', 16);
    assert.strictEqual(schedule[0].startDateStr, '2026-08-24');
    assert.strictEqual(formatLocalDate(schedule[0].startDate), '2026-08-24');
    assert.strictEqual(schedule[0].endDateStr, '2026-08-30'); // 7 days: 24, 25, 26, 27, 28, 29, 30
    assert.strictEqual(schedule[1].startDateStr, '2026-08-31');
});




