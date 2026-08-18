"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertTriangle, FileText, CheckCircle, RefreshCcw, MessageSquare, History, Video, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isBlocked?: boolean;
  cards?: any[];
}

export interface SupportSuggestion {
  id: string;
  text: string;
  type: 'question' | 'topic';
  intent?: string;
}

const useSuggestions = () => {
  const [recommendedQuestions, setRecommendedQuestions] = useState<SupportSuggestion[]>([]);
  const [topicChips, setTopicChips] = useState<SupportSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    fetch('/api/ai/suggestions')
      .then(res => res.json())
      .then(data => {
        setRecommendedQuestions(data.questions || []);
        setTopicChips(data.topics || []);
      })
      .catch(err => console.error('Failed to load suggestions:', err))
      .finally(() => setIsLoadingSuggestions(false));
  }, []);

  return { recommendedQuestions, topicChips, isLoadingSuggestions };
};

export default function HelpPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [requestContext, setRequestContext] = useState<{ module: string; recordId?: string }>({ module: 'Help' });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionState, setSessionState] = useState<'initializing' | 'active' | 'failed' | 'ended'>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { recommendedQuestions, topicChips } = useSuggestions();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const module = params.get('entityType') || params.get('route') || 'Help';
    const recordId = params.get('entityId') || undefined;
    setRequestContext({ module, recordId });

    const loadHistory = async () => {
      const historyParams = new URLSearchParams({ module });
      if (recordId) historyParams.set('recordId', recordId);
      try {
        const response = await fetch(`/api/ai/chat?${historyParams.toString()}`);
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (cancelled) return;
        setConversationId(typeof data.conversationId === 'string' ? data.conversationId : null);
        setMessages(Array.isArray(data.messages)
          ? data.messages
              .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
              .map((message: Message) => ({ id: message.id, role: message.role, content: message.content }))
          : []);
      } catch {
        // Anonymous users retain the public, non-persistent help experience.
      }
    };
    void loadHistory();
    return () => { cancelled = true; };
  }, []);

  const sendCommand = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Shared Context Path Simulation (using canonical AI architecture)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: 'Concierge',
          prompt: text,
          module: requestContext.module,
          recordId: requestContext.recordId,
          channel: 'help',
          conversationId,
        }),
      });

      const data = await response.json();
      if (typeof data.conversationId === 'string') setConversationId(data.conversationId);
      
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

  const handleSend = () => {
    sendCommand(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleQuestionClick = (question: string) => {
    sendCommand(question);
  };

  const handleTopicClick = (topic: string) => {
    setInput(`I need help with ${topic.toLowerCase()}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
            <Bot className="text-blue-600" size={32} /> RENTipid Support
          </h1>
          <p className="text-gray-600 mt-1">Select a question, choose a topic, or tell me exactly what you need.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
            <History size={16} /> My Cases
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition shadow-sm">
            <Video size={16} /> Digital Human
          </button>
          <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Active
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full">
              
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
                  <Bot size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">How can I help you today?</h2>
              </div>

              {/* Topic Chips */}
              <div className="w-full mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Topics</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {topicChips.map(topic => (
                    <button 
                      key={topic.id}
                      onClick={() => handleTopicClick(topic.text)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-sm font-medium transition-all shadow-sm"
                    >
                      {topic.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Questions */}
              <div className="w-full">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recommended</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {recommendedQuestions.map(q => (
                    <button 
                      key={q.id}
                      onClick={() => handleQuestionClick(q.text)}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white text-left hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-blue-700">{q.text}</span>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>
              
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                  : msg.isBlocked 
                    ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none shadow-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}>
                {msg.role === 'assistant' && msg.isBlocked && (
                  <div className="flex items-center gap-2 text-red-600 mb-3 font-bold text-xs uppercase tracking-wide border-b border-red-200 pb-2">
                    <AlertTriangle size={16} /> Blocked by Policy
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
              </div>
              
              {/* Context Cards */}
              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-3 max-w-[90%] sm:max-w-[80%] md:max-w-[70%] grid gap-3 grid-cols-1 w-full">
                  {msg.cards.map((card, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-800">
                        {card.type === 'case' ? <FileText size={18} className="text-blue-600" /> : <CheckCircle size={18} className="text-green-600" />}
                        {card.title}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                      {card.action && (
                        <button className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto">
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
              <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                <Bot size={18} className="text-blue-400" />
                <div className="flex gap-1.5 ml-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="flex flex-col gap-2 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or describe an issue..."
                className="flex-1 bg-gray-50 border border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-4 pl-5 pr-14 text-base transition-all shadow-inner outline-none"
                disabled={isLoading || sessionState !== 'active'}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading || sessionState !== 'active'}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:bg-gray-400 hover:bg-blue-700 transition shadow-sm"
              >
                <Send size={20} className={input.trim() && !isLoading ? "translate-x-0.5" : ""} />
              </button>
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-400">RENTipid AI Support handles inquiries automatically. Use the History button to check existing cases.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
