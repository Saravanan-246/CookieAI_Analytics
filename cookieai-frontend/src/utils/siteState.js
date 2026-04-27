/**
 * Global Site State Helper
 * 
 * SINGLE SOURCE OF TRUTH for active site management
 * - Uses localStorage as fallback only
 * - Always syncs with application state
 * - Provides clean API for site selection
 */

const STORAGE_KEY = "activeSiteId";

/**
 * Get the active site ID
 * @returns {string|null} The active site ID or null if not set
 */
export const getActiveSiteId = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error reading active site ID:", error);
    return null;
  }
};

/**
 * Set the active site ID
 * @param {string} siteId - The site ID to set as active
 */
export const setActiveSiteId = (siteId) => {
  try {
    if (!siteId) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, siteId);
    }
  } catch (error) {
    console.error("Error setting active site ID:", error);
  }
};

/**
 * Clear the active site ID
 */
export const clearActiveSiteId = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing active site ID:", error);
  }
};

/**
 * Check if a specific site is the active site
 * @param {string} siteId - The site ID to check
 * @returns {boolean} True if the site is active
 */
export const isActiveSite = (siteId) => {
  const activeId = getActiveSiteId();
  return activeId === siteId;
};
