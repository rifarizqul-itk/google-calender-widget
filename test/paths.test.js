const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('fs');
const { getIconPath, getResourcesDir } = require('../src/utils/paths');

test('paths - getResourcesDir and getIconPath point to existing resources', () => {
    const resourcesDir = getResourcesDir();
    assert.ok(typeof resourcesDir === 'string' && resourcesDir.length > 0);

    const iconPath = getIconPath();
    assert.ok(existsSync(iconPath), `icon file should exist at ${iconPath}`);
});
