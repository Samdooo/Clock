/**
 * apps/stopwatch.js
 * A high-precision stopwatch with start, stop, and reset functionality.
 */
import { state } from '../core/state.js';
import { formatDuration } from '../utils/time-format.js';
import { WakeLockService } from '../services/wakelock.js';

export class StopwatchApp {
    constructor(timeDisplay, controlsContainer) {
        this.timeDisplay = timeDisplay;
        this.controlsContainer = controlsContainer;
        this.animationId = null;
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0; 
        
        this.tick = this.tick.bind(this);
        this.toggle = this.toggle.bind(this);
        this.reset = this.reset.bind(this);
    }

    init() {
        this.renderControls();
        this.updateDisplay(0);
    }

    renderControls() {
        this.controlsContainer.innerHTML = `
            <div style="display: flex; gap: var(--spacing-lg); justify-content: center; width: 100%;">
                <button id="sw-reset" class="control-btn" disabled>Reset</button>
                <button id="sw-toggle" class="control-btn primary">Start</button>
            </div>
        `;
        this.btnToggle = document.getElementById('sw-toggle');
        this.btnReset = document.getElementById('sw-reset');
        this.btnToggle.addEventListener('click', this.toggle);
        this.btnReset.addEventListener('click', this.reset);
    }

    onStateChange(key, value) {
        if (!this.isRunning) {
            this.updateDisplay(this.elapsedTime);
        }
    }

    toggle() {
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.animationId);
            this.btnToggle.textContent = 'Start';
            WakeLockService.release(); 
        } else {
            this.isRunning = true;
            this.startTime = performance.now() - this.elapsedTime;
            this.btnToggle.textContent = 'Pause';
            this.btnReset.disabled = false;
            WakeLockService.acquire(); 
            this.tick();
        }
    }

    reset() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        this.elapsedTime = 0;
        this.updateDisplay(0);
        this.btnToggle.textContent = 'Start';
        this.btnReset.disabled = true;
        WakeLockService.release();
    }

    tick() {
        if (!this.isRunning) return;
        const now = performance.now();
        this.elapsedTime = now - this.startTime;
        this.updateDisplay(this.elapsedTime);
        this.animationId = requestAnimationFrame(this.tick);
    }

    updateDisplay(ms) {
        const options = {
            msDigits: state.get('swMsPrecision'),
            forceHours: state.get('swForceHours'),
            leadingZero: state.get('swLeadingZero')
        };
        this.timeDisplay.textContent = formatDuration(ms, options);
    }

    destroy() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.controlsContainer.innerHTML = '';
        WakeLockService.release();
    }
}