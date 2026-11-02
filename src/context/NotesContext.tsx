import React, { createContext, useContext, useEffect, useState } from 'react';
import { UploadedNote, SubjectName } from '../types/study';
import { DEFAULT_NOTES } from '../data/studyData';
import { useAuth } from './AuthContext';

interface NotesContextType {
  notes: UploadedNote[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  addNote: (data: {
    title: string;
    subject: SubjectName | 'General';
    content: string;
    sourceType: 'file' | 'pasted';
  }) => UploadedNote;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<UploadedNote>) => void;
  getNoteById: (id: string) => UploadedNote | undefined;
  getNotesForSubject: (subject: SubjectName | 'General') => UploadedNote[];
  activeNote: UploadedNote | null;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, refreshStats } = useAuth();
  const userId = currentUser?.userId || 'guest';
  const storageKey = `studybuddy_notes_${userId}`;
  const activeNoteKey = `studybuddy_active_note_${userId}`;

  const [notes, setNotes] = useState<UploadedNote[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load notes from localStorage:', e);
    }
    return DEFAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteIdState] = useState<string | null>(() => {
    try {
      const savedActive = localStorage.getItem(activeNoteKey);
      if (savedActive) return savedActive;
    } catch {}
    return 'note-chem-unit1';
  });

  // Re-sync notes when active user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
          const savedActive = localStorage.getItem(activeNoteKey);
          setActiveNoteIdState(savedActive || (parsed[0]?.id ?? null));
          return;
        }
      }
      // If new user with no existing notes, seed their personal workspace
      setNotes(DEFAULT_NOTES);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_NOTES));
      setActiveNoteIdState('note-chem-unit1');
      localStorage.setItem(activeNoteKey, 'note-chem-unit1');
    } catch (e) {
      console.warn('Failed to switch user notes:', e);
    }
  }, [storageKey, activeNoteKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to persist notes:', e);
    }
  }, [notes, storageKey]);

  const setActiveNoteId = (id: string | null) => {
    setActiveNoteIdState(id);
    try {
      if (id) {
        localStorage.setItem(activeNoteKey, id);
      } else {
        localStorage.removeItem(activeNoteKey);
      }
    } catch {}
  };

  const addNote = ({
    title,
    subject,
    content,
    sourceType,
  }: {
    title: string;
    subject: SubjectName | 'General';
    content: string;
    sourceType: 'file' | 'pasted';
  }): UploadedNote => {
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const today = new Date().toISOString().split('T')[0];
    const newNote: UploadedNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim() || 'Untitled Study Note',
      subject,
      content: content.trim(),
      uploadDate: today,
      sourceType,
      wordCount,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateNote = (id: string, updates: Partial<UploadedNote>) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const merged = { ...n, ...updates };
        if (updates.content) {
          merged.wordCount = updates.content.trim().split(/\s+/).filter(Boolean).length;
        }
        return merged;
      })
    );
  };

  const getNoteById = (id: string) => notes.find((n) => n.id === id);

  const getNotesForSubject = (subject: SubjectName | 'General') => {
    if (subject === 'General') return notes;
    return notes.filter((n) => n.subject === subject || n.subject === 'General');
  };

  const activeNote = activeNoteId ? getNoteById(activeNoteId) || null : null;

  return (
    <NotesContext.Provider
      value={{
        notes,
        activeNoteId,
        setActiveNoteId,
        addNote,
        deleteNote,
        updateNote,
        getNoteById,
        getNotesForSubject,
        activeNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
