import { motion } from 'framer-motion'
import { useConfig } from '../ConfigContext'
import {
  SliderInput,
  ButtonArrayInput,
  DropdownInput,
  QuizInput,
  CheckboxGroupInput,
  RadioGroupInput,
  MapSelectInput,
} from '../inputs'

const inputComponents = {
  'slider': SliderInput,
  'button-array': ButtonArrayInput,
  'buttonArray': ButtonArrayInput,
  'dropdown': DropdownInput,
  'select': DropdownInput,
  'quiz': QuizInput,
  'checkbox-group': CheckboxGroupInput,
  'checkboxGroup': CheckboxGroupInput,
  'multiselect': CheckboxGroupInput,
  'radio': RadioGroupInput,
  'radio-group': RadioGroupInput,
  'radioGroup': RadioGroupInput,
  'map-select': MapSelectInput,
  'mapSelect': MapSelectInput,
}

export default function InputSection({ inputs }) {
  const { inputState, setInput } = useConfig()

  if (!Array.isArray(inputs) || inputs.length === 0) return null

  return (
    <section className="mb-10">
      {inputs.map((def, i) => {
        const Component = inputComponents[def.type]
        if (!Component) return null

        // Build props common to all inputs
        const value = inputState[def.id]

        // For quiz inputs the callback shape differs (onAnswer vs onChange)
        const isQuiz = def.type === 'quiz'

        return (
          <motion.div
            key={def.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Component
              {...def}
              value={isQuiz ? undefined : value}
              answers={isQuiz ? value : undefined}
              onChange={
                isQuiz
                  ? undefined
                  : (val, optionData) => setInput(def.id, optionData ?? val)
              }
              onAnswer={
                isQuiz
                  ? (_qId, _val, _opt, allAnswers) => setInput(def.id, allAnswers)
                  : undefined
              }
            />
          </motion.div>
        )
      })}
    </section>
  )
}
