"use strict";

import { getTabs } from "./helper.js";

class TabsInfo {

    constructor() {
        this.tabs = new Map();
        this.nbDuplicateTabs = new Map();
    }

    async initialize() {
        const openedTabs = await getTabs({ windowType: "normal" });
        if (openedTabs) {
            for (const openedTab of openedTabs) {
                this.setOpenedTab(openedTab);
            }
        }
    }

    setNewTab(tabId) {
        const tab = { url: null, lastComplete: null, ignored: false };
        this.tabs.set(tabId, tab);
    }

    setOpenedTab(openedTab) {
        const tab = { url: openedTab.url, lastComplete: Date.now(), ignored: false };
        this.tabs.set(openedTab.id, tab);
    }

    ignoreTab(tabId, state) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.ignored = state;
            this.tabs.set(tabId, tab);
        }
    }

    isIgnoredTab(tabId) {
        const tab = this.tabs.get(tabId);
        return (!tab || tab.ignored) ? true : false;
    }

    getLastComplete(tabId) {
        const tab = this.tabs.get(tabId);
        return tab ? tab.lastComplete : null;
    }

    updateTab(openedTab) {
        const tab = this.tabs.get(openedTab.id);
        if (tab) {
            tab.url = openedTab.url;
            tab.lastComplete = Date.now();
            this.tabs.set(openedTab.id, tab);
        }
    }

    resetTab(tabId) {
        this.setNewTab(tabId);
    }

    hasUrlChanged(openedTab) {
        const tab = this.tabs.get(openedTab.id);
        return tab ? tab.url !== openedTab.url : true;
    }

    removeTab(tabId) {
        this.tabs.delete(tabId);
    }

    hasTab(tabId) {
        return this.tabs.has(tabId);
    }

    hasDuplicateTabs(windowId) {
        // Even nothing set, return true so it will force the refresh and set the badge.
        return this.nbDuplicateTabs.get(windowId) !== "0";
    }

    getNbDuplicateTabs(windowId) {
        return this.nbDuplicateTabs.get(windowId) || "0";
    }

    setNbDuplicateTabs(windowId, nbDuplicateTabs) {
        this.nbDuplicateTabs.set(windowId, nbDuplicateTabs.toString());
    }

    clearDuplicateTabsInfo(windowId) {
        if (this.nbDuplicateTabs.has(windowId)) this.nbDuplicateTabs.delete(windowId);
    }

}

export const tabsInfo = new TabsInfo();
