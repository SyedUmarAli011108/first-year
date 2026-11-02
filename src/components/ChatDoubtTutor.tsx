import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  FileText,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { ChatMessage, SubjectName } from '../types/study';
import { SUBJECT_META_MAP, STUDY_DATA } from '../data/studyData';
import { SubjectIcon } from './Logo';

interface ChatDoubtTutorProps {
  subject: SubjectName;
}

export function ChatDoubtTutor({ subject }: ChatDoubtTutorProps) {
  const { activeNote } = useNotes();
  const meta = SUBJECT_META_MAP[subject];

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'model',
      content: `Hello! I'm your **StudyBuddy AI Tutor** for **${meta.fullLabel}**.
Ask me any engineering concept, reaction mechanism, algorithm tracing, or doubt from your lecture notes. I will give you a clear, numbered step-by-step explanation with real-world examples!`,
      timestamp: 'Just now',
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [useNotesGrounding, setUseNotesGrounding] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const notesContext =
        useNotesGrounding && activeNote
          ? `NOTE TITLE: ${activeNote.title} (${activeNote.subject})\n${activeNote.content}`
          : '';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          subject: meta.fullLabel,
          notesContext,
          model: selectedModel,
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!response.ok) {
          const cleanErr = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 150).trim();
          throw new Error(`Chat server error (${response.status}): ${cleanErr || 'Request failed'}`);
        }
        throw new Error('Server returned an unexpected format during chat response.');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Chat request failed with status ${response.status}`);
      }

      const botMessage: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'model',
        content: data.reply || 'No answer returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err?.message || 'Error communicating with AI tutor. Please check your connection and API key.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_$\\]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Chat history cleared. What engineering topic would you like to explore next in **${meta.fullLabel}**?`,
        timestamp: 'Just now',
        modelUsed: selectedModel,
      },
    ]);
    setErrorMessage(null);
  };

  // Curated question suggestions for this subject
  const syllabusDoubts = STUDY_DATA.find((d) => d.subject === subject)?.doubts ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[650px] overflow-hidden">
      {/* Chat Top Controls & Persona Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">StudyBuddy AI Tutor</h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Multi-Turn Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Role: First-Year Engineering Professor &amp; Concept Coach
            </p>
          </div>
        </div>

        {/* Model Switcher & Note Grounding Pill */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Selection */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="gemini-3.8-flash: General tasks (Recommended)"
            >
              Flash 3.8
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="gemini-3.1-flash-lite: Fast responses"
            >
              Flash Lite
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                selectedModel === 'gemini-4-argon'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="gemini-4-argon: Complex reasoning & STEM"
            >
              Argon 4
            </button>
          </div>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Grounding Context Banner */}
      {activeNote && (
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Grounding in note: <strong className="font-semibold">{activeNote.title}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUseNotesGrounding((prev) => !prev)}
            className="text-[11px] font-semibold text-blue-700 underline hover:text-blue-950 shrink-0 cursor-pointer"
          >
            {useNotesGrounding ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      )}

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isBot
                    ? 'bg-slate-50 text-slate-900 border border-slate-200/80 shadow-xs'
                    : 'bg-blue-600 text-white rounded-br-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                <div
                  className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
                    isBot ? 'text-slate-400' : 'text-blue-200'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isBot && (
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && <span>{msg.modelUsed}</span>}
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className={`hover:text-slate-700 flex items-center gap-1 cursor-pointer ${
                          speakingId === msg.id ? 'text-blue-600 font-semibold' : ''
                        }`}
                        title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-500 animate-pulse" />
                            <span className="text-rose-500">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!isBot && (
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Analyzing engineering concepts with {selectedModel}...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40 overflow-x-auto whitespace-nowrap flex items-center gap-2 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0">Ask:</span>
        {syllabusDoubts.slice(0, 3).map((d) => (
          <button
            key={d.question}
            type="button"
            onClick={() => handleSendMessage(d.question)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors shrink-0 cursor-pointer"
          >
            {d.question.length > 45 ? `${d.question.slice(0, 45)}...` : d.question}
          </button>
        ))}
        {subject === 'PSC' && (
          <button
            type="button"
            onClick={() => handleSendMessage('How does pointer arithmetic differ from integer arithmetic in C?')}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors shrink-0 cursor-pointer"
          >
            Pointer arithmetic in C?
          </button>
        )}
        {subject === 'Communication Skills' && (
          <button
            type="button"
            onClick={() => handleSendMessage('Explain the 7 Cs of technical report writing with an engineering example.')}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors shrink-0 cursor-pointer"
          >
            Explain the 7 Cs of technical writing
          </button>
        )}
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask a doubt in ${meta.fullLabel}...`}
          disabled={isLoading}
          className="flex-1 min-h-[44px] px-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
