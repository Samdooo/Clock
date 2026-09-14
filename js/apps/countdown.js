/**
 * apps/countdown.js
 * A precise reverse timer with quick-select presets, an inline custom time form, 
 * and auto-restart capability.
 */
import { state } from '../core/state.js';
import { formatDuration } from '../utils/time-format.js';
import { WakeLockService } from '../services/wakelock.js';

export class CountdownApp {
    constructor(timeDisplay, controlsContainer) {
        this.timeDisplay = timeDisplay;
        this.controlsContainer = controlsContainer;
        this.animationId = null;
        this.isRunning = false;
        
        this.defaultDuration = 5 * 60 * 1000; 
        this.remainingTime = this.defaultDuration; 
        this.endTime = 0;
        
        this.tick = this.tick.bind(this);
        this.toggle = this.toggle.bind(this);
        this.reset = this.reset.bind(this);
        this.setPreset = this.setPreset.bind(this);
    }

    init() {
        this.renderControls();
        this.updateDisplay(this.remainingTime);
    }

    renderControls() {
        this.controlsContainer.innerHTML = `
            <div style="display: flex; gap: var(--spacing-lg); justify-content: center; width: 100%; margin-bottom: var(--spacing-sm);">
                <button id="cd-reset" class="control-btn">Reset</button>
                <button id="cd-toggle" class="control-btn primary">Start</button>
            </div>
            
            <!-- Default Preset Row -->
            <div id="cd-preset-row" style="display: flex; gap: var(--spacing-sm); justify-content: center; width: 100%; align-items: center;">
                <button class="control-btn preset-btn" data-type="add" data-ms="60000">+1m</button>
                <button class="control-btn preset-btn" data-type="set" data-ms="300000">5m</button>
                <button class="control-btn preset-btn" data-type="set" data-ms="900000">15m</button>
                <button class="control-btn preset-btn" data-type="set" data-ms="1800000">30m</button>
                <button id="cd-custom-btn" class="control-btn preset-btn" aria-label="Custom Time" style="padding: 0.5rem 0.6rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            </div>

            <!-- Custom Exact Time Input Row (Hidden by Default) -->
            <div id="cd-custom-row" style="display: none; gap: var(--spacing-sm); justify-content: center; width: 100%; align-items: center; flex-wrap: wrap;">
                <div style="display: flex; align-items: baseline; gap: 0.2rem; color: var(--text-secondary);">
                    <input type="number" id="ct-h" class="time-input" placeholder="h" min="0" max="99">
                    <span>:</span>
                    <input type="number" id="ct-m" class="time-input" placeholder="m" min="0" max="59">
                    <span>:</span>
                    <input type="number" id="ct-s" class="time-input" placeholder="s" min="0" max="59">
                    <span>.</span>
                    <input type="number" id="ct-ms" class="time-input" placeholder="ms" min="0" max="999" style="width: 3.5rem;">
                </div>
                <button id="ct-set" class="control-btn preset-btn" style="margin-left: 0.5rem;">Set</button>
                <button id="ct-cancel" class="control-btn preset-btn">Cancel</button>
            </div>
        `;
        
        // Primary UI
        this.btnToggle = document.getElementById('cd-toggle');
        this.btnReset = document.getElementById('cd-reset');
        this.btnToggle.addEventListener('click', this.toggle);
        this.btnReset.addEventListener('click', this.reset);
        
        // Presets
        this.presetRow = document.getElementById('cd-preset-row');
        this.presetButtons = this.presetRow.querySelectorAll('.preset-btn[data-type]');
        this.presetButtons.forEach(btn => btn.addEventListener('click', this.setPreset));

        // Custom Form Interactions
        this.customRow = document.getElementById('cd-custom-row');
        this.customBtn = document.getElementById('cd-custom-btn');
        this.customSet = document.getElementById('ct-set');
        this.customCancel = document.getElementById('ct-cancel');
        
        this.inH = document.getElementById('ct-h');
        this.inM = document.getElementById('ct-m');
        this.inS = document.getElementById('ct-s');
        this.inMs = document.getElementById('ct-ms');

        // Open custom form
        this.customBtn.addEventListener('click', () => {
            if (this.isRunning) return;
            this.presetRow.style.display = 'none';
            this.customRow.style.display = 'flex';
            this.inM.focus(); // Focus minutes for quick typing
        });

        const hideCustomForm = () => {
            this.customRow.style.display = 'none';
            this.presetRow.style.display = 'flex';
            this.inH.value = ''; this.inM.value = ''; 
            this.inS.value = ''; this.inMs.value = '';
        };

        this.customCancel.addEventListener('click', hideCustomForm);

        const applyCustomTime = () => {
            const h = parseInt(this.inH.value || 0, 10);
            const m = parseInt(this.inM.value || 0, 10);
            const s = parseInt(this.inS.value || 0, 10);
            const ms = parseInt(this.inMs.value || 0, 10);
            
            const total = (h * 3600000) + (m * 60000) + (s * 1000) + ms;
            
            if (total > 0) {
                this.remainingTime = total;
                this.defaultDuration = total;
                this.updateDisplay(this.remainingTime);
            }
            hideCustomForm();
        };

        this.customSet.addEventListener('click', applyCustomTime);
        
        // Let user hit 'Enter' on any input to apply
        const handleEnter = (e) => { if (e.key === 'Enter') applyCustomTime(); };
        [this.inH, this.inM, this.inS, this.inMs].forEach(input => {
            input.addEventListener('keydown', handleEnter);
        });
    }

    onStateChange(key, value) {
        if (!this.isRunning) {
            this.updateDisplay(this.remainingTime);
        }
    }

    setPreset(e) {
        const btn = e.target;
        const type = btn.getAttribute('data-type');
        const ms = parseInt(btn.getAttribute('data-ms'), 10);
        
        if (this.isRunning && type !== 'add') return;

        if (type === 'add') {
            this.remainingTime += ms;
            this.defaultDuration += ms; 
            if (this.isRunning) this.endTime += ms;
        } else {
            this.remainingTime = ms;
            this.defaultDuration = ms;
        }
        this.updateDisplay(this.remainingTime);
    }

    toggle() {
        if (this.remainingTime <= 0 && !this.isRunning) return;
        
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.animationId);
            this.btnToggle.textContent = 'Start';
            this.togglePresets(false);
            WakeLockService.release(); 
        } else {
            // Safely close the custom editor if user hits Start while typing
            if (this.customRow.style.display === 'flex') {
                this.customCancel.click();
            }

            this.isRunning = true;
            this.endTime = performance.now() + this.remainingTime;
            this.btnToggle.textContent = 'Pause';
            this.togglePresets(true);
            WakeLockService.acquire(); 
            this.tick();
        }
    }

    reset() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        this.remainingTime = this.defaultDuration;
        this.updateDisplay(this.remainingTime);
        this.btnToggle.textContent = 'Start';
        this.togglePresets(false);
        WakeLockService.release();
    }

    tick() {
        if (!this.isRunning) return;
        const now = performance.now();
        this.remainingTime = Math.max(0, this.endTime - now);
        this.updateDisplay(this.remainingTime);

        if (this.remainingTime === 0) {
            document.body.style.backgroundColor = '#2ecc71'; 
            setTimeout(() => document.body.style.backgroundColor = '', 1000);

            if (state.get('cdAutoRestart')) {
                this.endTime += this.defaultDuration;
                this.animationId = requestAnimationFrame(this.tick);
            } else {
                this.complete();
            }
        } else {
            this.animationId = requestAnimationFrame(this.tick);
        }
    }

    complete() {
        this.isRunning = false;
        this.btnToggle.textContent = 'Start';
        this.togglePresets(false);
        this.remainingTime = this.defaultDuration;
        this.updateDisplay(this.remainingTime);
        WakeLockService.release(); 
    }

    updateDisplay(ms) {
        const options = {
            msDigits: state.get('cdMsPrecision'),
            forceHours: state.get('cdForceHours'),
            leadingZero: state.get('cdLeadingZero')
        };
        this.timeDisplay.textContent = formatDuration(ms, options);
    }

    togglePresets(disabled) {
        // Toggle time presets
        this.presetButtons.forEach(btn => {
            const isAddBtn = btn.getAttribute('data-type') === 'add';
            if (isAddBtn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            } else {
                btn.disabled = disabled;
                btn.style.opacity = disabled ? '0.3' : '1';
                btn.style.cursor = disabled ? 'default' : 'pointer';
            }
        });
        
        // Also toggle the Custom edit button
        if (this.customBtn) {
            this.customBtn.disabled = disabled;
            this.customBtn.style.opacity = disabled ? '0.3' : '1';
            this.customBtn.style.cursor = disabled ? 'default' : 'pointer';
        }
    }

    destroy() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.controlsContainer.innerHTML = '';
        WakeLockService.release();
    }
}