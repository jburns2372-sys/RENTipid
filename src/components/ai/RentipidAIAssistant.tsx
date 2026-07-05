"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BotId, BOTS } from '@/lib/ai/ai-permissions';
import RentipidLogo from '@/components/brand/RentipidLogo';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isBlocked?: boolean;
}

interface RentipidAIAssistantProps {
  module: string;
  recordId?: string;
  userRole?: string;
  allowedBots: BotId[];
  disclaimerText: string;
}

export default function RentipidAIAssistant({ module, recordId, userRole, allowedBots, disclaimerText }: RentipidAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedBot, setSelectedBot] = useState<BotId>(allowedBots[0] || BOTS.CONCIERGE);

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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBot,
          prompt: userMessage.content,
          module,
          recordId,
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.error || 'Unknown error occurred.',
        isBlocked: data.isBlocked
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
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const suggestedPrompts = [
    "What should I do next?",
    "Explain this status.",
    "Are there any missing documents?"
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        aria-label="Ask RENTipid AI"
      >
        <Bot size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 sm:p-0 sm:items-end sm:justify-end">
          <div className="bg-white sm:rounded-t-xl sm:rounded-b-none md:rounded-xl shadow-2xl w-full max-w-md h-[85vh] md:h-[600px] flex flex-col md:mb-6 md:mr-6 overflow-hidden">
            
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot size={24} />
                <h3 className="font-semibold text-lg">RENTipid AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            
            {/* Context & Bot Selection */}
            <div className="bg-slate-50 border-b p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Module: <strong className="text-gray-700">{module}</strong></span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  Level 1-3 Only
                </span>
              </div>
              <select 
                value={selectedBot}
                onChange={(e) => setSelectedBot(e.target.value as BotId)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm p-1.5 bg-white border"
              >
                {allowedBots.map(bot => (
                  <option key={bot} value={bot}>{bot}</option>
                ))}
              </select>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 px-3 py-2 border-b border-amber-100 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p>{disclaimerText}</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-10">
                  <div className="flex justify-center mb-4 grayscale opacity-60">
                    <RentipidLogo variant="icon" size="xl" showText={false} />
                  </div>
                  <p className="text-sm">How can {selectedBot} help you today?</p>
                  <div className="mt-6 space-y-2">
                    {suggestedPrompts.map((p, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSuggestedPrompt(p)}
                        className="block w-full text-left bg-white border rounded-lg px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : msg.isBlocked 
                        ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                        : 'bg-white text-gray-800 border rounded-bl-none shadow-sm'
                  }`}>
                    {msg.role === 'assistant' && msg.isBlocked && (
                      <div className="flex items-center gap-1 text-red-600 mb-1 font-semibold text-xs">
                        <AlertTriangle size={12} /> Blocked Request
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border text-gray-500 text-sm rounded-2xl rounded-bl-none px-4 py-2 shadow-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClear}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-full transition"
                  title="Clear chat"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full py-2 pl-4 pr-10 text-sm transition-all"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-gray-400 transition"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
