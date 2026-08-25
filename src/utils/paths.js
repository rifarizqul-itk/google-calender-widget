const path = require('path');
const { existsSync } = require('fs');

let isDev = false;
try {
    isDev = require('electron-is-dev');
} catch {
    isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath;
}

/**
 * Returns whether application is running in development mode
 * @returns {boolean}
 */
const isDevelopment = () => Boolean(isDev);

/**
 * Get base directory where static resources are stored
 * @returns {string}
 */
const getResourcesDir = () => {
    // In production, resources are placed in process.resourcesPath
    if (!isDevelopment() && process.resourcesPath && existsSync(process.resourcesPath)) {
        return process.resourcesPath;
    }
    // In development or local runs, resources are at <rootDir>/resources
    return path.join(__dirname, '..', '..', 'resources');
};

/**
 * Resolve full path for a resource file
 * @param {string} fileName 
 * @returns {string}
 */
const getResourcePath = (fileName) => {
    return path.join(getResourcesDir(), fileName);
};

/**
 * Get application icon path appropriate for current OS and environment
 * @returns {string}
 */
const getIconPath = () => {
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    const preferredPath = getResourcePath(iconName);
    if (existsSync(preferredPath)) {
        return preferredPath;
    }
    return getResourcePath('icon.png');
};

module.exports = {
    isDevelopment,
    getResourcesDir,
    getResourcePath,
    getIconPath
};
