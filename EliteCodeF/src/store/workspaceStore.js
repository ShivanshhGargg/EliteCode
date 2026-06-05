import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWorkspaceStore = create(persist((set) => ({
    selectedProblem: null,
    setSelectedProblem: (problem) =>
        set({ selectedProblem: problem }),
}), {
    name: 'elitecode-workspace-state',
}));

export default useWorkspaceStore;
