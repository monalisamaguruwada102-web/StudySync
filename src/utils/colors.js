/**
 * Consistent color utility for modules
 */
const MODULE_COLORS = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#10b981', // Emerald
];

/**
 * Gets a consistent color based on a string index or ID
 * @param {string|number} identifier 
 * @returns {string} Hex color code
 */
export const getModuleColor = (identifier, index = 0) => {
    if (typeof identifier === 'number') {
        return MODULE_COLORS[identifier % MODULE_COLORS.length];
    }

    if (!identifier) return MODULE_COLORS[index % MODULE_COLORS.length];

    // Simple hash for string identifiers
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }

    return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length];
};

export const getAllModuleColors = () => MODULE_COLORS;
