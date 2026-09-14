/**
 * utils/time-format.js
 * Pure functions for formatting time strings based on user preferences.
 */

// Simple helper to pad numbers with leading zeros
const pad = (num, length = 2) => String(num).padStart(length, '0');

/**
 * Formats a Date object into a clock string.
 * @param {Date} date 
 * @param {Object} options - { format12, showSeconds, leadingZero, blinkingColon }
 */
export function formatClock(date, options = {}) {
    const {
        format12 = false,
        showSeconds = true,
        leadingZero = true,
        blinkingColon = false
    } = options;

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    
    let ampm = '';

    if (format12) {
        ampm = hours >= 12 ? ' PM' : '';
        hours = hours % 12 || 12; // Convert 0 (midnight) to 12
    }

    const hStr = leadingZero ? pad(hours) : String(hours);
    const mStr = pad(minutes);
    const sStr = pad(seconds);

    // Blinking Colon Logic: 500ms on, 500ms off
    // We use a space to maintain the layout width in monospaced fonts
    const separator = (blinkingColon && milliseconds >= 500) ? ' ' : ':';

    let result = `${hStr}${separator}${mStr}`;
    
    if (showSeconds) {
        result += `${separator}${sStr}`;
    }

    return result + ampm;
}

/**
 * Formats raw milliseconds into a duration string (for Stopwatch/Timer).
 * @param {number} ms - Total milliseconds
 * @param {Object} options - { msDigits: number(0-3), forceHours: bool, leadingZero: bool }
 */
export function formatDuration(ms, options = {}) {
    const {
        msDigits = 0, // 0 = off, 1 = tenths, 2 = hundredths, 3 = thousandths
        forceHours = false,
        leadingZero = true
    } = options;

    // Ensure we don't operate on negative time.
    // CRITICAL FIX: Math.floor guarantees we are working with clean integers,
    // preventing floating-point decimals from leaking into the string padding logic!
    const safeMs = Math.floor(Math.max(0, ms));

    const totalSeconds = Math.floor(safeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const remainderMs = safeMs % 1000;

    let result = '';

    // 1. Hours
    const showHours = hours > 0 || forceHours;
    if (showHours) {
        result += `${pad(hours)}:`;
    }

    // 2. Minutes
    // If hours are shown, minutes MUST be padded (e.g. 1:05:30).
    // Otherwise, respect the user's leading zero setting.
    const mStr = (showHours || leadingZero) ? pad(minutes) : String(minutes);
    result += `${mStr}:`;

    // 3. Seconds
    result += pad(seconds);

    // 4. Milliseconds
    if (msDigits > 0) {
        // Because remainderMs is now strictly an integer, padding and slicing works perfectly.
        const msStr = pad(remainderMs, 3).substring(0, msDigits);
        result += `.${msStr}`;
    }

    return result;
}