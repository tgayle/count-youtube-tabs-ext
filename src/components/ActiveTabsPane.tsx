import type { DataResponse } from "../background";
import { PopupHeader } from "./PopupHeader";
import { VideoItem } from "./VideoItem";
import { onlyShowVideosWithProgressAtom } from "../state";
import { For, createSignal, onCleanup } from "solid-js";
import { createAutoAnimateDirective } from "@formkit/auto-animate/solid";

type Props = {
  sort: string;
};

const [onlyShowVideosWithProgress] = onlyShowVideosWithProgressAtom;

export function ActiveTabsPane(props: Props) {
  const autoAnimate = createAutoAnimateDirective();
  const [data, setData] = createSignal<DataResponse>({
    authed: false,
    remainingLength: 0,
    tabs: {},
    totalLength: 0,
    videoData: {},
    videoProgress: {},
  });

  const refresh = async () => {
    const res: DataResponse = await chrome.runtime.sendMessage("data");
    setData(res);
  };

  const timer = setInterval(refresh, 250);
  refresh();
  const onMessage = (message: string) => {
    if (message === "refresh") refresh();
  };
  chrome.runtime.onMessage.addListener(onMessage);

  onCleanup(() => {
    clearInterval(timer);
    chrome.runtime.onMessage.removeListener(onMessage);
  });

  const tabs = () => data()?.tabs;
  const videoProgress = () => data()?.videoProgress;
  const videoInfo = () => data()?.videoData;

  const sortedTabs = () => {
    const { tabs, videoProgress, videoData } = data();

    function getVideoProgress(videoId: string) {
      const video = videoData[videoId];
      const progress = videoProgress[videoId];
      if (!video || !progress) return 0;
      return progress / video.duration;
    }

    return Object.keys(tabs).sort((videoIdA, videoIdB) => {
      const videoA = videoData[videoIdA];
      const videoB = videoData[videoIdB];
      if (onlyShowVideosWithProgress()) {
        const aProgress = getVideoProgress(videoIdA);
        const bProgress = getVideoProgress(videoIdB);

        let direction =
          aProgress < bProgress ? -1 : aProgress > bProgress ? 1 : 0;

        if (props.sort === "desc") {
          direction *= -1;
        }

        return direction;
      }

      if (props.sort === "asc") {
        return (videoA?.duration ?? 0) - (videoB?.duration ?? 0);
      } else {
        return (videoB?.duration ?? 0) - (videoA?.duration ?? 0);
      }
    });
  };

  return (
    <div>
      <PopupHeader
        tabCount={Object.keys(tabs()).length}
        totalLength={data().totalLength}
        remainingLength={data().remainingLength}
      />

      <ul use:autoAnimate>
        <For each={sortedTabs()}>
          {(videoId) => {
            const progress = () => videoProgress()[videoId ?? ""];

            if (onlyShowVideosWithProgress() && !progress()) {
              return null;
            }

            return (
              <VideoItem
                videoId={videoId}
                progress={progress()}
                tabs={tabs()}
                videoInfo={videoInfo()}
              />
            );
          }}
        </For>
      </ul>
    </div>
  );
}
