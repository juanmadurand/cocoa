import { useClickAway } from '@geist-ui/core'
import { ChevronRightIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { useRef } from 'react'
import { CommentIcon } from './Icons'

export type QueryStatus = 'success' | 'error' | undefined

interface Props {
  onSubmit: (opt: string) => void
}

export function PromptModal({ onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [customText, setCustomText] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useClickAway(ref, () => {
    setOpen(false)
  })

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomText(e.target.value)
  }

  const handleSubmit = () => {
    if (!customText) {
      return
    }
    onSubmit(customText)
    setOpen(false)
    setCustomText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="gpt-dropdown">
      <button className="gpt-toolbar-btn" type="button" onClick={handleToggle}>
        <CommentIcon />
      </button>
      {open && (
        <div ref={ref} className="gpt-modal absolute translate-x-1/2 p-2 rounded-sm shadow">
          <div className="gpt-modal-body flex items-stretch">
            <textarea
              value={customText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Provide brief description of your answer"
              className="p-1 pr-4 flex-1 rounded-l-sm border-0 placeholder:text-slate-600"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="gpt-modal-submit items-center rounded-r-sm border-0"
            >
              <ChevronRightIcon fill="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
