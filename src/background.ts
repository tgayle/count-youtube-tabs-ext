import { getVideoLengths, VideoId, VideoWithInfo } from "./api";

console.log("bonjour");

chrome.action.setBadgeText({
  text: "...",
});

let authed: true | false | null = null;
let videoData: Record<VideoId, VideoWithInfo> = {};
let tabs: Record<string, chrome.tabs.Tab> = {};

export type DataResponse = {
  authed: true | false | null;
  videoData: Record<VideoId, VideoWithInfo>;
  tabs: Record<string, chrome.tabs.Tab>;
};

preloadVideoRuntime();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message !== "data") return;

  sendResponse({
    authed,
    tabs,
    videoData,
  } as DataResponse);
  return true;
});

chrome.tabs.onUpdated.addListener(async (tabId, change) => {
  if (change.url) {
    const url = change.url;
    if (!url.includes("youtube.com/watch")) return;

    const videoId = new URL(url).searchParams.get("v")!;
    tabs[videoId] = await chrome.tabs.get(tabId);

    preloadVideoRuntime();
  }

  if (change.title) {
    const tab = Object.values(tabs).find((t) => t.id === tabId);
    if (!tab) return;
    tab.title = change.title;
    onVideoData();
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const tab = Object.values(tabs).find((t) => t.id === tabId);
  if (!tab) return;

  const videoId = new URL(tab.url!).searchParams.get("v")!;
  delete videoData[videoId];
  delete tabs[videoId];

  onVideoData();
});

async function preloadVideoRuntime() {
  const tabs = await getTabs();
  try {
    const lengths = await getVideoLengths(
      Object.values(tabs).map((t) => t.url!)
    );
    authed = true;

    videoData = lengths.reduce((map, video) => {
      map[video.id] = video;
      return map;
    }, {} as Record<string, VideoWithInfo>);

    onVideoData();
  } catch (e) {
    console.warn(e);
    onUnauthenticated();
  }
}

async function onVideoData() {
  const duration = Object.values(videoData)
    .map((it) => it?.duration ?? 0)
    .reduce((a, b) => a + b, 0);

  const ONE_MINUTE = 60;
  const ONE_HOUR = 60 * 60;
  const ONE_DAY = 60 * 60 * 24;

  let shownText: string;

  if (duration < ONE_MINUTE) {
    shownText = `${duration}s`;
  } else if (duration < ONE_HOUR) {
    shownText = `${Math.round(duration / ONE_MINUTE)}m`;
  } else {
    shownText = `${Math.round(duration / ONE_HOUR)}h`;
  }

  chrome.action.setBadgeText({
    text: `${shownText}`,
  });

  chrome.action.setBadgeBackgroundColor({
    color: "#AEAEAE",
  });

  await chrome.runtime.sendMessage("refresh");
}

async function onUnauthenticated() {
  authed = false;
  await chrome.action.setBadgeText({
    text: "!",
  });
  await chrome.action.setBadgeBackgroundColor({
    color: "red",
  });
}

async function getTabs() {
  const chromeTabs = await chrome.tabs.query({});
  const videos = chromeTabs.filter((tab) =>
    tab.url?.includes("youtube.com/watch")
  );
  tabs = videos.reduce((map, tab) => {
    map[new URL(tab.url!).searchParams.get("v")!] = tab;
    return map;
  }, {} as Record<VideoId, chrome.tabs.Tab>);
  return tabs;
}
