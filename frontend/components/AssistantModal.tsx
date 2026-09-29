'use client';

import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowUpRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { queryAssistant } from '@/lib/api';

export default function AssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; projects?: any[] }>>([
    {
      sender: 'assistant',
      text: "Hello! I am Project Drishti's analytical assistant. Ask me questions like: 'Which projects need attention?', 'Why is Project PRJ-ROA-102 high risk?', or 'Which sector has highest risk?'",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'Which projects need attention?',
    'Which sector has the highest average risk?',
    'Show projects with schedule risk above 70.',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await queryAssistant(query);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          projects: res.projects,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to query portfolio engine. Please check backend status.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3.5 shadow-xl shadow-blue-500/30 flex items-center space-x-2 transition-all transform hover:scale-105"
        title="Ask Project Drishti Assistant"
      >
        <Sparkles className="w-5 h-5 animate-spin-slow" />
        <span className="text-xs font-semibold pr-1 hidden sm:inline">Ask Drishti AI</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold">Drishti Analytical Assistant</h3>
                <p className="text-[10px] text-slate-400">Offline Rule & Metric Engine • Zero external API</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.projects && m.projects.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5">
                      <p className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider">
                        Referenced Projects:
                      </p>
                      {m.projects.map((p) => (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 text-blue-700 hover:text-blue-900 text-[11px] font-medium transition"
                        >
                          <span className="truncate">{p.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 ml-1" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-slate-500 text-xs p-2">
                <Bot className="w-4 h-4 animate-bounce text-blue-600" />
                <span>Evaluating portfolio signals...</span>
              </div>
            )}
          </div>

          {/* Prompt Chips */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
            <HelpCircle className="w-3 h-3 text-slate-400 flex-shrink-0" />
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about project risks, sectors..."
              className="flex-1 bg-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
