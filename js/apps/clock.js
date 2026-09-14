/**
 * apps/clock.js
 * The standard time-telling application.
 */
import { state } from '../core/state.js';
import { formatClock } from '../utils/time-format.js';
import { WakeLockService } from '../services/wakelock.js';

export class ClockApp {
    constructor(timeDisplay, controlsContainer) {
        this.timeDisplay = timeDisplay;
        this.controlsContainer = controlsContainer;
        this.animationId = null;
        this.tick = this.tick.bind(this);
    }

    init() {
        this.controlsContainer.innerHTML = '';
        WakeLockService.acquire(); 
        this.tick();
    }

    // Required by the main.js router for completeness. 
    // The clock relies on requestAnimationFrame and redraws every frame anyway, 
    // so it natively responds to state changes instantly.
    onStateChange(key, value) {
        // No manual redraw needed
    }

    tick() {
        const now = new Date();
        const options = {
            format12: state.get('clockFormat') === 12,
            showSeconds: state.get('clockShowSeconds'),
            leadingZero: state.get('clockLeadingZero'),
            blinkingColon: state.get('clockBlinkingColon')
        };

        this.timeDisplay.textContent = formatClock(now, options);
        this.animationId = requestAnimationFrame(this.tick);
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        WakeLockService.release(); 
    }
}