import { Show } from "solid-js";
import { VideoWithInfo } from "../api";
import { secondsToDuration } from "../util";

type Props = {
  videoId: string;
  tab: chrome.tabs.Tab;
  info?: VideoWithInfo;
  progress: number;
};

export function VideoItem(props: Props) {
  return (
    <li class="p-4 shadow-md m-2 flex justify-between">
      <div class="pr-1 flex flex-col justify-between grow">
        <p class="mt-2">{props.tab.title}</p>

        <Show when={props.progress > 0}>
          <div
            class="tooltip w-full"
            data-tip={`${secondsToDuration(props.progress)}/${secondsToDuration(
              props.info?.duration ?? 0
            )}`}
          >
            <progress
              class="progress my-2 pr-2 grow"
              value={props.progress}
              max={props.info?.duration ?? 0}
            ></progress>
          </div>
        </Show>
      </div>
      <Show when={props.info}>
        {(info) => (
          <div class="flex flex-col gap-2">
            <span class="badge badge-primary">
              {secondsToDuration(info().duration ?? 0)}
            </span>
            <button
              class="btn btn-sm btn-outline"
              onClick={async () => {
                chrome.tabs.update(props.tab.id!, { active: true });
                chrome.windows.update(props.tab.windowId!, { focused: true });
              }}
            >
              Go
            </button>
          </div>
        )}
      </Show>
    </li>
  );
}
