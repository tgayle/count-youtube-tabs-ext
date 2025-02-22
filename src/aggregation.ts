import { VideoId } from "./api";

export async function getAllVideoTabs() {
  const videos = await chrome.tabs.query({
    discarded: false,
    url: "https://www.youtube.com/watch*",
  });

  const shorts = await chrome.tabs.query({
    discarded: false,
    url: "https://www.youtube.com/shorts/*",
  });

  return shorts.concat(videos);
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
