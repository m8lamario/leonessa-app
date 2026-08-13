import { create } from "zustand";

type UiState = {
  theme: "dark" | "light";
  setTheme: (theme: UiState["theme"]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),
}));
