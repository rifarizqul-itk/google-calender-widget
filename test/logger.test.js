const test = require('node:test');
const assert = require('node:assert');
const { Logger } = require('../src/utils/logger');
const fs = require('fs');

test('logger - formatLog generates correct timestamped output', () => {
    const loggerInstance = new Logger();
    const formatted = loggerInstance.formatLog('INFO', 'TestModule', 'Test message', { count: 42 });

    assert.ok(formatted.includes('[INFO ]'));
    assert.ok(formatted.includes('[TestModule]'));
    assert.ok(formatted.includes('Test message'));
    assert.ok(formatted.includes('{"count":42}'));

    loggerInstance.close();
});

test('logger - getLogsDirectory returns valid path', () => {
    const loggerInstance = new Logger();
    const dir = loggerInstance.getLogsDirectory();

    assert.ok(typeof dir === 'string');
    assert.ok(dir.length > 0);

    loggerInstance.close();
});
