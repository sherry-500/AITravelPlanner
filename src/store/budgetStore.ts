import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  planId?: string
}

interface BudgetState {
  expenses: Expense[]
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  getExpensesByPlan: (planId: string) => Expense[]
  getTotalExpenses: (planId?: string) => number
  getExpensesByCategory: (planId?: string) => Record<string, number>
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense: Expense) => {
        set((state) => ({
          expenses: [...state.expenses, expense],
        }))
      },

      updateExpense: (id: string, updates: Partial<Expense>) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...updates } : expense
          ),
        }))
      },

      deleteExpense: (id: string) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }))
      },

      getExpensesByPlan: (planId: string) => {
        return get().expenses.filter((expense) => expense.planId === planId)
      },

      getTotalExpenses: (planId?: string) => {
        const expenses = planId
          ? get().expenses.filter((expense) => expense.planId === planId)
          : get().expenses
        return expenses.reduce((total, expense) => total + expense.amount, 0)
      },

      getExpensesByCategory: (planId?: string) => {
        const expenses = planId
          ? get().expenses.filter((expense) => expense.planId === planId)
          : get().expenses
        
        return expenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        }, {} as Record<string, number>)
      },
    }),
    {
      name: 'budget-storage',
    }
  )
)