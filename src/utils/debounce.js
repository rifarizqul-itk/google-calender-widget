/**
 * Creates a debounced function that delays invoking fn until waitMs milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} fn Function to debounce
 * @param {number} waitMs Milliseconds to delay
 * @returns {Function & { cancel: Function }}
 */
function debounce(fn, waitMs = 250) {
    let timeoutId = null;

    const debounced = function (...args) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            timeoutId = null;
            fn.apply(this, args);
        }, waitMs);
    };

    debounced.cancel = function () {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
}

module.exports = { debounce };
