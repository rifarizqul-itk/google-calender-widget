const test = require('node:test');
const assert = require('node:assert/strict');
const { windowStateKeeper } = require('../src/services/windowState');

test('windowStateKeeper - initializes default bounds gracefully', async () => {
    const state = await windowStateKeeper('test-window');
    assert.equal(typeof state.width, 'number');
    assert.equal(typeof state.height, 'number');
    assert.equal(typeof state.track, 'function');
});
