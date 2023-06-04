import { EmailData } from '@/types'

export function extractEmailThread(): EmailData | null {
  try {
    const dataContainer = document.getElementById('gptmail-info')
    const emailData = JSON.parse(dataContainer?.textContent || '')

    return emailData as EmailData
  } catch (error) {
    console.log('error extracting body', error)

    return null
  }
}
