import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const authenticatedAtom = atom<"pending" | "good" | "bad">("pending");

export const sortOrderAtom = atomWithStorage<"asc" | "desc">(
  "sortOrder",
  "desc"
);
