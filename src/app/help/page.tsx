"use client";

import React, { useState, useRef, useEffect } from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { Send, Bot, AlertTriangle, FileText, CheckCircle, RefreshCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isBlocked?: boolean;
  cards?: any[];
}

export default function HelpPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionState, setSessionState] = useState<'initializing' | 'active' | 'failed' | 'ended'>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Shared Context Path Simulation (using same backend API as RentipidAIAssistant)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: 'Concierge',
          prompt: userMessage.content,
          module: 'Help',
          channel: 'help'
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.error || 'Unknown error occurred.',
        isBlocked: data.isBlocked,
        cards: data.cards // Structured placeholders
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to connect to AI Command Layer.',
        isBlocked: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="text-blue-600" /> RENTipid Support
          </h1>
          <p className="text-gray-600 mt-1">Durable AI Workspace for your cases and questions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Session {sessionState}
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <Bot size={48} className="mx-auto mb-4 opacity-50" />
              <h2 className="text-xl text-gray-600 font-medium">How can we help you today?</h2>
              <p className="mt-2 text-sm">Ask a question or describe an issue with a booking, payment, or listing.</p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <button onClick={() => setInput('I have an issue with my recent booking')} className="p-3 border rounded-lg bg-white text-left hover:border-blue-400 transition shadow-sm">
                  <span className="font-medium text-gray-700 block text-sm">Booking Issue</span>
                  <span className="text-xs text-gray-500">Report damage or late return</span>
                </button>
                <button onClick={() => setInput('How do I list an item?')} className="p-3 border rounded-lg bg-white text-left hover:border-blue-400 transition shadow-sm">
                  <span className="font-medium text-gray-700 block text-sm">Provider Guide</span>
                  <span className="text-xs text-gray-500">Learn about listing items</span>
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : msg.isBlocked 
                    ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}>
                {msg.role === 'assistant' && msg.isBlocked && (
                  <div className="flex items-center gap-1 text-red-600 mb-2 font-semibold text-xs border-b border-red-200 pb-1">
                    <AlertTriangle size={14} /> Blocked by Policy
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{msg.content}</p>
              </div>
              
              {/* Render Structured Cards if any */}
              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-3 max-w-[85%] sm:max-w-[70%] space-y-2">
                  {msg.cards.map((card, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        {card.type === 'case' ? <FileText size={16} className="text-blue-500" /> : <CheckCircle size={16} className="text-green-500" />}
                        {card.title}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{card.description}</p>
                      {card.action && (
                        <button className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded transition">
                          {card.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border text-gray-500 text-sm rounded-2xl rounded-bl-none px-5 py-3 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t p-4 sm:p-6">
          <div className="flex items-center gap-3 max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 bg-gray-50 border border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl py-3 pl-4 pr-12 text-base transition-all shadow-inner"
              disabled={isLoading || sessionState !== 'active'}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading || sessionState !== 'active'}
              className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:bg-gray-400 hover:bg-blue-700 transition shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Retain the global assistant button as it may be useful globally, though we are IN the help workspace */}
      {/* We could hide it on this route if desired, but user requirements just say "replace the placeholder" */}
      <div className="hidden">
        <AIAssistantButton context="Help" />
      </div>
    </div>
  );
}
