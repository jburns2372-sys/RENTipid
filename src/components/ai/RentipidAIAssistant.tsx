"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, AlertTriangle, CheckCircle2, Mic, MicOff, VolumeX, Volume2, VideoOff, MessageSquare } from 'lucide-react';
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

  // Digital Human States
  const [mode, setMode] = useState<'text' | 'digital_human'>('text');
  const [micConsent, setMicConsent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dhStatus, setDhStatus] = useState<'initializing' | 'active' | 'failed' | 'ended'>('ended');
  const [liveTranscript, setLiveTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Shared Context Path Simulation
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBot,
          prompt: userMessage.content,
          module,
          recordId,
          channel: mode
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
        content: 'Failed to connect to AI Command Layer. Fallback to text active.',
        isBlocked: true
      }]);
      if (mode === 'digital_human') setDhStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClear = () => setMessages([]);
  const handleSuggestedPrompt = (prompt: string) => setInput(prompt);

  const startDigitalHuman = () => {
    setMode('digital_human');
    setDhStatus('initializing');
    setTimeout(() => {
      setMicConsent(true);
      setDhStatus('active');
    }, 1000);
  };

  const fallbackToText = () => {
    setMode('text');
    setDhStatus('ended');
  };

  const endSession = () => {
    fallbackToText();
    setIsOpen(false);
  };

  const simulateSpeech = () => {
    if (dhStatus !== 'active' || isMuted) return;
    setLiveTranscript('Listening...');
    setTimeout(() => {
      setInput('Hello, I need help.');
      setLiveTranscript('');
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center group"
        aria-label="Ask RENTipid AI"
      >
        <Bot size={24} className="group-hover:animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 sm:p-0 sm:items-end sm:justify-end">
          <div className="bg-white sm:rounded-t-xl sm:rounded-b-none md:rounded-xl shadow-2xl w-full max-w-md h-[85vh] md:h-[600px] flex flex-col md:mb-6 md:mr-6 overflow-hidden">
            
            {/* Header */}
            <div className={`text-white p-4 flex justify-between items-center transition-colors ${mode === 'digital_human' ? 'bg-indigo-700' : 'bg-blue-600'}`}>
              <div className="flex items-center space-x-2">
                <Bot size={24} />
                <h3 className="font-semibold text-lg">{mode === 'digital_human' ? 'RENTipid Digital Human' : 'RENTipid AI'}</h3>
              </div>
              <div className="flex items-center space-x-3">
                {mode === 'text' ? (
                  <button onClick={startDigitalHuman} className="text-white hover:text-gray-200" title="Start Digital Human">
                    <VideoOff size={18} />
                  </button>
                ) : (
                  <button onClick={fallbackToText} className="text-white hover:text-gray-200" title="Switch to Text">
                    <MessageSquare size={18} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Context & Bot Selection */}
            {mode === 'text' && (
              <div className="bg-slate-50 border-b p-3 flex flex-col gap-2">
                <select 
                  value={selectedBot}
                  onChange={(e) => setSelectedBot(e.target.value as BotId)}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm p-1.5 bg-white border"
                >
                  {allowedBots.map(bot => <option key={bot} value={bot}>{bot}</option>)}
                </select>
              </div>
            )}

            {/* Disclaimer */}
            {mode === 'text' && (
              <div className="bg-amber-50 px-3 py-2 border-b border-amber-100 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>{disclaimerText}</p>
              </div>
            )}

            {/* Digital Human Area */}
            {mode === 'digital_human' && (
              <div className="bg-slate-900 h-48 relative flex items-center justify-center border-b">
                {dhStatus === 'initializing' && <div className="text-white animate-pulse">Connecting to Provider...</div>}
                {dhStatus === 'failed' && (
                  <div className="text-red-400 text-center">
                    <AlertTriangle className="mx-auto mb-2" />
                    Provider failed. Falling back to text.
                    <button onClick={fallbackToText} className="block mx-auto mt-2 text-sm underline text-blue-400">Continue in Text</button>
                  </div>
                )}
                {dhStatus === 'active' && (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 animate-pulse flex items-center justify-center">
                       <Bot size={48} className="text-white" />
                    </div>
                    {/* Media Controls */}
                    <div className="flex justify-center gap-4 text-white">
                      <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <button onClick={simulateSpeech} className={`p-2 rounded-full ${micConsent ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600'}`}>
                        {micConsent ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      <button onClick={endSession} className="p-2 bg-red-600 rounded-full hover:bg-red-500">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
                {/* Live Transcript Overlay */}
                {liveTranscript && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white p-2 rounded text-sm text-center">
                    {liveTranscript}
                  </div>
                )}
              </div>
            )}

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${mode === 'digital_human' ? 'bg-slate-50' : 'bg-gray-50'}`}>
              {messages.length === 0 && mode === 'text' && (
                <div className="text-center text-gray-400 mt-10">
                  <div className="flex justify-center mb-4 grayscale opacity-60">
                    <RentipidLogo variant="icon" size="xl" showText={false} />
                  </div>
                  <p className="text-sm">How can {selectedBot} help you today?</p>
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

            {/* Input Area (Shared between text and DH for typed input) */}
            <div className="bg-white border-t p-3">
              <div className="flex items-center gap-2">
                <button onClick={handleClear} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition" title="Clear chat">
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
