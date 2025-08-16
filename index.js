import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { WebSocketServer } from 'ws'
import { toolExecutors, tools } from './tools.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const clientDistPath = path.join(__dirname, 'client', 'dist')
app.use(express.static(clientDistPath))
app.get('/', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

const server = app.listen(3000, () => console.log('http://localhost:3000'))
const wss = new WebSocketServer({ server })

const sendChunks = (ws, obj, basePath = 'payload') => {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => sendChunks(ws, v, `${basePath}[${i}]`))
  } else if (obj && typeof obj === 'object') {
    for (const key in obj) {
      sendChunks(ws, obj[key], `${basePath}.${key}`)
    }
  } else {
    ws.send(JSON.stringify({ position: basePath, payload: obj }))
  }
}

wss.on('connection', ws => {
  ws.on('message', async message => {
    const { prompt } = JSON.parse(message)

    const body = {
      contents: [{
        role: 'user',
        parts: [{
          text: `You're a helpful assistant that does all you can to help without asking questions. 
You have tools. 
You can use multiple tools. 
Decide on what tools you will call. 
Then use informUser to tell the user what you will do. 
Use informUser again to tell the user when the other functions are done. 
Never promise and forget calling the function. 
Answer in the user's language.
User request: ${prompt}`
        }]
      }],
      tools: [{ functionDeclarations: tools }]
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()
    const parts = data?.candidates?.[0]?.content?.parts || []

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      const base = `payload[${i}]`

      if (p.functionCall) {
        const { name, args } = p.functionCall
        sendChunks(ws, name, `${base}.tool`)
        sendChunks(ws, args, `${base}.args`)
        sendChunks(ws, { message: 'Loading...' }, `${base}.output`) // optional loading msg

        if (toolExecutors[name]) {
          ;(async () => {
            const output = await toolExecutors[name](args || {})
            sendChunks(ws, output, `${base}.output`)
          })()
        }
      } else if (p.text) {
        sendChunks(ws, { message: p.text }, `${base}.output`)
      }
    }
  })
})
