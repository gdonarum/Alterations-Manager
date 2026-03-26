'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  "What tickets are ready for pickup?",
  "How much did I make this month?",
  "Help me draft a text for a customer whose dress is ready",
  "What are the best times to schedule appointments tomorrow?",
  "Summarize today's schedule",
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! I'm your alterations business assistant. I can help you draft customer messages, suggest scheduling slots, review your revenue, and answer questions about your business. What do you need help with today?",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', data: { messages: [...messages, userMessage] } }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Sorry, I had trouble with that.' }])
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-purple-600" size={24} /> AI Assistant
        </h1>
        <p className="text-gray-500 text-sm mt-1">Ask me about scheduling, customers, revenue, or draft messages</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-200'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-gray-600" />}
            </div>
            <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
              {msg.content.split('\n').map((line, j) => <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><Bot size={16} className="text-gray-600" /></div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-6 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => sendMessage(p)} disabled={loading} className="whitespace-nowrap text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors disabled:opacity-50">
            {p}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex items-center gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything about your business..." disabled={loading} className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50" />
          <button type="submit" disabled={loading || !input.trim()} className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
