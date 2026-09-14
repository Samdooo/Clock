/**
 * core/state.js
 * Manages all application settings and localStorage persistence.
 * Emits events when state changes so the UI can update automatically.
 */

const STORAGE_KEY = 'peioclock_settings';

// The deeply expanded configuration
const DEFAULT_STATE = {
    // Global
    activeApp: 'clock',      
    theme: 'dark',           
    
    // Clock Settings
    clockFormat: 24,         
    clockShowSeconds: true,
    clockLeadingZero: true,
    clockBlinkingColon: false,

    // Stopwatch Settings
    swMsPrecision: 2,        // 0 (off), 1 (tenths), 2 (hundredths), 3 (thousandths)
    swForceHours: false,
    swLeadingZero: true,

    // Countdown Timer Settings
    cdMsPrecision: 0,        
    cdForceHours: false,
    cdLeadingZero: true,
    cdAutoRestart: false,

    // Pomodoro Settings
    pomoWorkTime: 25,        
    pomoShortBreak: 5,
    pomoLongBreak: 15,
    pomoSessionsBeforeLong: 4,
    pomoAutoStartBreak: false,
    pomoAutoStartWork: false
};

class StateManager extends EventTarget {
    constructor() {
        super();
        this.settings = { ...DEFAULT_STATE };
        this.load();
    }

    // Load from localStorage
    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge saved settings with defaults to ensure new features don't break old saves
                this.settings = { ...DEFAULT_STATE, ...parsed };
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
        }
    }

    // Save to localStorage
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }

    // Get a specific setting
    get(key) {
        return this.settings[key];
    }

    // Update a setting and notify the rest of the app
    set(key, value) {
        if (this.settings[key] !== value) {
            this.settings[key] = value;
            this.save();
            
            // Dispatch a custom event detailing what changed
            const event = new CustomEvent('stateChange', { 
                detail: { key, value } 
            });
            this.dispatchEvent(event);
        }
    }

    // Completely reset to defaults
    reset() {
        this.settings = { ...DEFAULT_STATE };
        this.save();
        this.dispatchEvent(new CustomEvent('stateChange', { detail: { key: 'all' }}));
    }
}

// Export a single instance (Singleton pattern) to be used across the app
export const state = new StateManager();