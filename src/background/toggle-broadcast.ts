// CorePlus — broadcast toggle/verdict changes to all Coretax tabs

const CORETAX_URL_PATTERN = "*://coretaxdjp.pajak.go.id/*";

export async function broadcastToCoretaxTabs(message: Record<string, unknown>): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: CORETAX_URL_PATTERN });
    await Promise.all(
      tabs.map((tab) =>
        chrome.tabs.sendMessage(tab.id!, message).catch(() => {
          // tab may not have the content script loaded — ignore
        }),
      ),
    );
  } catch (err) {
    console.error("[CorePlus] broadcast failed:", err);
  }
}
