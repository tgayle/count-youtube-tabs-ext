import React, { useEffect, useState } from "react";
import type { DataResponse } from "../background";
import { PopupHeader } from "./PopupHeader";
import { VideoItem } from "./VideoItem";
import { useAtomValue } from "jotai";
import { onlyShowVideosWithProgressAtom } from "../state";

type Props = {
  sort: string;
};

export function ActiveTabsPane({ sort }: Props) {
  const [data, setData] = useState<DataResponse>();
  const onlyShowVideosWithProgress = useAtomValue(
    onlyShowVideosWithProgressAtom
  );

  const {
    tabs = {},
    videoData: videoInfo = {},
    remainingLength: adjustedVideoLength = 0,
    totalLength: unadjustedVideoLength = 0,
    videoProgress = {},
  } = data ?? {};

  useEffect(() => {
    const refresh = async () => {
      const res: DataResponse = await chrome.runtime.sendMessage("data");
      setData(res);
    };

    refresh();

    const onMessage = (message: string) => {
      if (message === "refresh") refresh();
    };
    chrome.runtime.onMessage.addListener(onMessage);

    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  return (
    <>
      <PopupHeader
        tabCount={Object.keys(tabs).length}
        location="tabs"
        totalLength={unadjustedVideoLength}
        remainingLength={adjustedVideoLength}
      />

      <ul>
        {Object.keys(tabs)
          .sort((a, b) => {
            if (onlyShowVideosWithProgress) {
              const aProgress =
                (videoProgress[tabs[a].id ?? ""] ?? 0) /
                (videoInfo[a]?.duration ?? 0);
              const bProgress =
                (videoProgress[tabs[b].id ?? ""] ?? 0) /
                (videoInfo[b]?.duration ?? 0);

              let direction =
                aProgress < bProgress ? -1 : aProgress > bProgress ? 1 : 0;

              if (sort === "desc") {
                direction *= -1;
              }

              return direction;
            }

            if (sort === "asc") {
              return (
                (videoInfo[a]?.duration ?? 0) - (videoInfo[b]?.duration ?? 0)
              );
            } else {
              return (
                (videoInfo[b]?.duration ?? 0) - (videoInfo[a]?.duration ?? 0)
              );
            }
          })
          .map((videoId) => {
            const watchedDuration = videoProgress[tabs[videoId].id ?? ""];
            if (onlyShowVideosWithProgress && !watchedDuration) {
              return null;
            }

            return (
              <VideoItem
                key={videoId}
                tab={tabs[videoId]}
                info={videoInfo[videoId]}
                progress={watchedDuration}
              />
            );
          })}
      </ul>
    </>
  );
}
