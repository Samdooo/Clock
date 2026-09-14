/**
 * main.js
 * Application entry point. Wires up state, UI interactions, and routing.
 */
import { state } from './core/state.js';
import { initSettings } from './core/settings.js';
import { initTitleSync } from './services/title.js';
import { ClockApp } from './apps/clock.js';
import { StopwatchApp } from './apps/stopwatch.js';
import { CountdownApp } from './apps/countdown.js';
import { PomodoroApp } from './apps/pomodoro.js';

// DOM Elements
const timeDisplay = document.getElementById('main-time');
const controlsContainer = document.getElementById('main-controls');
const navButtons = document.querySelectorAll('.nav-btn');
const body = document.body;

// App Registry
const apps = {
    clock: ClockApp,
    stopwatch: StopwatchApp,
    countdown: CountdownApp,
    pomodoro: PomodoroApp
};

let currentAppInstance = null;

// Initialize App
function init() {
    applyTheme(state.get('theme'));
    initSettings();
    initTitleSync(timeDisplay);

    state.addEventListener('stateChange', (e) => {
        const { key, value } = e.detail;
        
        if (key === 'theme') {
            applyTheme(value);
        } else if (key === 'activeApp') {
            switchApp(value);
        } else if (currentAppInstance && typeof currentAppInstance.onStateChange === 'function') {
            // Forward setting changes directly to the active app so it can re-render if it's paused
            currentAppInstance.onStateChange(key, value);
        }
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const appName = e.target.getAttribute('data-app');
            state.set('activeApp', appName);
        });
    });

    setupIdleFade();
    switchApp(state.get('activeApp'));
}

function applyTheme(theme) {
    if (theme === 'light') {
        body.classList.add('theme-light');
    } else {
        body.classList.remove('theme-light');
    }
}

function switchApp(appName) {
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-app') === appName);
    });

    if (currentAppInstance) {
        currentAppInstance.destroy();
        currentAppInstance = null;
    }

    const AppClass = apps[appName];
    if (AppClass) {
        currentAppInstance = new AppClass(timeDisplay, controlsContainer);
        currentAppInstance.init();
    } else {
        timeDisplay.textContent = '00:00';
        controlsContainer.innerHTML = '';
    }
}

function setupIdleFade() {
    let idleTimer;
    const resetIdle = () => {
        body.classList.remove('idle');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => body.classList.add('idle'), 3000);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    resetIdle(); 
}

document.addEventListener('DOMContentLoaded', init);