import React, { useState } from 'react';
import { MessageSquare, Mic, FileText } from 'lucide-react';
import { SUBJECT_LIST } from '../data/studyData';
import { SubjectName, DoubtMode } from '../types/study';
import { SubjectIcon } from './Logo';
import { ChatDoubtTutor } from './ChatDoubtTutor';
import { VoiceDoubtTutor } from './VoiceDoubtTutor';
import { useNotes } from '../context/NotesContext';

export function DoubtSolverTab() {
  const { activeNote } = useNotes();
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>('Chemistry');
  const [doubtMode, setDoubtMode] = useState<DoubtMode>('chat');

  const handleSubjectChange = (subject: SubjectName) => {
    setSelectedSubject(subject);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Feature Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Doubt Solver &amp; AI Tutor
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Ask engineering doubts using our multi-turn AI chatbot or conversational voice tutor.
            </p>
          </div>

          {/* Interactive Modes Selector */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setDoubtMode('chat')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                doubtMode === 'chat'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Chatbot</span>
            </button>

            <button
              type="button"
              onClick={() => setDoubtMode('voice')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                doubtMode === 'voice'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Voice Tutor</span>
            </button>
          </div>
        </div>

        {/* Subject Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Subject:</span>
            {SUBJECT_LIST.map((subj) => {
              const isSelected = selectedSubject === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => handleSubjectChange(subj.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <SubjectIcon subject={subj.id} className="w-3.5 h-3.5" />
                  <span>{subj.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {activeNote && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Active Note: <strong>{activeNote.title}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Feature 1: Multi-Turn Gemini Chatbot */}
      {doubtMode === 'chat' && <ChatDoubtTutor subject={selectedSubject} />}

      {/* Feature 2: Real-time Live API Voice Tutor */}
      {doubtMode === 'voice' && <VoiceDoubtTutor subject={selectedSubject} />}
    </div>
  );
}
