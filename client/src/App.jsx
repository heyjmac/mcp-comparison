import { useState } from 'react'
import ToolRenderer from './components/ToolRenderer'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }])
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input.trim()
    addMessage('user', text)
    setInput('')

    const res = await fetch('/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    })
    const data = await res.json()
    addMessage('bot', data.toolResults)
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <h1 className="text-2xl font-light mb-4 px-6 pt-6">Chat Assistant</h1>

      <div className="flex-1 overflow-y-auto border-t border-b border-gray-100 mb-4 p-6 flex flex-col gap-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 items-start ${m.role === 'bot' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'bot' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <span className="material-symbols-outlined text-sm">
                {m.role === 'bot' ? 'smart_toy' : 'person'}
              </span>
            </div>
            <div className={`flex-1 max-w-[80%] bg-gray-50 p-4 rounded-lg ${m.role === 'bot' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
              {m.role === 'bot' && Array.isArray(m.content)
                ? m.content.map((r, idx) => <ToolRenderer key={idx} tool={r.tool} output={r.output} />)
                : <p>{m.content}</p>}
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

      <div className="sticky bottom-0 bg-white flex items-center gap-2 text-sm text-gray-500 px-6 pb-6 pt-3 border-t border-gray-100">
        <span className="mr-1">Tools:</span>
        <div className="px-3 py-1 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">email</span>
          <span>Email</span>
        </div>
        <div className="px-3 py-1 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-red-500">picture_as_pdf</span>
          <span>PDF</span>
        </div>
        <div className="px-3 py-1 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-blue-600">description</span>
          <span>Word</span>
        </div>
      </div>
    </div>
  )
}

export default App
