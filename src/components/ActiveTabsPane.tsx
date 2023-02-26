import React, { useEffect, useState } from "react";
import type { DataResponse } from "../background";
import { PopupHeader } from "./PopupHeader";
import { VideoItem } from "./VideoItem";

type Props = {
  sort: string;
};

export function ActiveTabsPane({ sort }: Props) {
  const [data, setData] = useState<DataResponse>();

  const {
    tabs = {},
    videoData: videoInfo = {},
    remainingLength: adjustedVideoLength = 0,
    totalLength: unadjustedVideoLength = 0,
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
            return (
              <VideoItem
                key={videoId}
                tab={tabs[videoId]}
                info={videoInfo[videoId]}
              />
            );
          })}
      </ul>
    </>
  );
}
