import { VideoId } from "./api";

async function getAllVideoTabs() {
  return await chrome.tabs.query({
    discarded: false,
    url: "https://www.youtube.com/watch*",
  });
}

export async function getTabsByVideoId() {
  const videos = await getAllVideoTabs();
  const tabs = videos.reduce((map, tab) => {
    if (!tab.url) {
      return map;
    }
    map[new URL(tab.url!).searchParams.get("v")!] = tab;
    return map;
  }, {} as Record<VideoId, chrome.tabs.Tab>);
  return tabs;
}
