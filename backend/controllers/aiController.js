// const https = require('https')

// const aiChat = (req, res) => {
//   const { messages, system } = req.body

//   if (!messages || !Array.isArray(messages)) {
//     return res.status(400).json({ error: 'messages array is required' })
//   }

//   const apiKey = process.env.GEMINI_API_KEY
//   if (!apiKey || apiKey === 'your_gemini_api_key_here') {
//     return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env' })
//   }

//   const geminiMessages = messages.map(m => ({
//     role: m.role === 'assistant' ? 'model' : 'user',
//     parts: [{ text: m.content }],
//   }))

//   const body = JSON.stringify({
//     system_instruction: { parts: [{ text: system || '' }] },
//     contents: geminiMessages,
//     generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
//   })

//   // SSE headers
//   res.setHeader('Content-Type',  'text/event-stream')
//   res.setHeader('Cache-Control', 'no-cache')
//   res.setHeader('Connection',    'keep-alive')
//   res.flushHeaders()

//   const options = {
//     hostname: 'generativelanguage.googleapis.com',
//     path:     `/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`,
//     method:   'POST',
//     headers: {
//       'Content-Type':   'application/json',
//       'Content-Length': Buffer.byteLength(body),
//     },
//   }

//   const apiReq = https.request(options, (apiRes) => {
//     // Non-200 from Gemini — read error body and forward it
//     if (apiRes.statusCode !== 200) {
//       let errBody = ''
//       apiRes.on('data', c => errBody += c)
//       apiRes.on('end', () => {
//         console.error('Gemini HTTP error:', apiRes.statusCode, errBody)
//         let message = `Gemini API error ${apiRes.statusCode}`
//         try {
//           const parsed = JSON.parse(errBody)
//           message = parsed?.error?.message || message
//         } catch (_) {}
//         res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
//         res.write('data: [DONE]\n\n')
//         res.end()
//       })
//       return
//     }

//     let buffer = ''

//     apiRes.on('data', (chunk) => {
//       buffer += chunk.toString()

//       // Process all complete lines in the buffer
//       let newlineIdx
//       while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
//         const line = buffer.slice(0, newlineIdx).trim()
//         buffer = buffer.slice(newlineIdx + 1)

//         if (!line.startsWith('data:')) continue

//         const data = line.slice(5).trim()
//         if (!data || data === '[DONE]') continue

//         try {
//           const parsed = JSON.parse(data)

//           // Check for API-level error inside the SSE payload
//           if (parsed.error) {
//             console.error('Gemini stream error:', parsed.error)
//             res.write(`data: ${JSON.stringify({ error: parsed.error.message || 'Gemini error' })}\n\n`)
//             continue
//           }

//           const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
//           if (text) {
//             // Forward in the same format the frontend already expects
//             res.write(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
//           }
//         } catch (parseErr) {
//           // Partial JSON — put back and wait for more data
//           buffer = line + '\n' + buffer
//           break
//         }
//       }
//     })

//     apiRes.on('end', () => {
//       res.write('data: [DONE]\n\n')
//       res.end()
//     })

//     apiRes.on('error', (err) => {
//       console.error('Gemini response stream error:', err.message)
//       res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
//       res.write('data: [DONE]\n\n')
//       res.end()
//     })
//   })

//   apiReq.on('error', (err) => {
//     console.error('Gemini request error:', err.message)
//     // Headers might not be sent yet if connection failed immediately
//     if (!res.headersSent) {
//       res.status(500).json({ error: err.message })
//     } else {
//       res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
//       res.write('data: [DONE]\n\n')
//       res.end()
//     }
//   })

//   apiReq.write(body)
//   apiReq.end()

//   req.on('close', () => apiReq.destroy())
// }

// module.exports = { aiChat }



const https = require('https')

const MAX_MESSAGES   = 20
const MAX_MSG_LENGTH = 10000  // per message
const MAX_SYS_LENGTH = 5000

const aiChat = (req, res) => {
  const { messages, system } = req.body

  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: 'messages array is required' })

  if (messages.length > MAX_MESSAGES)
    return res.status(400).json({ error: `Too many messages (max ${MAX_MESSAGES})` })

  if (messages.some(m => !m.content || m.content.length > MAX_MSG_LENGTH))
    return res.status(400).json({ error: `Message too long (max ${MAX_MSG_LENGTH} chars)` })

  if (system && system.length > MAX_SYS_LENGTH)
    return res.status(400).json({ error: 'System prompt too long' })

  // Sanitize roles — only allow 'user' and 'assistant'
  const validRoles = new Set(['user', 'assistant'])
  if (messages.some(m => !validRoles.has(m.role)))
    return res.status(400).json({ error: 'Invalid message role' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here')
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env' })

  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system || '' }] },
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
  })

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.flushHeaders()

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path:     `/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`,
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }

  const apiReq = https.request(options, (apiRes) => {
    if (apiRes.statusCode !== 200) {
      let errBody = ''
      apiRes.on('data', c => errBody += c)
      apiRes.on('end', () => {
        let message = `Gemini API error ${apiRes.statusCode}`
        try { message = JSON.parse(errBody)?.error?.message || message } catch (_) {}
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      })
      return
    }

    let buffer = ''
    apiRes.on('data', (chunk) => {
      buffer += chunk.toString()
      let newlineIdx
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim()
        buffer = buffer.slice(newlineIdx + 1)
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            res.write(`data: ${JSON.stringify({ error: parsed.error.message || 'Gemini error' })}\n\n`)
            continue
          }
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) res.write(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
        } catch (_) {
          buffer = line + '\n' + buffer
          break
        }
      }
    })
    apiRes.on('end', () => { res.write('data: [DONE]\n\n'); res.end() })
    apiRes.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
    })
  })

  apiReq.on('error', (err) => {
    if (!res.headersSent) res.status(500).json({ error: err.message })
    else { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.write('data: [DONE]\n\n'); res.end() }
  })

  apiReq.write(body)
  apiReq.end()
  req.on('close', () => apiReq.destroy())
}

module.exports = { aiChat };