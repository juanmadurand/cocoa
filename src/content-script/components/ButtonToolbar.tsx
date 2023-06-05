import logo from '@/logo.png'
import { GptEvent, GptRequestEventData } from '@/types'
import { CheckIcon, XIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { memo, useEffect } from 'react'
import Browser from 'webextension-polyfill'
import { logger } from '../utils'
import { extractEmailThread } from '../utils/dom'
import { PromptModal } from './PromptModal'

export type QueryStatus = 'success' | 'error' | undefined

type getAnswerProps = {
  query: string
  onStream: (answer: string) => void
  onDone: () => void
  onError: (message: string) => void
}

function fetchAnswer({ query, onStream, onDone, onError }: getAnswerProps): void {
  const port = Browser.runtime.connect()

  const listener = (msg: GptEvent) => {
    if (msg.type === 'error') {
      port.disconnect()
      onError(msg.error)
      logger('Error fetching answer', msg)
      return
    }
    if (msg.type === 'answer' && msg.data?.text) {
      onStream(msg.data.text)
    }
    if (msg.type === 'done') {
      onDone()

      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }

  // Open port to pass answer
  port.onMessage.addListener(listener)

  const emailData = extractEmailThread()

  if (!emailData) {
    return
  }

  const data: GptRequestEventData = {
    query,
    email: emailData,
  }

  // Send answer to background
  port.postMessage({
    type: 'request',
    data,
  })
}

interface Props {
  isReply: boolean
  textarea: HTMLElement
}

function ButtonToolbar({ isReply, textarea }: Props) {
  const [error, setError] = useState('')
  const [initialHtml, setInitialHtml] = useState('')

  // Save initial HTML to prepend gpt response
  useEffect(() => {
    if (!isReply) {
      return
    }
    const el = document.querySelector('[g_editable="true"]')
    if (el) {
      setInitialHtml(textarea.innerHTML)
    }
  }, [isReply, textarea])

  const onSubmit = (text: string) => {
    if (!textarea) {
      return
    }

    textarea.innerHTML = `<div class="gptloader"></div>`
    fetchAnswer({
      query: text,
      onStream: (answer) => {
        textarea.innerHTML = `${answer
          .replace(/\r/g, '')
          .replace(/\n/g, '<br>')
          .replaceAll('[YOUR_NAME]', '')}${initialHtml}`
      },
      onError: setError,
      onDone: () => {
        // Trigger resize of compose window
        window.dispatchEvent(new Event('resize'))
      },
    })
  }

  const renderBody = () => {
    if (error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') {
      return (
        <a
          className="gpt-toolbar-btn-login text-sm no-underline text-inherit px-2"
          href="https://chat.openai.com"
          target="_blank"
          rel="noreferrer"
        >
          Login at OpenAI
        </a>
      )
    }
    if (error) {
      return (
        <p>
          Failed to load response from ChatGPT:
          <span className="break-all block">{error}</span>
        </p>
      )
    }

    return (
      <>
        <button
          className="gpt-toolbar-btn rounded-l-md"
          type="button"
          onClick={() => onSubmit('positive')}
        >
          <CheckIcon />
        </button>
        <div className="divider"></div>
        <button className="gpt-toolbar-btn" type="button" onClick={() => onSubmit('negative')}>
          <XIcon />
        </button>
        <div className="divider"></div>
        <PromptModal onSubmit={onSubmit} />
      </>
    )
  }

  return (
    <div className="gpt-toolbar flex items-center antialiased !font-sans ml-4 rounded-md">
      {renderBody()}
      <div className="divider"></div>
      <img src={logo} className="w-5 h-5 px-2" />
    </div>
  )
}

export default memo(ButtonToolbar)
