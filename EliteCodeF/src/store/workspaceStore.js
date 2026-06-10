// src/store/workspaceStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useWorkspaceStore = create(persist((set, get) => ({
    selectedProblems: {
        STANDARD: null,
        INTERVIEW: null,
        LEARNING: null,
    },
    setSelectedProblem: (problem, mode) => {
        if (!mode) return
        console.log('Setting problem for mode', mode, problem)
        set((state) => ({
            selectedProblems: {
                ...state.selectedProblems,
                [mode]: problem, // problem can be null
            }
        }))
    },
    getSelectedProblem: (mode) => {
        const problem = get().selectedProblems[mode]
        console.log('Getting problem for mode', mode, problem)
        return problem
    },
}), {
    name: 'elitecode-workspace-state',
}))

export default useWorkspaceStore