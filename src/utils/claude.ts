interface DebugPayload {
  request: object
  response: object
}

export class ClaudeApiError extends Error {
  readonly debugPayload: DebugPayload
  constructor(message: string, debugPayload: DebugPayload) {
    super(message)
    this.name = 'ClaudeApiError'
    this.debugPayload = debugPayload
  }
}

export async function identifyFoodFromPhoto(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<string[]> {
  const requestBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Image },
          },
          {
            type: 'text',
            text: "Tu es un assistant nutritionnel. Identifie tous les aliments visibles dans cette photo de repas. Réponds uniquement en JSON avec un tableau `aliments` contenant les noms en français. Sois précis et exhaustif.",
          },
        ],
      },
    ],
  }

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    })
  } catch (networkErr) {
    throw new ClaudeApiError('Network error', {
      request: requestBody,
      response: { error: networkErr instanceof Error ? networkErr.message : 'No response received' },
    })
  }

  const responseText = await response.text()
  let responseJson: object
  try { responseJson = JSON.parse(responseText) } catch { responseJson = { raw: responseText } }

  if (!response.ok) {
    // 401/403/429 have clear French messages — no debug file needed
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      throw new Error(`HTTP ${response.status}`)
    }
    throw new ClaudeApiError(`HTTP ${response.status}`, { request: requestBody, response: responseJson })
  }

  const text = (responseJson as { content?: { text?: string }[] }).content?.[0]?.text
  if (!text) {
    throw new ClaudeApiError('Missing content', { request: requestBody, response: responseJson })
  }

  let aliments: unknown
  try { aliments = JSON.parse(text).aliments } catch {
    throw new ClaudeApiError('Parse error', { request: requestBody, response: responseJson })
  }

  if (!Array.isArray(aliments)) {
    throw new ClaudeApiError('Invalid format', { request: requestBody, response: responseJson })
  }

  return aliments as string[]
}
