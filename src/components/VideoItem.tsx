import React from "react";
import { VideoWithInfo } from "../api";
import { secondsToDuration } from "../util";

type Props = {
  tab: chrome.tabs.Tab;
  info?: VideoWithInfo;
  progress: number;
};

export function VideoItem({ tab, info, progress }: Props) {
  return (
    <li key={tab.id} className="p-4 shadow-md m-2 flex justify-between">
      <div className="pr-1 flex flex-col justify-between grow">
        <p>{tab.title}</p>
        {progress > 0 && (
          <div
            className="tooltip w-full"
            data-tip={`${secondsToDuration(progress)}/${secondsToDuration(
              info?.duration ?? 0
            )}`}
          >
            <progress
              className="progress my-2 pr-2 grow"
              value={progress}
              max={info?.duration ?? 0}
            ></progress>
          </div>
        )}
      </div>
      {info && (
        <div className="flex flex-col gap-2">
          <span className="badge badge-primary">
            {secondsToDuration(info.duration)}
          </span>
          <button
            className="btn btn-sm btn-outline"
            onClick={async () => {
              chrome.tabs.update(tab.id!, { active: true });
              chrome.windows.update(tab.windowId!, { focused: true });
            }}
          >
            Go
          </button>
        </div>
      )}
    </li>
  );
}
