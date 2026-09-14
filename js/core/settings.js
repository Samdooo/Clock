/**
 * core/settings.js
 * Manages the settings DOM panel and syncs inputs with the StateManager.
 * Now fully context-aware: only shows settings relevant to the active app.
 */
import { state } from './state.js';

export function initSettings() {
    // --- 1. DOM Elements ---
    
    // UI Elements
    const panel = document.getElementById('settings-panel');
    const backdrop = document.getElementById('settings-backdrop');
    const btnOpen = document.getElementById('settings-toggle');
    const btnClose = document.getElementById('settings-close');
    const appGroups = document.querySelectorAll('.app-setting-group'); // All contextual sections

    // Inputs: Global
    const themeSelect = document.getElementById('setting-theme');

    // Inputs: Clock
    const clockFormat = document.getElementById('setting-clock-format');
    const clockSeconds = document.getElementById('setting-clock-seconds');
    const clockZero = document.getElementById('setting-clock-zero');
    const clockBlink = document.getElementById('setting-clock-blink');

    // Inputs: Stopwatch
    const swMs = document.getElementById('setting-sw-ms');
    const swForceHours = document.getElementById('setting-sw-force-hours');
    const swZero = document.getElementById('setting-sw-zero');

    // Inputs: Countdown
    const cdMs = document.getElementById('setting-cd-ms');
    const cdForceHours = document.getElementById('setting-cd-force-hours');
    const cdZero = document.getElementById('setting-cd-zero');
    const cdRestart = document.getElementById('setting-cd-restart');

    // Inputs: Pomodoro
    const pomoWork = document.getElementById('setting-pomo-work');
    const pomoShort = document.getElementById('setting-pomo-short');
    const pomoLong = document.getElementById('setting-pomo-long');
    const pomoSessions = document.getElementById('setting-pomo-sessions');
    const pomoAutoBreak = document.getElementById('setting-pomo-auto-break');
    const pomoAutoWork = document.getElementById('setting-pomo-auto-work');


    // --- 2. Initialize UI with Current State ---
    
    themeSelect.value = state.get('theme');

    clockFormat.value = state.get('clockFormat').toString();
    clockSeconds.checked = state.get('clockShowSeconds');
    clockZero.checked = state.get('clockLeadingZero');
    clockBlink.checked = state.get('clockBlinkingColon');

    swMs.value = state.get('swMsPrecision').toString();
    swForceHours.checked = state.get('swForceHours');
    swZero.checked = state.get('swLeadingZero');

    cdMs.value = state.get('cdMsPrecision').toString();
    cdForceHours.checked = state.get('cdForceHours');
    cdZero.checked = state.get('cdLeadingZero');
    cdRestart.checked = state.get('cdAutoRestart');

    pomoWork.value = state.get('pomoWorkTime');
    pomoShort.value = state.get('pomoShortBreak');
    pomoLong.value = state.get('pomoLongBreak');
    pomoSessions.value = state.get('pomoSessionsBeforeLong');
    pomoAutoBreak.checked = state.get('pomoAutoStartBreak');
    pomoAutoWork.checked = state.get('pomoAutoStartWork');


    // --- 3. Context-Aware Logic ---
    
    // Shows only the setting group that matches the active app
    const updateVisibleGroups = (activeAppName) => {
        appGroups.forEach(group => {
            if (group.dataset.appGroup === activeAppName) {
                group.classList.add('active');
            } else {
                group.classList.remove('active');
            }
        });
    };

    // Set initial visibility on load
    updateVisibleGroups(state.get('activeApp'));

    // Listen globally: If the app switches, instantly update the settings UI context
    state.addEventListener('stateChange', (e) => {
        if (e.detail.key === 'activeApp') {
            updateVisibleGroups(e.detail.value);
        }
    });


    // --- 4. Open / Close Logic ---
    
    const openSettings = () => {
        panel.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeSettings = () => {
        panel.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
    };

    btnOpen.addEventListener('click', openSettings);
    btnClose.addEventListener('click', closeSettings);
    backdrop.addEventListener('click', closeSettings); // Close if clicking blurred backdrop

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            closeSettings();
        }
    });


    // --- 5. Bind Inputs to State Updates ---
    
    // Global
    themeSelect.addEventListener('change', e => state.set('theme', e.target.value));

    // Clock
    clockFormat.addEventListener('change', e => state.set('clockFormat', parseInt(e.target.value, 10)));
    clockSeconds.addEventListener('change', e => state.set('clockShowSeconds', e.target.checked));
    clockZero.addEventListener('change', e => state.set('clockLeadingZero', e.target.checked));
    clockBlink.addEventListener('change', e => state.set('clockBlinkingColon', e.target.checked));

    // Stopwatch
    swMs.addEventListener('change', e => state.set('swMsPrecision', parseInt(e.target.value, 10)));
    swForceHours.addEventListener('change', e => state.set('swForceHours', e.target.checked));
    swZero.addEventListener('change', e => state.set('swLeadingZero', e.target.checked));

    // Countdown
    cdMs.addEventListener('change', e => state.set('cdMsPrecision', parseInt(e.target.value, 10)));
    cdForceHours.addEventListener('change', e => state.set('cdForceHours', e.target.checked));
    cdZero.addEventListener('change', e => state.set('cdLeadingZero', e.target.checked));
    cdRestart.addEventListener('change', e => state.set('cdAutoRestart', e.target.checked));

    // Pomodoro (Helper to ensure numbers are valid)
    const updateNum = (key, val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num > 0) state.set(key, num);
    };
    
    pomoWork.addEventListener('change', e => updateNum('pomoWorkTime', e.target.value));
    pomoShort.addEventListener('change', e => updateNum('pomoShortBreak', e.target.value));
    pomoLong.addEventListener('change', e => updateNum('pomoLongBreak', e.target.value));
    pomoSessions.addEventListener('change', e => updateNum('pomoSessionsBeforeLong', e.target.value));
    pomoAutoBreak.addEventListener('change', e => state.set('pomoAutoStartBreak', e.target.checked));
    pomoAutoWork.addEventListener('change', e => state.set('pomoAutoStartWork', e.target.checked));
}