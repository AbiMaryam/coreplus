// CorePlus — background service worker
// Manages license polling via chrome.alarms and routes messages from
// the popup and content scripts.

import { ALARM_NAME, CHECK_INTERVAL_MINUTES, getOrRefreshVerdict, refreshVerdict } from "./license";
import { broadcastToCoretaxTabs } from "./toggle-broadcast";
import {
  clearLicense,
  getEnabled,
  getLicenseCode,
  setEnabled as setEnabledInStorage,
  setLicenseCode,
} from "../lib/storage";

// --- Lifecycle ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });
  refreshVerdict()
    .then((verdict) => pushVerdictToTabs(verdict))
    .catch(console.error);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    refreshVerdict()
      .then((verdict) => pushVerdictToTabs(verdict))
      .catch(console.error);
  }
});

// --- Message router ---

type MessageRequest =
  | { type: "getVerdict" }
  | { type: "checkLicense" }
  | { type: "setCode"; code: string }
  | { type: "clearLicense" }
  | { type: "getEnabled" }
  | { type: "setEnabled"; enabled: boolean };

chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  handle(message)
    .then((response) => sendResponse(response))
    .catch((err) => {
      console.error("[CorePlus SW] message handler error:", err);
      sendResponse({ error: String(err) });
    });
  return true; // async
});

async function handle(message: MessageRequest): Promise<Record<string, unknown>> {
  switch (message.type) {
    case "getVerdict": {
      const verdict = await getOrRefreshVerdict();
      return { verdict };
    }

    case "checkLicense": {
      const verdict = await refreshVerdict();
      return { verdict };
    }

    case "setCode": {
      await setLicenseCode(message.code);
      const verdict = await refreshVerdict();
      await pushVerdictToTabs(verdict);
      return { verdict };
    }

    case "clearLicense": {
      await clearLicense();
      const verdict = { active: false, tier: "free" as const, checkedAt: Date.now() };
      await pushVerdictToTabs(verdict);
      return { verdict };
    }

    case "getEnabled": {
      const enabled = await getEnabled();
      return { enabled };
    }

    case "setEnabled": {
      await setEnabledInStorage(message.enabled);
      await broadcastToCoretaxTabs({ type: "coreplusToggleChanged", enabled: message.enabled });
      return { enabled: message.enabled };
    }

    default:
      return { error: "Unknown message type" };
  }
}

async function pushVerdictToTabs(verdict: unknown): Promise<void> {
  await broadcastToCoretaxTabs({ type: "coreplusVerdictUpdate", verdict });
}

// Re-check on startup (SW may have been dormant)
chrome.runtime.onStartup.addListener(() => {
  refreshVerdict()
    .then((verdict) => pushVerdictToTabs(verdict))
    .catch(console.error);
});

export {};
