/**
 * apps/pomodoro.js
 * A productivity timer alternating between Work and Break phases.
 */
import { state } from '../core/state.js';
import { formatDuration } from '../utils/time-format.js';
import { WakeLockService } from '../services/wakelock.js';

export class PomodoroApp {
    constructor(timeDisplay, controlsContainer) {
        this.timeDisplay = timeDisplay;
        this.controlsContainer = controlsContainer;
        this.animationId = null;
        this.isRunning = false;
        
        this.phase = 'work'; 
        this.sessionCount = 1;
        this.remainingTime = 0;
        this.endTime = 0;
        
        this.tick = this.tick.bind(this);
        this.toggle = this.toggle.bind(this);
        this.reset = this.reset.bind(this);
        this.skip = this.skip.bind(this);
    }

    init() {
        this.renderControls();
        this.loadPhaseTime();
    }

    renderControls() {
        this.controlsContainer.innerHTML = `
            <div style="display: flex; gap: var(--spacing-lg); justify-content: center; width: 100%;">
                <button id="pomo-reset" class="control-btn">Reset</button>
                <button id="pomo-toggle" class="control-btn primary">Start</button>
                <button id="pomo-skip" class="control-btn">Skip</button>
            </div>
            <div id="pomo-status" style="width: 100%; text-align: center; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85rem; white-space: nowrap;">
                Work
            </div>
        `;
        this.statusDisplay = document.getElementById('pomo-status');
        this.btnToggle = document.getElementById('pomo-toggle');
        this.btnReset = document.getElementById('pomo-reset');
        this.btnSkip = document.getElementById('pomo-skip');

        this.btnToggle.addEventListener('click', this.toggle);
        this.btnReset.addEventListener('click', this.reset);
        this.btnSkip.addEventListener('click', this.skip);
    }

    onStateChange(key, value) {
        if (!this.isRunning) {
            if (key === 'pomoWorkTime' || key === 'pomoShortBreak' || key === 'pomoLongBreak') {
                this.loadPhaseTime();
            } else {
                this.updateDisplay(this.remainingTime);
            }
        }
    }

    loadPhaseTime() {
        let mins;
        if (this.phase === 'work') {
            mins = state.get('pomoWorkTime');
        } else {
            if (this.sessionCount === state.get('pomoSessionsBeforeLong')) {
                mins = state.get('pomoLongBreak');
            } else {
                mins = state.get('pomoShortBreak');
            }
        }
        
        this.remainingTime = mins * 60 * 1000;
        this.updateDisplay(this.remainingTime);
        this.updateStatus();
    }

    updateStatus() {
        let phaseName;
        const totalSessions = state.get('pomoSessionsBeforeLong');

        if (this.phase === 'work') {
            phaseName = 'Work';
            this.statusDisplay.style.color = 'var(--text-secondary)';
        } else {
            const isLong = this.sessionCount === totalSessions;
            phaseName = isLong ? 'Long Break' : 'Short Break';
            this.statusDisplay.style.color = isLong ? '#a9e34b' : '#4dabf7'; 
        }
        
        this.statusDisplay.textContent = `${phaseName} — Session ${this.sessionCount} of ${totalSessions}`;
    }

    toggle() {
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.animationId);
            this.btnToggle.textContent = 'Start';
            WakeLockService.release(); 
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.endTime = performance.now() + this.remainingTime;
        this.btnToggle.textContent = 'Pause';
        WakeLockService.acquire(); 
        this.tick();
    }

    reset() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        this.phase = 'work';
        this.sessionCount = 1;
        this.loadPhaseTime();
        this.btnToggle.textContent = 'Start';
        WakeLockService.release();
    }

    skip() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        WakeLockService.release(); 
        this.handlePhaseTransition();
    }

    tick() {
        if (!this.isRunning) return;
        const now = performance.now();
        this.remainingTime = Math.max(0, this.endTime - now);
        this.updateDisplay(this.remainingTime);

        if (this.remainingTime === 0) {
            this.complete();
        } else {
            this.animationId = requestAnimationFrame(this.tick);
        }
    }

    complete() {
        this.isRunning = false;
        WakeLockService.release(); 
        
        document.body.style.backgroundColor = this.phase === 'work' ? '#4dabf7' : '#2ecc71';
        setTimeout(() => document.body.style.backgroundColor = '', 1000);

        this.handlePhaseTransition();
    }

    handlePhaseTransition() {
        if (this.phase === 'work') {
            this.phase = 'break';
        } else {
            this.phase = 'work';
            if (this.sessionCount >= state.get('pomoSessionsBeforeLong')) {
                this.sessionCount = 1;
            } else {
                this.sessionCount++;
            }
        }
        
        this.loadPhaseTime();
        this.btnToggle.textContent = 'Start';

        const shouldAutoStart = this.phase === 'work' 
            ? state.get('pomoAutoStartWork') 
            : state.get('pomoAutoStartBreak');
            
        if (shouldAutoStart) {
            this.startTimer(); 
        }
    }

    updateDisplay(ms) {
        const options = { msDigits: 0, forceHours: ms >= 3600000, leadingZero: true };
        this.timeDisplay.textContent = formatDuration(ms, options);
    }

    destroy() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.controlsContainer.innerHTML = '';
        this.statusDisplay = null;
        WakeLockService.release();
    }
}