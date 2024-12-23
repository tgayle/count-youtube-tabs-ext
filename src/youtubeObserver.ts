import { getAllVideoTabs, getTabsByVideoId } from "./aggregation";
import { VideoId } from "./api";

export class YoutubeObserver {
  private openVideos: Record<VideoId, chrome.tabs.Tab> = {};

  onTabUpdated?: (
    videoId: VideoId,
    tab: chrome.tabs.Tab
  ) => void | Promise<void>;
  onTabRemoved?: (
    videoId: VideoId,
    tab: chrome.tabs.Tab | null
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
    chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
      const VIDEO_STR = "youtube.com/watch";
      const previousTabInfo = this.findCachedTabByTabId(tabId);

      if (!tab?.url) return;
      if (!tab.url.includes(VIDEO_STR)) {
        if (previousTabInfo?.url?.includes(VIDEO_STR)) {
          const videoId = new URL(previousTabInfo.url).searchParams.get("v")!;
          await this.handleTabRemoval(tabId, videoId);
        }
        return;
      }

      const videoId = new URL(tab.url).searchParams.get("v")!;
      const previousVideoId = previousTabInfo?.url
        ? new URL(previousTabInfo.url).searchParams.get("v")!
        : null;

      if (previousTabInfo && previousVideoId && previousVideoId !== videoId) {
        await this.handleTabRemoval(tabId, previousVideoId);
      }

      this.openVideos[videoId] = tab;
      await this.onTabUpdated?.(videoId, tab);
    });
  }

  private async handleTabRemoval(tabId: number, videoId: string) {
    const tab = this.findCachedTabByTabId(tabId);

    if (!tab) return;

    const videoTabs = (await getAllVideoTabs()).filter(
      (it) => it.url && new URL(it.url).searchParams.get("v") === videoId
    );

    // Only remove the video data if no other tabs are open to the same video.
    // Otherwise, make openVideos reference the new tab.
    if (videoTabs.length === 0) {
      delete this.openVideos[videoId];
      this.onTabRemoved?.(videoId, tab);
    } else {
      this.openVideos[videoId] = videoTabs[0];
    }
  }

  private initTabRemovedListener() {
    chrome.tabs.onRemoved.addListener(async (tabId) => {
      const tab = this.findCachedTabByTabId(tabId);
      if (!tab?.url) return;
      if (!tab.url.includes("youtube.com/watch")) return;

      const videoId = new URL(tab.url).searchParams.get("v")!;

      await this.handleTabRemoval(tabId, videoId);
    });
  }

  async getRemainingVideoRuntime() {
    const getVideoProgress = Object.entries(this.openVideos).map(
      async ([videoId, tab]) => {
        if (tab.status !== "complete" || !tab.url?.includes("youtube.com")) {
          return null;
        }

        try {
          const currentTabState = await chrome.tabs.get(tab.id!);

          if (!currentTabState) {
            await this.handleTabRemoval(tab.id!, videoId);
            return null;
          }
        } catch (e) {
          await this.handleTabRemoval(tab.id!, videoId);
          return null;
        }

        if (tab.discarded) {
          console.info(
            `Skipping tab ${tab.id} - ${tab.title} (state=discarded)`
          );
          return null;
        }

        try {
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
        } catch (e) {
          // Chrome actually won't let a scripting extension access a tab
          // that was created before the extension was loaded, so during
          // development, you'll see this a lot.

          if (e instanceof Error && e.message.includes("respective host")) {
            return null;
          }
          console.error("couldn't query tab", tab, e);
        }
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
          // TODO: We should better model videos which aren't available
          //   anymore or otherwise don't contain all required info.
          if (video.videoId && typeof video.currentTime === "number") {
            map[video.videoId!] = +video.currentTime.toFixed();
          }
          return map;
        }, {} as Record<string, number>),
    };
  }
}
