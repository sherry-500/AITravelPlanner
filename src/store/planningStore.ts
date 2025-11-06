import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TravelPlan } from '../types'

interface PlanningState {
  plans: TravelPlan[]
  currentPlan: TravelPlan | null
  isGenerating: boolean
  addPlan: (plan: TravelPlan) => void
  updatePlan: (id: string, updates: Partial<TravelPlan>) => void
  deletePlan: (id: string) => void
  setCurrentPlan: (plan: TravelPlan | null) => void
  setGenerating: (isGenerating: boolean) => void
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      plans: [],
      currentPlan: null,
      isGenerating: false,

      addPlan: (plan: TravelPlan) => {
        if (!plan || !plan.title) {
          console.error('Invalid plan data:', plan)
          return
        }
        set((state) => ({
          plans: [...state.plans, plan],
        }))
      },

      updatePlan: (id: string, updates: Partial<TravelPlan>) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === id
              ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
              : plan
          ),
          currentPlan:
            state.currentPlan?.id === id
              ? { ...state.currentPlan, ...updates, updatedAt: new Date().toISOString() }
              : state.currentPlan,
        }))
      },

      deletePlan: (id: string) => {
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== id),
          currentPlan: state.currentPlan?.id === id ? null : state.currentPlan,
        }))
      },

      setCurrentPlan: (plan: TravelPlan | null) => {
        set({ currentPlan: plan })
      },

      setGenerating: (isGenerating: boolean) => {
        set({ isGenerating })
      },
    }),
    {
      name: 'planning-storage',
      partialize: (state) => ({
        plans: state.plans.filter(plan => plan && plan.title),
        currentPlan: state.currentPlan,
      }),
    }
  )
)