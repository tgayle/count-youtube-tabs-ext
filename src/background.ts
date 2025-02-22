import { VideoFetcher } from "./VideoFetcher";
import { getTabsByVideoId } from "./aggregation";
import { VideoId, VideoWithInfo } from "./api";
import { YoutubeObserver } from "./youtubeObserver";

console.log("bonjour");

const tabWatcher = new YoutubeObserver();
const videoFetcher = new VideoFetcher();

chrome.action.setBadgeText({
  text: "...",
});

let authed: true | false | null = null;

type TabId = string;
export type DataResponse = {
  authed: true | false | null;
  videoData: Record<VideoId, VideoWithInfo>;
  videoProgress: Record<TabId, number>;
  tabs: Record<string, chrome.tabs.Tab>;
  totalLength: number;
  remainingLength: number;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);

  if (message !== "data") return;

  (async () => {
    const unadjustedVideoLength = videoFetcher.totalRuntime;
    const { totalDuration: watchedDuration, videos } =
      await tabWatcher.getRemainingVideoRuntime();
    const adjustedLength = unadjustedVideoLength - watchedDuration;

    sendResponse({
      authed,
      tabs: tabWatcher.openVideoTabsById,
      videoData: videoFetcher.videoDataById,
      videoProgress: videos,
      totalLength: unadjustedVideoLength,
      remainingLength: adjustedLength,
    } satisfies DataResponse);
  })();
  return true;
});

async function submitNewVideos(...ids: VideoId[]) {
  const result = await videoFetcher.onNewVideo(...ids);

  if (result.success) {
    authed = true;
    onVideoData();
  } else {
    authed = false;
    console.warn(result.error);
    onUnauthenticated();
  }
}

// @ts-expect-error
globalThis.tabWatcher = tabWatcher;
// @ts-expect-error
globalThis.videoFetcher = videoFetcher;

tabWatcher.onTabUpdated = async (videoId) => {
  await submitNewVideos(videoId);
};

tabWatcher.onTabRemoved = (videoId) => {
  const currentCachedVideos = new Set([
    videoId,
    ...Object.keys(videoFetcher.videoDataById),
  ]);
  const openVideos = new Set(Object.keys(tabWatcher.openVideoTabsById));

  const videosToRemove = currentCachedVideos.difference(openVideos);

  console.debug("Removing videos with no open tabs", videosToRemove);
  videoFetcher.removeVideo(...videosToRemove);

  onVideoData();
};

async function onVideoData() {
  const duration =
    videoFetcher.totalRuntime -
    (await tabWatcher.getRemainingVideoRuntime()).totalDuration;

  const ONE_MINUTE = 60;
  const ONE_HOUR = 60 * 60;

  let shownText: string;

  if (duration < ONE_MINUTE) {
    shownText = `${duration}s`;
  } else if (duration < ONE_HOUR) {
    shownText = `${Math.round(duration / ONE_MINUTE)}m`;
  } else {
    shownText = `${Math.round(duration / ONE_HOUR)}h`;
  }

  chrome.action.setBadgeText({ text: `${shownText}` });
  chrome.action.setBadgeBackgroundColor({ color: "#AEAEAE" });

  try {
    await chrome.runtime.sendMessage("refresh");
  } catch (e) {
    console.warn("Video data updated but no popups open.");
  }
}

async function onUnauthenticated() {
  authed = false;
  await chrome.action.setBadgeText({ text: "!" });
  await chrome.action.setBadgeBackgroundColor({ color: "red" });
}

(async () => {
  await tabWatcher.init();
  await submitNewVideos(...Object.keys(tabWatcher.openVideoTabsById));
})();

(() => {
  chrome.contextMenus.create({
    id: "pause-all",
    title: "Pause All Videos",
    contexts: ["action"],
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "pause-all") return;
    const videoTabs = Object.values(await getTabsByVideoId());

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
})();
