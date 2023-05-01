import { secondsToDuration } from "../util";
import { lengthTypeAtom } from "../state";

export function PopupHeader(props: {
  tabCount: number;
  totalLength: number;
  remainingLength: number;
}) {
  const [lengthType, setShowRemaining] = lengthTypeAtom;
  const showRemaining = () => lengthType() === "remaining";
  return (
    <div class="p-2 flex flex-col justify-center items-center">
      <p>{props.tabCount} tabs</p>
      <p
        class="text-xl"
        onClick={() =>
          setShowRemaining(lengthType() === "remaining" ? "total" : "remaining")
        }
      >
        {showRemaining() ? "Remaining" : "Total"} Length
      </p>
      <p class="text-2xl">
        {secondsToDuration(
          showRemaining() ? props.remainingLength : props.totalLength
        )}
      </p>
    </div>
  );
}
