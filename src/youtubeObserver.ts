import { getTabsByVideoId } from "./aggregation";
import { VideoId } from "./api";

export class YoutubeObserver {
  private openVideos: Record<VideoId, chrome.tabs.Tab> = {};

  onTabUpdated?: (
    videoId: string,
    tab: chrome.tabs.Tab
  ) => void | Promise<void>;
  onTabRemoved?: (
    videoId: string,
    tab: chrome.tabs.Tab
  ) => void | Promise<void>;

  get openVideoTabsById() {
    return this.openVideos;
  }

  async init() {
    this.openVideos = await getTabsByVideoId();
    console.log(
      `Tab Observer initialized: ${
        Object.keys(this.openVideos).length
      } videos found`
    );
    this.initTabRemovedListener();
    this.initTabUpdatedListener();
  }

  private findCachedTabByTabId(tabId: number) {
    return Object.values(this.openVideos).find((it) => it.id === tabId);
  }

  private initTabUpdatedListener() {
    chrome.tabs.onUpdated.addListener(async (tabId, change) => {
      const VIDEO_STR = "youtube.com/watch";
      const tab = await chrome.tabs.get(tabId);
      const previousTabInfo = this.findCachedTabByTabId(tabId);

      if (change.title) return;
      if (!tab?.url) return;
      if (!tab.url.includes(VIDEO_STR)) {
        if (previousTabInfo?.url?.includes(VIDEO_STR)) {
          const videoId = new URL(previousTabInfo.url).searchParams.get("v")!;
          delete this.openVideos[videoId];
          await this.onTabRemoved?.(videoId, previousTabInfo);
        }
        return;
      }

      const videoId = new URL(tab.url).searchParams.get("v")!;

      this.openVideos[videoId] = tab;
      await this.onTabUpdated?.(videoId, tab);
    });
  }

  private initTabRemovedListener() {
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
      const tab = this.findCachedTabByTabId(tabId);
      if (!tab?.url) return;
      if (!tab.url.includes("youtube.com/watch")) return;

      const videoId = new URL(tab.url).searchParams.get("v")!;

      delete this.openVideos[videoId];
      this.onTabRemoved?.(videoId, tab);
    });
  }

  async getRemainingVideoRuntime() {
    const getVideoProgress = Object.entries(this.openVideos).map(
      async ([videoId, tab]) => {
        if (tab.status !== "complete") {
          return null;
        }

        const [result] = await chrome.scripting.executeScript({
          target: {
            tabId: tab.id!,
          },
          func: () => {
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
      }
    );

    const videoProgress = await Promise.all(getVideoProgress);

    const totalTimeWatched = videoProgress
      .map((it) => it?.currentTime ?? 0)
      .reduce((a, b) => a + b, 0);

    return {
      totalDuration: +totalTimeWatched.toFixed(),
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
}
