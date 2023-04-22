import { secondsToDuration } from "../util";
import { lengthTypeAtom } from "../state";
import { Accessor } from "solid-js";

export function PopupHeader({
  tabCount,
  totalLength,
  remainingLength,
}: {
  tabCount: Accessor<number>;
  location: "tabs" | "videos";
  totalLength: Accessor<number>;
  remainingLength: Accessor<number>;
}) {
  const [lengthType, setShowRemaining] = lengthTypeAtom;
  const showRemaining = () => lengthType() === "remaining";
  return (
    <div class="p-2 flex flex-col justify-center items-center">
      <p>{tabCount()} tabs</p>
      <p
        class="text-xl"
        onClick={() =>
          setShowRemaining(lengthType() === "remaining" ? "total" : "remaining")
        }
      >
        {showRemaining() ? "Remaining" : "Total"} Length
      </p>
      <p class="text-2xl">
        {secondsToDuration(showRemaining() ? remainingLength() : totalLength())}
      </p>
    </div>
  );
}
