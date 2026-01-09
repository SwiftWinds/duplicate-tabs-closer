"use strict";

import { getActiveTabId, getWindows, setTabBadgeText, setTabBadgeBackgroundColor, setWindowBadgeText, setWindowBadgeBackgroundColor } from "./helper.js";
import { options, environment } from "./options.js";
import { tabsInfo } from "./tabsInfo.js";

export const setBadgeIcon = () => {
	chrome.action.setIcon({ path: options.autoCloseTab ? "images/auto_close_16.png" : "images/manual_close_16.png" });
	if (environment.isFirefox) {
		chrome.action.setBadgeTextColor({ color: "white" });
	}
};

export const setBadge = async (windowId, activeTabId) => {
	let nbDuplicateTabs = tabsInfo.getNbDuplicateTabs(windowId);
	if (nbDuplicateTabs === "0" && !options.showBadgeIfNoDuplicateTabs) nbDuplicateTabs = "";
	const backgroundColor = (nbDuplicateTabs !== "0") ? options.badgeColorDuplicateTabs : options.badgeColorNoDuplicateTabs;
	if (environment.isFirefox) {
		setWindowBadgeText(windowId, nbDuplicateTabs);
		setWindowBadgeBackgroundColor(windowId, backgroundColor);
	}
	else {
		activeTabId = activeTabId || await getActiveTabId(windowId);
		if (activeTabId) {
			setTabBadgeText(activeTabId, nbDuplicateTabs);
			setTabBadgeBackgroundColor(activeTabId, backgroundColor);
		}
	}
};

const getNbDuplicateTabs = (duplicateTabsGroups) => {
	let nbDuplicateTabs = 0;
	if (duplicateTabsGroups.size !== 0) {
		duplicateTabsGroups.forEach(duplicateTabs => (nbDuplicateTabs += duplicateTabs.size - 1));
	}
	return nbDuplicateTabs;
};

const updateBadgeValue = (nbDuplicateTabs, windowId) => {
	tabsInfo.setNbDuplicateTabs(windowId, nbDuplicateTabs);
	setBadge(windowId);
};

export const updateBadgesValue = async (duplicateTabsGroups, windowId) => {
	const nbDuplicateTabs = getNbDuplicateTabs(duplicateTabsGroups);
	if (options.searchInAllWindows) {
		const windows = await getWindows();
		if (windows) {
			windows.forEach(window => updateBadgeValue(nbDuplicateTabs, window.id));
		}
	}
	else {
		updateBadgeValue(nbDuplicateTabs, windowId);
	}
};

export const updateBadgeStyle = async () => {
	const windows = await getWindows();
	if (windows) {
		windows.forEach(window => setBadge(window.id));
	}
};
