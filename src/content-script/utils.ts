import { GptRequestEventData } from '@/types'

export function logger(message?: any, ...args: any[]) {
  console.debug(`[GmailExt] ${message}`, ...args)
}

export function observeUntilCallback(cb: () => boolean) {
  return new Promise((resolve) => {
    if (cb()) {
      return resolve(true)
    }

    const observer = new MutationObserver(() => {
      if (cb()) {
        resolve(true)
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

export function waitForElemToBeVisible(selector: string) {
  return observeUntilCallback(() => !!document.querySelector(selector))
}

export function getPrompt(event: GptRequestEventData): string | null {
  const { email, query } = event

  if (!email) {
    return `Help me compose a new email. Please output only the reply body, no subject, no sender name. Short email: "${query}". Long email:`
  }

  const { author, subject, messages } = email

  const lastThread = messages[messages.length - 1]

  const threads = messages
    ?.map(
      (msg, index) =>
        `\n---Conversation thread ${index}--- \n(from ${msg.from}, on ${msg.date})\n ${msg.text}\n`,
    )
    .join(`\n`)

  return `Generate an answer to this email. 
  Please output only the reply body, no subject, no sender name.
  --- Email Start ---
  Subject: "${subject}"
  Sender name: "${lastThread.from}"
  Email thread: "${threads}"
  Replier name: "${author}"
  Short reply: "${query}"
  --- Email End ---
  Long reply:`
}
