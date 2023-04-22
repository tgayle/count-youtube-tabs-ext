import { getVideoLengths, VideoId, VideoWithInfo } from "./api";

console.log("bonjour");

chrome.action.setBadgeText({
  text: "...",
});

let authed: true | false | null = null;
let videoData: Record<VideoId, VideoWithInfo> = {};
let tabs: Record<VideoId, chrome.tabs.Tab> = {};

type TabId = string;
export type DataResponse = {
  authed: true | false | null;
  videoData: Record<VideoId, VideoWithInfo>;
  videoProgress: Record<TabId, number>;
  tabs: Record<string, chrome.tabs.Tab>;
  totalLength: number;
  remainingLength: number;
};

preloadVideoRuntime();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);

  if (message !== "data") return;

  (async () => {
    const unadjustedVideoLength = Object.values(videoData)
      .map((it) => it?.duration ?? 0)
      .reduce((a, b) => a + b, 0);

    const actualVideoProgress = await getActualTimeWatched();
    const adjustedLength = unadjustedVideoLength - actualVideoProgress.total;

    sendResponse({
      authed,
      tabs,
      videoData,
      videoProgress: actualVideoProgress.videos,
      totalLength: unadjustedVideoLength,
      remainingLength: adjustedLength,
    } satisfies DataResponse);
  })();
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
  if (!tab || !tab.url) return;

  const videoId = new URL(tab.url!).searchParams.get("v")!;
  delete videoData[videoId];
  delete tabs[videoId];

  onVideoData();
});

async function preloadVideoRuntime() {
  const tabs = await getTabs();
  try {
    const lengths = await getVideoLengths(
      Object.values(tabs)
        .map((t) => t.url!)
        .filter((url) => !!url)
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
  const duration =
    Object.values(videoData)
      .map((it) => it?.duration ?? 0)
      .reduce((a, b) => a + b, 0) - (await getActualTimeWatched()).total;

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
  const videos = await chrome.tabs.query({
    url: "https://www.youtube.com/watch*",
  });
  tabs = videos.reduce((map, tab) => {
    if (!tab.url) {
      return map;
    }
    map[new URL(tab.url!).searchParams.get("v")!] = tab;
    return map;
  }, {} as Record<VideoId, chrome.tabs.Tab>);
  return tabs;
}

async function getAllVideoTabs() {
  return await chrome.tabs.query({
    discarded: false,
    url: "https://www.youtube.com/watch*",
  });
}

async function getActualTimeWatched() {
  const videoTabs = await getAllVideoTabs();

  const getVideoProgress = videoTabs.map(async (tab) => {
    if (tab.status !== "complete") {
      return null;
    }

    const videoId = new URL(tab.url!).searchParams.get("v");

    if (!videoId) return null;

    const [result] = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id!,
      },
      func: () => {
        // console.log("hello tab!", tab.id);
        const video = document.querySelector("video");

        if (!video) return null;

        const duration = video.duration;
        const currentTime = video.currentTime;

        const r = {
          duration,
          currentTime,
        };

        console.log("[YT Length Counter]:", r);

        return r;
      },
    });

    return { videoId: videoId, ...result.result };
  });

  const videoProgress = await Promise.all(getVideoProgress);

  const totalTimeWatched = videoProgress
    .map((it) => it?.currentTime ?? 0)
    .reduce((a, b) => a + b, 0);

  return {
    total: +totalTimeWatched.toFixed(),
    videos: videoProgress
      .filter((it): it is NonNullable<typeof it> => !!it)
      .reduce((map, video) => {
        if (video.videoId) {
        }
        map[video.videoId!] = +video.currentTime!.toFixed();
        return map;
      }, {} as Record<string, number>),
  };
}

chrome.contextMenus.create({
  id: "pause-all",
  title: "Pause All Videos",
  contexts: ["action"],
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "pause-all") return;
  const videoTabs = await getAllVideoTabs();

  videoTabs.forEach((video) => {
    chrome.scripting.executeScript({
      target: { tabId: video.id! },
      func: () => {
        const video = document.querySelector("video");
        if (!video || video.paused) return;
        video.pause();
      },
    });
  });
});
