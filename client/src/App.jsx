import { useEffect, useRef, useState } from 'react'
import ToolRenderer from './components/ToolRenderer'
import set from 'lodash.set'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3000')

    ws.current.onmessage = e => {
      const { position, payload } = JSON.parse(e.data)
      setMessages(prev => {
        const next = [...prev]
        let bot = next.at(-1)
        if (!bot || bot.role !== 'bot') {
          bot = { role: 'bot', content: [] }
          next.push(bot)
        }

        const clone = Array.isArray(bot.content) ? [...bot.content] : []
        set(clone, position.replace(/^payload/, ''), payload)
        bot.content = clone
        next[next.length - 1] = bot
        return next
      })
    }
  }, [])

  useEffect(() => {
    console.log(messages)
  }, [messages])

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }])
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const text = input.trim()
    addMessage('user', text)
    setInput('')
    ws.current.send(JSON.stringify({ prompt: text }))
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <h1 className="text-2xl font-light mb-4 px-6 pt-6">Chat Assistant</h1>

      <div className="flex-1 overflow-y-auto border-t border-b border-gray-100 mb-4 p-6 flex flex-col gap-6">
        {messages.map((message, i) => (
          <div key={i} className={`flex gap-3 items-start ${message.role === 'bot' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'bot' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <span className="material-symbols-outlined text-sm">
                {message.role === 'bot' ? 'smart_toy' : 'person'}
              </span>
            </div>
            <div className={`flex-1 max-w-[80%] bg-gray-50 p-4 rounded-lg ${message.role === 'bot' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
              {message.role === 'bot' && Array.isArray(message.content)
                ? message.content.map((toolData, idx) => <ToolRenderer key={idx} toolData={toolData} />)
                : <p>{message.content}</p>
              }
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white px-6 pb-6 pt-3 border-t border-gray-100 relative">
        <div className="relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            type="text"
            className="w-full border border-gray-200 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
