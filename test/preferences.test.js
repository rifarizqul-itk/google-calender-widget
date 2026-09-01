const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const { mkdtempSync, rmSync, readFileSync, writeFileSync } = require('fs');
const {
    saveLastView,
    getLastView,
    getPreferencesPath,
    saveSemesterStartDate,
    getSemesterStartDate,
    saveSemesterTotalWeeks,
    getSemesterTotalWeeks
} = require('../src/services/preferences');

test('preferences - saveLastView and getLastView persist correctly', () => {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'gcw-test-'));

    try {
        // Initial state should return default view 'AGENDA'
        assert.strictEqual(getLastView(tmpDir), 'AGENDA');

        // Save new view
        saveLastView('MONTH', tmpDir);
        assert.strictEqual(getLastView(tmpDir), 'MONTH');

        // Verify JSON content
        const prefsFile = getPreferencesPath(tmpDir);
        const data = JSON.parse(readFileSync(prefsFile, 'utf8'));
        assert.strictEqual(data.lastView, 'MONTH');

        // Ignore invalid view
        saveLastView('INVALID_VIEW', tmpDir);
        assert.strictEqual(getLastView(tmpDir), 'MONTH');
    } finally {
        rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('preferences - recovers gracefully from corrupted json file', () => {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'gcw-corrupt-'));

    try {
        const prefsFile = getPreferencesPath(tmpDir);
        writeFileSync(prefsFile, '{ malformed json :: [', 'utf8');

        // Should not throw, should return default view
        assert.strictEqual(getLastView(tmpDir), 'AGENDA');

        // Saving a valid view should overwrite corrupted file safely
        saveLastView('WEEK', tmpDir);
        assert.strictEqual(getLastView(tmpDir), 'WEEK');
    } finally {
        rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('preferences - saveSemesterStartDate and getSemesterStartDate persist and clear correctly', () => {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'gcw-sem-start-'));

    try {
        // Initially null
        assert.strictEqual(getSemesterStartDate(tmpDir), null);

        // Save valid date
        saveSemesterStartDate('2026-09-01', tmpDir);
        assert.strictEqual(getSemesterStartDate(tmpDir), '2026-09-01');

        // Ignore invalid date format
        saveSemesterStartDate('invalid-date', tmpDir);
        assert.strictEqual(getSemesterStartDate(tmpDir), '2026-09-01');

        // Clear date with null
        saveSemesterStartDate(null, tmpDir);
        assert.strictEqual(getSemesterStartDate(tmpDir), null);
    } finally {
        rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('preferences - saveSemesterTotalWeeks and getSemesterTotalWeeks persist, validate and clear correctly', () => {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'gcw-sem-weeks-'));

    try {
        // Initially null (falls back to default 16 in service layer)
        assert.strictEqual(getSemesterTotalWeeks(tmpDir), null);

        // Save valid 17 weeks
        saveSemesterTotalWeeks(17, tmpDir);
        assert.strictEqual(getSemesterTotalWeeks(tmpDir), 17);

        // Ignore out of bounds or invalid numbers
        saveSemesterTotalWeeks(0, tmpDir);
        assert.strictEqual(getSemesterTotalWeeks(tmpDir), 17);

        saveSemesterTotalWeeks(35, tmpDir);
        assert.strictEqual(getSemesterTotalWeeks(tmpDir), 17);

        saveSemesterTotalWeeks('not-a-number', tmpDir);
        assert.strictEqual(getSemesterTotalWeeks(tmpDir), 17);

        // Clear override with null
        saveSemesterTotalWeeks(null, tmpDir);
        assert.strictEqual(getSemesterTotalWeeks(tmpDir), null);
    } finally {
        rmSync(tmpDir, { recursive: true, force: true });
    }
});

