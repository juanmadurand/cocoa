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
    // TODO: Support for compose new email
    return `Help me write an email. Short email: "${query}". Long email:`
  }

  const { author, subject, messages } = email

  const lastThread = messages[messages.length - 1]

  const threads = messages
    ?.map(
      (msg, index) =>
        `\n---Conversation thread ${index}--- \n(from ${msg.from}, on ${msg.date})\n ${msg.text}\n`,
    )
    .join(`\n`)

  return `
  Subject: "${subject}"
  Sender name: "${lastThread.from}"
  Email body: " ${threads}"
  Replier name: "${author}"
  Short reply: "${query}"
  Long reply:`
}
