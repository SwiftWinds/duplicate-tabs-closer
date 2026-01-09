"use strict";

// Helper functions for popup and option pages (non-module scripts)
// These pages need to communicate with the service worker via messages

const getActiveWindowId = () => new Promise((resolve) => {
    chrome.windows.getLastFocused(null, window => {
        if (chrome.runtime.lastError) console.error("getActiveWindowId error:", chrome.runtime.lastError.message);
        resolve(chrome.runtime.lastError ? null : window.id);
    });
});

const focusTab = (tabId, windowId) => Promise.all([
    new Promise((resolve, reject) => {
        chrome.tabs.update(tabId, { active: true }, () => {
            if (chrome.runtime.lastError) {
                console.error("activateTab error:", chrome.runtime.lastError.message);
                reject();
            }
            else resolve();
        });
    }),
    new Promise((resolve, reject) => {
        chrome.windows.update(windowId, { focused: true }, () => {
            if (chrome.runtime.lastError) {
                console.error("activateWindow error:", chrome.runtime.lastError.message);
                reject();
            }
            else resolve();
        });
    })
]);

const removeTab = (tabId) => new Promise((resolve, reject) => {
    chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
            console.error("removeTab error:", chrome.runtime.lastError.message);
            reject();
        }
        else resolve();
    });
});

const sendMessage = (action, data) => new Promise((resolve, reject) => {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
    chrome.runtime.sendMessage({ action: action, data: data }, response => {
        if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                resolve();
            } else {
                reject(chrome.runtime.lastError);
            }
        }
        else {
            resolve(response);
        }
    });
});

const areSameArrays = (array1, array2) => {
    if (!array1 && !array2) {
        return true;
    }
    if (!array1 || !array2) {
        return false;
    }
    return JSON.stringify(array1) === JSON.stringify(array2);
};

// Connect to the background service worker to register as an active panel
// This is needed for MV3 since chrome.extension.getViews() doesn't work in service workers
let panelPort = null;

const connectToBackground = () => {
    panelPort = chrome.runtime.connect({ name: "panel" });
    panelPort.onDisconnect.addListener(() => {
        // Reconnect if disconnected (service worker may have been suspended)
        setTimeout(connectToBackground, 100);
    });
};

// Connect immediately when script loads
connectToBackground();
