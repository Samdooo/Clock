/**
 * services/wakelock.js
 * Prevents the device screen from sleeping while timers are active.
 */

let wakeLock = null;
let isRequested = false; // Tracks the "intended" state

export const WakeLockService = {
    async acquire() {
        isRequested = true;
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                
                wakeLock.addEventListener('release', () => {
                    // The browser can release this automatically if the user minimizes 
                    // the window or switches tabs. We just nullify our reference.
                    wakeLock = null;
                });
            } catch (err) {
                console.warn('Wake Lock error (App may sleep):', err.name, err.message);
            }
        }
    },
    
    async release() {
        isRequested = false;
        if (wakeLock !== null) {
            await wakeLock.release();
            wakeLock = null;
        }
    }
};

// Listen for tab visibility changes.
// If the user leaves the tab, the browser kills the wakelock. 
// When they return, if a timer is STILL running (isRequested = true), we must re-acquire it.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRequested) {
        WakeLockService.acquire();
    }
});