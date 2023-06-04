import '@/base.css'
import { render } from 'preact'
import Browser from 'webextension-polyfill'
import ButtonToolbar from './components/ButtonToolbar'
import './styles.scss'
import { waitForElemToBeVisible } from './utils'

// inject libs, need to be in the DOM to access window variable
const j = document.createElement('script')
j.src = Browser.runtime.getURL('libs.js')
;(document.head || document.documentElement).appendChild(j)

const CONTAINER_CN = 'gpt-toolbar-container'

function insertComposeToolbar() {
  for (const elem of document.querySelectorAll('[command="Files"]')) {
    const parentBar = elem.parentElement?.parentElement?.parentElement
    const sendButton = parentBar?.firstElementChild

    if (!sendButton) {
      console.debug('No Toolbar found')
      continue
    }

    const textarea = sendButton.closest('.M9')?.querySelector('div[g_editable="true"]')

    if (!textarea) {
      return
    }

    let alreadyAdded = false
    for (const child of parentBar.children) {
      if (child.classList.contains(CONTAINER_CN)) {
        alreadyAdded = true
      }
    }

    if (alreadyAdded) {
      continue
    }

    const root = document.createElement('td')
    root.className = CONTAINER_CN
    sendButton.insertAdjacentElement('afterend', root)

    const isReplyOrForward = !!sendButton.closest('td.Bu')

    render(<ButtonToolbar isReply={isReplyOrForward} textarea={textarea as HTMLElement} />, root)
  }
}

async function run() {
  await waitForElemToBeVisible('#gptmail-info')

  // This covers the case where the user refresh with the reply box opened
  setTimeout(insertComposeToolbar, 500)

  const composeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const added of mutation.addedNodes) {
        if (added.nodeType === Node.ELEMENT_NODE) {
          const elem = added as Element
          if (elem.classList && elem.classList.contains('M9')) {
            insertComposeToolbar()
          }
        }
      }
    }
  })

  composeObserver.observe(document.body, { subtree: true, childList: true })
}

run()
