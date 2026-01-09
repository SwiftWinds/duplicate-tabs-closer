"use strict";

import { getStoredOptions } from "./helper.js";
import { setStoredOption, registerPanel } from "./options.js";
import { requestDuplicateTabsFromPanel, closeDuplicateTabs } from "./worker.js";

const handleMessage = (message, sender, response) => {
    switch (message.action) {
        case "setStoredOption": {
            setStoredOption(message.data.name, message.data.value, message.data.refresh);
            break;
        }
        case "getStoredOptions": {
            getStoredOptions().then(storedOptions => response({ data: storedOptions }));
            return true;
        }
        case "getDuplicateTabs": {
            requestDuplicateTabsFromPanel(message.data.windowId);
            break;
        }
        case "closeDuplicateTabs": {
            closeDuplicateTabs(message.data.windowId);
            break;
        }
    }
};

// Set up message listeners
export const setupMessageListeners = () => {
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Handle panel connections for service worker compatibility
    chrome.runtime.onConnect.addListener((port) => {
        if (port.name === "panel") {
            registerPanel(port);
        }
    });
};
