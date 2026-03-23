import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { runCalculations } from './FormulaEngine'

const ConfigContext = createContext(null)

export function ConfigProvider({ config, children }) {
  const [inputState, setInputState] = useState(() => {
    // Initialise from defaults defined in config.inputs
    const initial = {}
    if (Array.isArray(config?.inputs)) {
      for (const inp of config.inputs) {
        if (inp.defaultValue !== undefined) {
          initial[inp.id] = inp.defaultValue
        }
      }
    }
    return initial
  })

  const setInput = useCallback((id, value) => {
    setInputState((prev) => ({ ...prev, [id]: value }))
  }, [])

  // Recalculate whenever inputs change
  const calculations = useMemo(() => {
    const calcDefs = config?.calculations ?? config?.results?.calculations ?? []
    return runCalculations(calcDefs, inputState)
  }, [config, inputState])

  // Check whether every id in the list has a non-null/undefined value
  const allRequiredFilled = useCallback(
    (requiredIds) => {
      if (!Array.isArray(requiredIds) || requiredIds.length === 0) return true
      return requiredIds.every((id) => {
        const v = inputState[id]
        return v !== undefined && v !== null && v !== ''
      })
    },
    [inputState],
  )

  // Snapshot of state suitable for saving / narrative generation
  const getProfileData = useCallback(() => {
    return { ...inputState, ...calculations }
  }, [inputState, calculations])

  const value = useMemo(
    () => ({ inputState, calculations, setInput, allRequiredFilled, getProfileData }),
    [inputState, calculations, setInput, allRequiredFilled, getProfileData],
  )

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside <ConfigProvider>')
  return ctx
}
