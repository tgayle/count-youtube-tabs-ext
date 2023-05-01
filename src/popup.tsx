import "./index.css";
import { getUserToken } from "./api";
import { ActiveTabsPane } from "./components/ActiveTabsPane";
import {
  authenticatedAtom,
  onlyShowVideosWithProgressAtom,
  sortOrderAtom,
} from "./state";

import { Show, render } from "solid-js/web";

function Popup() {
  const [sort, setSort] = sortOrderAtom;
  const [authenticated] = authenticatedAtom;
  const [onlyShowVideosWithProgress, setVideoFilter] =
    onlyShowVideosWithProgressAtom;

  return (
    <div class="flex flex-col max-h-44">
      <Show when={authenticated() === "bad"}>
        <RelogButton />
      </Show>

      <div class="form-control p-4">
        <label class="label cursor-pointer">
          <span class="label-text">
            {sort() == "desc" ? "Descending" : "Ascending"}
          </span>
          <input
            type="checkbox"
            class="checkbox checkbox-primary"
            onClick={() => {
              setSort(sort() == "desc" ? "asc" : "desc");
            }}
            checked={sort() == "asc"}
          />
        </label>
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">In Progress Videos</span>
            <input
              type="checkbox"
              checked={onlyShowVideosWithProgress()}
              class="checkbox checkbox-primary"
              onChange={() => setVideoFilter(!onlyShowVideosWithProgress())}
            />
          </label>
        </div>
      </div>

      <ActiveTabsPane sort={sort()} />
    </div>
  );
}

function RelogButton() {
  return (
    <button
      class="absolute right-4 top-2 text-2xl btn btn-ghost aspect-square"
      onClick={() => {
        getUserToken();
      }}
    >
      !
    </button>
  );
}

function clsx(...names: any[]): string {
  return names
    .map((name) => (typeof name === "string" ? name : undefined))
    .filter((it): it is string => !!it)
    .join(" ");
}

render(() => <Popup />, document.querySelector("#root")!);
