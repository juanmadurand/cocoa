import { getPrompt, logger } from '@/content-script/utils'
import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderType } from '../config'
import { GptRequestEventData, Provider } from '../types'
import { ChatGPTProvider, getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
import { OpenAIProvider } from './providers/openai'

// Returns either ChatGPT or OpenAI Providers depending on config
async function getProvider(): Promise<Provider> {
  const providerConfigs = await getProviderConfigs()
  if (providerConfigs.provider === ProviderType.ChatGPT) {
    const token = await getChatGPTAccessToken()
    return new ChatGPTProvider(token)
  } else if (providerConfigs.provider === ProviderType.GPT3) {
    const { apiKey, model } = providerConfigs.configs[ProviderType.GPT3]!
    return new OpenAIProvider(apiKey, model)
  } else {
    throw new Error(`Unknown provider ${providerConfigs.provider}`)
  }
}

async function generateAnswers(port: Browser.Runtime.Port, event: GptRequestEventData) {
  const provider = await getProvider()

  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })

  const prompt = getPrompt(event)

  if (!prompt) {
    // TODO: Handle error
    return
  }
  const { cleanup } = await provider.generateAnswer({
    prompt,
    signal: controller.signal,
    onEvent(event) {
      port.postMessage(event)
    },
  })
}

Browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (event) => {
    console.debug('received msg', event)
    try {
      if (event.type === 'request') {
        await generateAnswers(port, event.data as GptRequestEventData)
      }
    } catch (err: any) {
      console.error(err)
      logger('Error fetching answer', err)

      let error
      // try to parse gpt response
      try {
        const body = JSON.parse(err.message)
        if (body?.detail) {
          error = body.detail
        }
      } catch (e) {
        error = err.message
      }
      port.postMessage({ type: 'error', error })
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const token = await getChatGPTAccessToken()
    await sendMessageFeedback(token, message.data)
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    Browser.runtime.openOptionsPage()
  } else if (message.type === 'GET_ACCESS_TOKEN') {
    return getChatGPTAccessToken()
  }
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  }
})
