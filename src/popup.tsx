import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { getUserToken } from "./api";
import { ActiveTabsPane } from "./components/ActiveTabsPane";
import { useAtom } from "jotai";
import { authenticatedAtom, sortOrderAtom } from "./state";

createRoot(document.querySelector("#root")!).render(<Popup />);

function Popup() {
  const [sort, setSort] = useAtom(sortOrderAtom);
  const [authenticated] = useAtom(authenticatedAtom);

  return (
    <div className="flex flex-col max-h-44">
      {authenticated === "bad" && <RelogButton />}

      <div className="form-control p-4">
        <label className="label cursor-pointer">
          <span className="label-text">
            {sort == "desc" ? "Descending" : "Ascending"}
          </span>
          <input
            type="checkbox"
            className="toggle"
            onClick={() => {
              setSort(sort == "desc" ? "asc" : "desc");
            }}
            checked={sort == "asc"}
          />
        </label>
      </div>

      <ActiveTabsPane sort={sort} />
    </div>
  );
}

function RelogButton() {
  return (
    <button
      className="absolute right-4 top-2 text-2xl btn btn-ghost aspect-square"
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
