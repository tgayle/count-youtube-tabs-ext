import React from "react";
import { secondsToDuration } from "../util";

export function PopupHeader({
  tabCount,
  location,
  totalLength,
}: {
  tabCount: number;
  location: "tabs" | "videos";
  totalLength: number;
}) {
  return (
    <div className="p-2 flex flex-col justify-center items-center">
      <p>
        {tabCount} {location}
      </p>
      <p className="text-xl">Total Length</p>
      <p className="text-2xl">{secondsToDuration(totalLength)}</p>
    </div>
  );
}
