import { createEffect, createSignal } from "solid-js";

function persistedSignal<T>(key: string, defaultValue: T) {
  const localValue = localStorage.getItem(key);
  const [value, setValue] = createSignal<T>(
    localValue === null ? defaultValue : JSON.parse(localValue)
  );

  createEffect(() => {
    console.log("persisting", key, value());
    localStorage.setItem(key, JSON.stringify(value()));
  });

  return [value, setValue] as const;
}

export const authenticatedAtom = createSignal<"pending" | "good" | "bad">(
  "pending"
);

export const sortOrderAtom = persistedSignal<"asc" | "desc">(
  "sortOrder",
  "desc"
);

export const lengthTypeAtom = persistedSignal<"total" | "remaining">(
  "lengthDisplayType",
  "total"
);

export const onlyShowVideosWithProgressAtom = persistedSignal(
  "onlyShowVideosWithProgress",
  false
);
