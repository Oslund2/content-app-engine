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

  // Preprocess inputState: for checkbox-group (array) values, create a synthetic
  // object with summed .data fields so formulas like inputs.risk_factors.data.points work
  const processedInputs = useMemo(() => {
    const processed = { ...inputState }
    for (const [key, val] of Object.entries(processed)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        // Sum all numeric data fields across selected options
        const sumData = {}
        for (const opt of val) {
          if (opt.data && typeof opt.data === 'object') {
            for (const [dk, dv] of Object.entries(opt.data)) {
              if (typeof dv === 'number') {
                sumData[dk] = (sumData[dk] || 0) + dv
              }
            }
          }
        }
        // Store as object with .data for formula resolution, preserving .id for display
        processed[key] = { id: val.map(v => v.id || v).join(','), label: val.map(v => v.label || v.id || v).join(', '), data: sumData, _selected: val }
      }
    }
    return processed
  }, [inputState])

  // Recalculate whenever inputs change
  const calculations = useMemo(() => {
    const calcDefs = config?.calculations ?? config?.results?.calculations ?? []
    return runCalculations(calcDefs, processedInputs)
  }, [config, processedInputs])

  // Check whether every id in the list has a non-null/undefined value
  const allRequiredFilled = useCallback(
    (requiredIds) => {
      if (!Array.isArray(requiredIds) || requiredIds.length === 0) return true
      return requiredIds.every((id) => {
        const v = inputState[id]
        if (v === undefined || v === null || v === '') return false
        // Checkbox-group: array must have at least one selection
        if (Array.isArray(v)) return v.length > 0
        return true
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
