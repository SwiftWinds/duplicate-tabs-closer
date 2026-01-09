"use strict";

import { getPlatformInfo, getStoredOptions, saveStoredOptions } from "./helper.js";

const defaultOptions = {
    shrunkMode: {
        value: false
    },
    onDuplicateTabDetected: {
        value: "N"
    },
    onRemainingTab: {
        value: "A"
    },
    keepTabBasedOnAge: {
        value: "O"
    },
    keepTabWithHttps: {
        value: true
    },
    keepPinnedTab: {
        value: true
    },
    keepTabWithHistory: {
        value: false
    },
    scope: {
        value: "C"
    },
    ignoreHashPart: {
        value: false
    },
    ignoreSearchPart: {
        value: false
    },
    ignorePathPart: {
        value: false
    },
    ignore3w: {
        value: false
    },
    caseInsensitive: {
        value: false
    },
    compareWithTitle: {
        value: false
    },
    onDuplicateTabDetectedPinned: {
        value: true
    },
    tabPriorityPinned: {
        value: true
    },
    matchingRulesPinned: {
        value: true
    },
    scopePinned: {
        value: true
    },
    customizationPinned: {
        value: true
    },
    whiteList: {
        value: ""
    },
    blackList: {
        value: ""
    },
    badgeColorDuplicateTabs: {
        value: "#f22121"
    },
    badgeColorNoDuplicateTabs: {
        value: "#1e90ff"
    },
    showBadgeIfNoDuplicateTabs: {
        value: true
    },
    closePopup: {
        value: false
    },
    environment: {
        value: "firefox"
    }
};

const setupDefaultOptions = async () => {
    const env = await getEnvironment();
    const opts = Object.assign({}, defaultOptions);
    opts.environment.value = env;
    return opts;
};

const getEnvironment = async () => {
    const info = await getPlatformInfo();
    const env = (info.os === "android") ? "android" : (typeof InstallTrigger !== "undefined") ? "firefox" : "chrome";
    return env;
};

const getNotInReferenceKeys = (referenceKeys, keys) => {
    const setKeys = new Set(keys);
    return Array.from(referenceKeys).filter(key => !setKeys.has(key));
};

// Late binding functions - will be set after worker.js loads
let _refreshGlobalDuplicateTabsInfo = null;
let _setBadgeIcon = null;
let _updateBadgeStyle = null;

export const setRefreshGlobalDuplicateTabsInfo = (fn) => { _refreshGlobalDuplicateTabsInfo = fn; };
export const setSetBadgeIcon = (fn) => { _setBadgeIcon = fn; };
export const setUpdateBadgeStyle = (fn) => { _updateBadgeStyle = fn; };

export const initializeOptions = async () => {
    const optionsResult = await getStoredOptions();
    let storedOptions = optionsResult.storedOptions;
    if (Object.keys(storedOptions).length === 0) {
        const intialOptions = await setupDefaultOptions();
        storedOptions = await saveStoredOptions(intialOptions);
    } else {
        const storedKeys = Object.keys(storedOptions).sort();
        const defaultKeys = Object.keys(defaultOptions).sort();
        if (JSON.stringify(storedKeys) != JSON.stringify(defaultKeys)) {
            const obsoleteKeys = getNotInReferenceKeys(storedKeys, defaultKeys);
            obsoleteKeys.forEach(key => delete storedOptions[key]);
            const missingKeys = getNotInReferenceKeys(defaultKeys, storedKeys);
            missingKeys.forEach(key => storedOptions[key] = { value: defaultOptions[key].value });
            const env = await getEnvironment();
            storedOptions.environment.value = env;
            storedOptions = await saveStoredOptions(storedOptions, true);
        }
    }
    setOptions(storedOptions);
    setEnvironment(storedOptions);
};

export const setStoredOption = async (name, value, refresh) => {
    const optionsResult = await getStoredOptions();
    const storedOptions = optionsResult.storedOptions;
    storedOptions[name].value = value;
    saveStoredOptions(storedOptions);
    setOptions(storedOptions);
    if (refresh && _refreshGlobalDuplicateTabsInfo) _refreshGlobalDuplicateTabsInfo();
    else if (name === "onDuplicateTabDetected" && _setBadgeIcon) _setBadgeIcon();
    else if ((name === "showBadgeIfNoDuplicateTabs" || name === "badgeColorNoDuplicateTabs" || name === "badgeColorDuplicateTabs") && _updateBadgeStyle) _updateBadgeStyle();
};

export const options = {};

const setOptions = (storedOptions) => {
    options.autoCloseTab = storedOptions.onDuplicateTabDetected.value === "A";
    options.defaultTabBehavior = storedOptions.onRemainingTab.value === "B";
    options.activateKeptTab = storedOptions.onRemainingTab.value === "A";
    options.keepNewerTab = storedOptions.keepTabBasedOnAge.value === "N";
    options.keepReloadOlderTab = storedOptions.keepTabBasedOnAge.value === "R";
    options.keepTabWithHttps = storedOptions.keepTabWithHttps.value;
    options.keepPinnedTab = storedOptions.keepPinnedTab.value;
    options.ignoreHashPart = storedOptions.ignoreHashPart.value;
    options.ignoreSearchPart = storedOptions.ignoreSearchPart.value;
    options.ignorePathPart = storedOptions.ignorePathPart.value;
    options.compareWithTitle = storedOptions.compareWithTitle.value;
    options.ignore3w = storedOptions.ignore3w.value;
    options.caseInsensitive = storedOptions.caseInsensitive.value;
    options.searchInAllWindows = storedOptions.scope.value === "A" || storedOptions.scope.value === "CA";
    options.searchPerContainer = storedOptions.scope.value === "CC" || storedOptions.scope.value === "CA";
    options.whiteList = whiteListToPattern(storedOptions.whiteList.value);
    options.badgeColorDuplicateTabs = storedOptions.badgeColorDuplicateTabs.value;
    options.badgeColorNoDuplicateTabs = storedOptions.badgeColorNoDuplicateTabs.value;
    options.showBadgeIfNoDuplicateTabs = storedOptions.showBadgeIfNoDuplicateTabs.value;
};

export const environment = {
    isAndroid: false,
    isFirefox: false,
    isChrome: false
};

const setEnvironment = (storedOptions) => {
    if (storedOptions.environment.value === "android") {
        environment.isAndroid = true;
        environment.isFirefox = false;
        environment.isChrome = false;
    } else if (storedOptions.environment.value === "firefox") {
        environment.isAndroid = false;
        environment.isFirefox = true;
        environment.isChrome = false;
    }
    else if (storedOptions.environment.value === "chrome") {
        environment.isAndroid = false;
        environment.isFirefox = false;
        environment.isChrome = true;
    }
};

// Track connected popup/options panels for service worker compatibility
// In MV3, chrome.extension.getViews() is not available in service workers
const connectedPanels = new Set();

export const registerPanel = (port) => {
    connectedPanels.add(port);
    port.onDisconnect.addListener(() => {
        connectedPanels.delete(port);
    });
};

export const isPanelOptionOpen = () => {
    return connectedPanels.size > 0;
};

const whiteListToPattern = (whiteList) => {
    const whiteListPatterns = new Set();
    const whiteListLines = whiteList.split("\n").map(line => line.trim());
    whiteListLines.forEach(whiteListLine => {
        if (!whiteListLine) return;
        const length = whiteListLine.length;
        let pattern = "^";
        for (let index = 0; index < length; index += 1) {
            const character = whiteListLine.charAt(index);
            pattern = (character === "*") ? `${pattern}.*` : pattern + character;
        }
        whiteListPatterns.add(new RegExp(`${pattern}$`));
    });
    return Array.from(whiteListPatterns);
};
