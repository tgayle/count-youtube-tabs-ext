import React from "react";
import { secondsToDuration } from "../util";
import { useAtom } from "jotai";
import { lengthTypeAtom } from "../state";

export function PopupHeader({
  tabCount,
  location,
  totalLength,
  remainingLength,
}: {
  tabCount: number;
  location: "tabs" | "videos";
  totalLength: number;
  remainingLength: number;
}) {
  const [lengthType, setShowRemaining] = useAtom(lengthTypeAtom);
  const showRemaining = lengthType === "remaining";
  return (
    <div className="p-2 flex flex-col justify-center items-center">
      <p>
        {tabCount} {location}
      </p>
      <p
        className="text-xl"
        onClick={() =>
          setShowRemaining(lengthType === "remaining" ? "total" : "remaining")
        }
      >
        {showRemaining ? "Remaining" : "Total"} Length
      </p>
      <p className="text-2xl">
        {secondsToDuration(showRemaining ? remainingLength : totalLength)}
      </p>
    </div>
  );
}
