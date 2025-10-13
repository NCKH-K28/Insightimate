import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export type ViewType = 'list' | 'kanban' | 'calendar' | 'gantt' | 'timeline' | 'backlog';
export type SideBarState = 'open' | 'closed';
export type ThemeMode = 'light' | 'dark' | 'system';
export type FilterOperator = 'and' | 'or';

export interface IssueFilter {
  assignees?: string[];
  labels?: string[];
  status?: string[];
  priority?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  searchQuery?: string;
  operator?: FilterOperator;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ViewConfig {
  columns?: string[];
  groupBy?: string;
  sortBy?: SortConfig[];
  pageSize?: number;
}

export interface QuickFilter {
  id: string;
  name: string;
  filter: IssueFilter;
  isDefault?: boolean;
}

export interface ProjectStoreState {
  // View Management
  view: ViewType;
  setView: (view: ViewType) => void;

  // UI State
  sideBarState: SideBarState;
  setSideBarState: (state: SideBarState) => void;
  toggleSideBar: () => void;

  isFullScreen: boolean;
  setFullScreen: (isFullScreen: boolean) => void;
  toggleFullScreen: () => void;

  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Issue Selection
  selectedIssues: Set<string>;
  setSelectedIssues: (issues: Set<string>) => void;
  addSelectedIssue: (issue: string) => void;
  removeSelectedIssue: (issue: string) => void;
  clearSelectedIssues: () => void;
  toggleIssueSelection: (issue: string) => void;
  selectAllIssues: (issues: string[]) => void;
  isIssueSelected: (issue: string) => boolean;
  getSelectedIssueCount: () => number;

  // for sprint
  sprintCollapsible: Set<string>;
  setSprintCollapsible: (state: Set<string>) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // View Management
        view: 'list',
        setView: (view) => set({ view }),

        // UI State
        sideBarState: 'closed',
        setSideBarState: (state) => set({ sideBarState: state }),
        toggleSideBar: () =>
          set((state) => ({
            sideBarState: state.sideBarState === 'open' ? 'closed' : 'open',
          })),

        isFullScreen: false,
        setFullScreen: (isFullScreen) => set({ isFullScreen }),
        toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),

        // Theme
        theme: 'system',
        setTheme: (theme) => set({ theme }),

        // Issue Selection
        selectedIssues: new Set(),
        setSelectedIssues: (issues) => set({ selectedIssues: new Set(issues) }),
        addSelectedIssue: (issue) =>
          set((state) => {
            const newSelected = new Set(state.selectedIssues);
            newSelected.add(issue);
            return { selectedIssues: newSelected };
          }),
        removeSelectedIssue: (issue) =>
          set((state) => {
            const newSelected = new Set(state.selectedIssues);
            newSelected.delete(issue);
            return { selectedIssues: newSelected };
          }),
        clearSelectedIssues: () => set({ selectedIssues: new Set() }),
        toggleIssueSelection: (issue) =>
          set((state) => {
            const newSelected = new Set(state.selectedIssues);
            if (newSelected.has(issue)) {
              newSelected.delete(issue);
            } else {
              newSelected.add(issue);
            }
            return { selectedIssues: newSelected };
          }),
        selectAllIssues: (issues) => set({ selectedIssues: new Set(issues) }),
        isIssueSelected: (issue) => get().selectedIssues.has(issue),
        getSelectedIssueCount: () => get().selectedIssues.size,

        // for sprint
        sprintCollapsible: new Set(),
        setSprintCollapsible: (state) => set({ sprintCollapsible: new Set(state) }),
      }),
      {
        name: 'project-store',
        partialize: (state) => ({
          view: state.view,
          sideBarState: state.sideBarState,
          theme: state.theme,
        }),
      },
    ),
    { name: 'project-store' },
  ),
);

export const useProjectView = () => useProjectStore((state) => state.view);
