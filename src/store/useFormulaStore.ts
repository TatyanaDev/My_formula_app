import { create } from "zustand";

interface State {
  searchTerm: string;
  cursorPos: { x: number; y: number };
  showDropdown: boolean;
  activeDropdown: string | null;
  originalNames: Record<string, string>;
  setSearchTerm: (term: string) => void;
  setCursorPos: (pos: { x: number; y: number }) => void;
  setShowDropdown: (show: boolean) => void;
  setActiveDropdown: (dropdown: string | null) => void;
  setOriginalNames: (updateFunction: (prevState: Record<string, string>) => Record<string, string>) => void;
  resetDropdowns: () => void;
}

const useStore = create<State>((set) => ({
  searchTerm: "",
  cursorPos: { x: 0, y: 0 },
  showDropdown: false,
  activeDropdown: null,
  originalNames: {},
  setSearchTerm: (term) => set({ searchTerm: term }),
  setCursorPos: (pos) => set({ cursorPos: pos }),
  setShowDropdown: (show) => set({ showDropdown: show }),
  setActiveDropdown: (dropdown) => set({ activeDropdown: dropdown }),
  setOriginalNames: (updateFunction) =>
    set((state) => ({
      originalNames: updateFunction(state.originalNames),
    })),
  resetDropdowns: () => set({ activeDropdown: null }),
}));

export default useStore;
