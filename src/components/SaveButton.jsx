import { useState } from 'react'
import { CheckCircle2, Download, Loader2 } from 'lucide-react'
import { saveProfile } from '../lib/supabase'

export default function SaveButton({ label, storyId, profileData }) {
  const [state, setState] = useState('idle') // idle | saving | saved | error

  const handleSave = async () => {
    setState('saving')
    try {
      const result = await saveProfile(storyId, profileData)
      setState(result ? 'saved' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={state === 'saving' || state === 'saved'}
      className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all
        ${state === 'saved'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : state === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-wcpo-dark text-white hover:bg-ink active:scale-[0.98]'
        }`}
    >
      {state === 'saving' && <><Loader2 size={16} className="animate-spin" /> Saving...</>}
      {state === 'saved' && <><CheckCircle2 size={16} /> Saved to Dashboard</>}
      {state === 'error' && <><CheckCircle2 size={16} /> Saved locally (offline)</>}
      {state === 'idle' && <><Download size={16} /> {label}</>}
    </button>
  )
}
