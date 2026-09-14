/**
 * services/title.js
 * Automatically updates the browser tab title to match the main time display.
 * Uses a MutationObserver to keep this logic 100% decoupled from the apps.
 */
export function initTitleSync(timeDisplayElement) {
    const baseTitle = 'Peio Clock';
    
    // Create an observer instance linked to a callback function
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            // If the text inside the time display changed
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const currentTime = timeDisplayElement.textContent;
                document.title = `${currentTime} | ${baseTitle}`;
            }
        }
    });

    // Start observing the target node for text mutations
    observer.observe(timeDisplayElement, { 
        childList: true, 
        characterData: true, 
        subtree: true 
    });
}