/**
 * Utility functions for formatting display values
 */

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export const capitalizeFirst = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Converts API gender value to display format
 * API: "male" -> Display: "Male"
 */
export const formatGenderForDisplay = (gender: string | null | undefined): string => {
    if (!gender) return '';
    return capitalizeFirst(gender);
};

/**
 * Converts display gender value to API format
 * Display: "Male" -> API: "male"
 */
export const formatGenderForApi = (gender: string | null | undefined): string => {
    if (!gender) return '';
    return gender.toLowerCase();
};

/**
 * Formats blood group for display (already in correct format)
 */
export const formatBloodGroupForDisplay = (bloodGroup: string | null | undefined): string => {
    return bloodGroup || '';
};

/**
 * Generic formatter for select options
 * Converts lowercase API values to Title Case for display
 */
export const formatSelectOption = (value: string | null | undefined): string => {
    if (!value) return '';
    return value
        .split(' ')
        .map(word => capitalizeFirst(word))
        .join(' ');
};
/**
 * Formats a date string (YYYY-MM-DD) for user-friendly display (e.g., Oct 24, 1995)
 */
export const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString || '';
    }
};

/**
 * Formats a Date object to API format (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
};
