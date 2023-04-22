import { Accessor, Show } from "solid-js";
import { VideoId, VideoWithInfo } from "../api";
import { secondsToDuration } from "../util";

type Props = {
  videoId: string;
  tabs: Accessor<Record<VideoId, chrome.tabs.Tab>>;
  videoInfo: Accessor<Record<VideoId, VideoWithInfo>>;
  progress: Accessor<number>;
};

export function VideoItem({ tabs, videoId, videoInfo, progress }: Props) {
  const tab = () => tabs()[videoId];
  const info = () => videoInfo()[videoId];

  return (
    <li class="p-4 shadow-md m-2 flex justify-between">
      <div class="pr-1 flex flex-col justify-between grow">
        <p>{tab().title}</p>

        <Show when={progress() > 0}>
          <div
            class="tooltip w-full"
            data-tip={`${secondsToDuration(progress())}/${secondsToDuration(
              info()?.duration ?? 0
            )}`}
          >
            <progress
              class="progress my-2 pr-2 grow"
              value={progress()}
              max={info()?.duration ?? 0}
            ></progress>
          </div>
        </Show>
      </div>
      {info() && (
        <div class="flex flex-col gap-2">
          <span class="badge badge-primary">
            {secondsToDuration(info()?.duration ?? 0)}
          </span>
          <button
            class="btn btn-sm btn-outline"
            onClick={async () => {
              chrome.tabs.update(tab().id!, { active: true });
              chrome.windows.update(tab().windowId!, { focused: true });
            }}
          >
            Go
          </button>
        </div>
      )}
    </li>
  );
}
