import React from "react";
import { VideoWithInfo } from "../api";
import { secondsToDuration } from "../util";

type Props = {
  tab: chrome.tabs.Tab;
  info?: VideoWithInfo;
};

export function VideoItem({ tab, info }: Props) {
  return (
    <li key={tab.id} className="p-4 shadow-md m-2 flex justify-between">
      <div className="pr-1">
        <a>{tab.title}</a>
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
