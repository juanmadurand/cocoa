export interface Answer {
  text: string
  messageId: string
  conversationId: string
}

export type GptEvent =
  | {
      type: 'error'
      error: string
    }
  | {
      type: 'done'
    }
  | {
      type: 'answer'
      data: Answer
    }
  | {
      type: 'request'
      data: GptRequestEventData
    }

export type GptRequestEventData = {
  /**
   * User input
   */
  query: string
  email?: EmailData
}

export interface GenerateAnswerParams {
  prompt: string
  onEvent: (event: GptEvent) => void
  signal?: AbortSignal
}

export interface Provider {
  generateAnswer(params: GenerateAnswerParams): Promise<{ cleanup?: () => void }>
}

export interface EmailData {
  /**
   * current user display name
   */
  author: string
  /**
   * messages from thread
   */
  messages: EmailThreadMessage[]
  /**
   * Email subject
   */
  subject: string
}

export interface EmailThreadMessage {
  date: Date
  from: string
  text: string
  to: string
}

export type EmailThreadData = {
  author: string
  text: string
  messages?: EmailThreadMessage[]
  subject?: string
}
