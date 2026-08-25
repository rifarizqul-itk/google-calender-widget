const test = require('node:test');
const assert = require('node:assert/strict');
const { debounce } = require('../src/utils/debounce');

test('debounce - executes only after specified delay', async () => {
    let callCount = 0;
    let lastArg = null;

    const fn = (val) => {
        callCount++;
        lastArg = val;
    };

    const debounced = debounce(fn, 50);

    debounced('first');
    debounced('second');
    debounced('third');

    assert.strictEqual(callCount, 0);

    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.strictEqual(callCount, 1);
    assert.strictEqual(lastArg, 'third');
});

test('debounce - cancel prevents execution', async () => {
    let callCount = 0;
    const debounced = debounce(() => { callCount++; }, 50);

    debounced();
    debounced.cancel();

    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.strictEqual(callCount, 0);
});
