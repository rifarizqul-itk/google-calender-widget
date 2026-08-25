const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const { mkdtempSync, rmSync, readFileSync, writeFileSync } = require('fs');
const { saveLastView, getLastView, getPreferencesPath } = require('../src/services/preferences');

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
