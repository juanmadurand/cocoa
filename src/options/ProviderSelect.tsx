import { Button, Input, Select, Spinner, Tabs, useInput, useToasts } from '@geist-ui/core'
import { FC, useCallback, useState } from 'react'
import useSWR from 'swr'
import { getProviderConfigs, ProviderConfigs, ProviderType, saveProviderConfigs } from '../config'

interface ConfigProps {
  config: ProviderConfigs
}

const OPEN_AI_MODELS = ['text-davinci-003']

const ConfigPanel: FC<ConfigProps> = ({ config }) => {
  const [tab, setTab] = useState<ProviderType>(config.provider)
  const { bindings: apiKeyBindings } = useInput(config.configs[ProviderType.GPT3]?.apiKey ?? '')
  const [model, setModel] = useState(config.configs[ProviderType.GPT3]?.model ?? OPEN_AI_MODELS[0])
  const { setToast } = useToasts()

  const save = useCallback(async () => {
    if (tab === ProviderType.GPT3) {
      if (!apiKeyBindings.value) {
        alert('Please enter your OpenAI API key')
        return
      }
      if (!model || !OPEN_AI_MODELS.includes(model)) {
        alert('Please select a valid model')
        return
      }
    }
    await saveProviderConfigs(tab, {
      [ProviderType.GPT3]: {
        model,
        apiKey: apiKeyBindings.value,
      },
    })
    setToast({ text: 'Changes saved', type: 'success' })
  }, [apiKeyBindings.value, model, setToast, tab])

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={tab} onChange={(v) => setTab(v as ProviderType)}>
        <Tabs.Item label="ChatGPT webapp" value={ProviderType.ChatGPT}>
          The API that powers ChatGPT webapp, free, but sometimes unstable
        </Tabs.Item>
        <Tabs.Item label="OpenAI API" value={ProviderType.GPT3}>
          <div className="flex flex-col gap-2">
            <span>
              OpenAI official API, more stable,{' '}
              <span className="font-semibold">charge by usage</span>
            </span>
            <div className="flex flex-row gap-2">
              <Select
                scale={2 / 3}
                value={model}
                onChange={(v) => setModel(v as string)}
                placeholder="model"
              >
                {OPEN_AI_MODELS.map((m) => (
                  <Select.Option key={m} value={m}>
                    {m}
                  </Select.Option>
                ))}
              </Select>
              <Input htmlType="password" label="API key" scale={2 / 3} {...apiKeyBindings} />
            </div>
            <span className="italic text-xs">
              You can find or create your API key{' '}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
            </span>
          </div>
        </Tabs.Item>
      </Tabs>
      <Button scale={2 / 3} ghost style={{ width: 20 }} type="success" onClick={save}>
        Save
      </Button>
    </div>
  )
}

function ProviderSelect() {
  const query = useSWR('provider-configs', async () => {
    const config = await getProviderConfigs()
    return { config }
  })
  if (query.isLoading) {
    return <Spinner />
  }
  return <ConfigPanel config={query.data!.config} />
}

export default ProviderSelect
