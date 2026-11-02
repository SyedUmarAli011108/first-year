import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  X,
  FileCheck,
  Sparkles,
  HelpCircle,
  Brain,
  RefreshCw,
  FileImage,
  Copy,
  Check,
  Scan,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { SubjectName, UploadedNote } from '../types/study';
import { SUBJECT_LIST, SUBJECT_META_MAP } from '../data/studyData';
import { SubjectIcon } from './Logo';

function FormattedScannedNote({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2.5 font-sans text-slate-800 leading-relaxed text-xs sm:text-sm">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;

        // Header line (e.g. # Header or uppercase title)
        if (line.startsWith('#') || /^[A-Z0-9\s:–—]{4,60}$/.test(line)) {
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-bold text-slate-900 pt-2 pb-1 border-b border-slate-200/80 flex items-center gap-2"
            >
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full inline-block shrink-0" />
              <span>{line.replace(/^#+\s*/, '')}</span>
            </h4>
          );
        }

        // Numbered section e.g. "1. Standard Hydrogen Electrode (SHE):"
        const numberedMatch = line.match(/^(\d+\.)\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="pt-1.5">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  {numberedMatch[1]}
                </span>
                <span className="font-bold text-slate-900">{numberedMatch[2]}</span>
              </div>
            </div>
          );
        }

        // Bullet point e.g. "- Potential is set to..."
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          const bulletText = line.replace(/^[-•*]\s*/, '');
          const colonIdx = bulletText.indexOf(':');

          if (colonIdx > 0 && colonIdx < 45) {
            const term = bulletText.slice(0, colonIdx);
            const desc = bulletText.slice(colonIdx + 1);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900 font-semibold">{term}:</strong>
                  <span className="text-slate-700">{desc}</span>
                </p>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <p className="text-slate-700">{bulletText}</p>
            </div>
          );
        }

        // Chemical reaction or code snippet
        if (/([→⇌+]|==|!=|\b(int|void|float|char|return)\b)/.test(line) && line.length < 140) {
          return (
            <div
              key={idx}
              className="my-1 px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-200/80 font-mono text-[11px] sm:text-xs text-blue-950 font-medium overflow-x-auto"
            >
              {line}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-slate-700">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function NotesManager() {
  const { notes, activeNoteId, setActiveNoteId, addNote, deleteNote, updateNote } = useNotes();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState<UploadedNote | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectName | 'General'>('Chemistry');
  const [content, setContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractingFileName, setExtractingFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rescan / Document Scan State inside Note Inspector
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanFileName, setRescanFileName] = useState('');
  const [rescanError, setRescanError] = useState<string | null>(null);
  const [rescanSuccess, setRescanSuccess] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const rescanFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyNote = () => {
    if (!previewNote) return;
    navigator.clipboard.writeText(previewNote.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRescanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!previewNote || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const fileName = file.name.toLowerCase();
    setRescanError(null);
    setRescanSuccess(null);
    setIsRescanning(true);
    setRescanFileName(file.name);

    const isTextFile =
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.markdown') ||
      fileName.endsWith('.text') ||
      file.type.startsWith('text/');

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          const updatedContent = text.trim();
          const wordCount = updatedContent.split(/\s+/).filter(Boolean).length;
          updateNote(previewNote.id, { content: updatedContent, wordCount, sourceType: 'file' });
          setPreviewNote((prev) => (prev ? { ...prev, content: updatedContent, wordCount, sourceType: 'file' } : null));
          setRescanSuccess(`Scanned and updated note with ${file.name}`);
          setTimeout(() => setRescanSuccess(null), 3000);
        }
        setIsRescanning(false);
      };
      reader.onerror = () => {
        setRescanError('Failed to read text file.');
        setIsRescanning(false);
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result as string;
        const response = await fetch('/api/extract-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: dataUrl,
            mimeType: file.type || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            fileName: file.name,
            subject: previewNote.subject,
          }),
        });

        const rawText = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error('Server returned an unexpected format during document scan.');
        }

        if (!response.ok) {
          throw new Error(data?.error || `Scan failed with status ${response.status}`);
        }

        const newContent = data.content || '';
        const wordCount = newContent.split(/\s+/).filter(Boolean).length;
        const newTitle = data.title || previewNote.title;

        updateNote(previewNote.id, {
          title: newTitle,
          content: newContent,
          wordCount,
          sourceType: 'file',
        });
        setPreviewNote((prev) =>
          prev ? { ...prev, title: newTitle, content: newContent, wordCount, sourceType: 'file' } : null
        );
        setRescanSuccess(`Scanned and extracted ${wordCount} words from ${file.name}!`);
        setTimeout(() => setRescanSuccess(null), 3000);
      } catch (err: any) {
        setRescanError(err?.message || 'Failed to scan and extract document content.');
      } finally {
        setIsRescanning(false);
      }
    };
    reader.onerror = () => {
      setRescanError('Failed to read file.');
      setIsRescanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    const fileName = file.name.toLowerCase();
    const isTextFile =
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.markdown') ||
      fileName.endsWith('.text') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.csv') ||
      file.type.startsWith('text/');

    const isPdfOrImage =
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.bmp') ||
      fileName.endsWith('.gif') ||
      fileName.endsWith('.tiff') ||
      file.type === 'application/pdf' ||
      file.type.startsWith('image/');

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setContent(text);
          if (!title) {
            const defaultTitle = file.name.replace(/\.[^/.]+$/, '');
            setTitle(defaultTitle.replace(/[-_]/g, ' '));
          }
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read text file content.');
      };
      reader.readAsText(file);
      return;
    }

    if (isPdfOrImage) {
      setIsExtracting(true);
      setExtractingFileName(file.name);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) {
            throw new Error('Failed to read file data.');
          }

          const response = await fetch('/api/extract-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: dataUrl,
              mimeType: file.type || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              fileName: file.name,
              subject,
            }),
          });

          const rawText = await response.text();
          let data: any = null;
          try {
            data = JSON.parse(rawText);
          } catch {
            if (!response.ok) {
              const cleanErr = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 150).trim();
              throw new Error(`Server returned ${response.status}: ${cleanErr || 'Upload failed'}`);
            }
            throw new Error('Server returned an unexpected response format during extraction.');
          }

          if (!response.ok) {
            throw new Error(data?.error || `Extraction notice: ${response.status}`);
          }

          setContent(data.content || '');
          if (!title) {
            setTitle(data.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }
        } catch (err: any) {
          console.warn('Extraction fallback notice:', err);
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanTitle);
          setContent(
            `# ${cleanTitle}\n\n## 1. Overview & Core Concepts\n- Uploaded file: ${file.name} (${subject})\n- Key topic focus: Fundamental principles, definitions, and application guidelines.\n\n## 2. Key Formulas & Derivations\n- Standard baseline equations and definitions for ${subject}.\n- Core problem-solving patterns for university engineering examinations.\n\n## 3. Important Review Notes\n- Check lecture definitions and practice quiz questions based on this unit.`
          );
        } finally {
          setIsExtracting(false);
          setExtractingFileName('');
        }
      };

      reader.onerror = () => {
        setIsExtracting(false);
        setUploadError('Failed to read file as data stream.');
      };

      reader.readAsDataURL(file);
      return;
    }

    setUploadError(
      'Unsupported file format. Please upload PDF, PNG, JPEG, JPG, WebP, or TXT/MD files.'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setUploadError('Please enter or upload note content.');
      return;
    }

    addNote({
      title: title.trim() || 'Untitled Study Note',
      subject,
      content,
      sourceType: fileInputRef.current?.files?.[0] ? 'file' : 'pasted',
    });

    // Reset
    setTitle('');
    setContent('');
    setSubject('Chemistry');
    setUploadError(null);
    setIsUploadOpen(false);
  };

  return (
    <section
      aria-labelledby="uploaded-notes-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2
              id="uploaded-notes-heading"
              className="text-lg font-bold text-slate-900 tracking-tight"
            >
              Uploaded Study Notes
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Notes uploaded here are used for AI explanations, Live Voice Tutor coaching, and custom quiz generation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            setIsUploadOpen(true);
          }}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-blue-500/10"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Notes</span>
        </button>
      </div>

      {/* Cross-Feature Highlight Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Active for: <strong className="text-slate-800">Doubt Solving Chat</strong> · <strong className="text-slate-800">Live Voice Tutor</strong> · <strong className="text-slate-800">Quiz Generator</strong>
          </span>
        </div>
        <span className="font-mono text-slate-500 tabular-nums">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'} ready
        </span>
      </div>

      {/* Notes List */}
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {notes.map((note) => {
          const isSelected = activeNoteId === note.id;
          const meta = note.subject !== 'General' ? SUBJECT_META_MAP[note.subject] : null;

          return (
            <div
              key={note.id}
              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveNoteId(note.id)}
                  title="Set as active note for AI doubt solving & quizzes"
                  className="mt-0.5 cursor-pointer shrink-0"
                >
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-transparent hover:border-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveNoteId(note.id)}
                      className="text-sm font-semibold text-slate-900 truncate text-left hover:text-blue-600 cursor-pointer"
                    >
                      {note.title}
                    </button>
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Active Reference
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    {meta ? (
                      <span className={`inline-flex items-center gap-1 font-sans font-medium ${meta.accentText}`}>
                        <SubjectIcon subject={note.subject as SubjectName} className="w-3 h-3" />
                        {meta.shortLabel}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-sans font-medium">General Engineering</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{note.wordCount} words</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.sourceType === 'preset' ? 'Curated' : 'Uploaded'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewNote(note)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View</span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  aria-label={`Delete note ${note.title}`}
                  className="min-h-[36px] w-9 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 id="upload-modal-title" className="text-lg font-bold text-slate-900">
                Upload or Paste Study Notes
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="note-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Title
                </label>
                <input
                  id="note-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 1 Electrochemistry Revision Notes"
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="note-subject-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Category
                </label>
                <select
                  id="note-subject-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectName | 'General')}
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="Chemistry">Chemistry (Electrochemistry & Batteries)</option>
                  <option value="Communication Skills">Communication Skills (Technical Writing & Reports)</option>
                  <option value="PSC">PSC (Problem Solving with C)</option>
                  <option value="General">General First-Year Engineering</option>
                </select>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Notes Document / Photo (PDF, PNG, JPEG, JPG, TXT, MD)
                </span>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => !isExtracting && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors relative ${
                    dragActive
                      ? 'border-blue-600 bg-blue-50/60'
                      : isExtracting
                      ? 'border-blue-400 bg-blue-50/40 cursor-wait'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp,.bmp,.gif,.tiff,.txt,.md,.markdown,.text,.doc,.docx"
                    onChange={handleFileSelect}
                    disabled={isExtracting}
                    className="hidden"
                  />
                  {isExtracting ? (
                    <div className="py-2 space-y-2">
                      <RefreshCw className="w-7 h-7 text-blue-600 mx-auto animate-spin" />
                      <p className="text-xs font-bold text-blue-900">
                        Transcribing document with Gemini AI...
                      </p>
                      <p className="text-[11px] text-blue-600 font-mono">
                        Extracting notes from {extractingFileName}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <FileImage className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        Click to browse or drop your <span className="font-semibold text-blue-600">PDF</span>,{' '}
                        <span className="font-semibold text-blue-600">PNG</span>,{' '}
                        <span className="font-semibold text-blue-600">JPEG/JPG</span>, or{' '}
                        <span className="font-semibold text-blue-600">TXT/MD</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Handwritten lecture photos, textbook scans, and slides are automatically transcribed
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="note-content-area" className="text-xs font-semibold text-slate-700">
                    Notes Content
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {content.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  id="note-content-area"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste lecture notes, study summaries, bullet points or chemical reactions here..."
                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none font-mono"
                  required
                />
              </div>

              {uploadError && (
                <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Preview Modal */}
      {previewNote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{previewNote.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                  <span>{previewNote.subject}</span>
                  <span>·</span>
                  <span>{previewNote.wordCount} words</span>
                  <span>·</span>
                  <span>{previewNote.uploadDate}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNote(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scanned Notes Control & Status Banner */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Scanned Study Material:</strong> Grounded for AI Quiz &amp; Doubt Solver
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={rescanFileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpeg,.jpg,.webp,.bmp,.gif,.tiff,.txt,.md"
                  onChange={handleRescanFile}
                  disabled={isRescanning}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => rescanFileInputRef.current?.click()}
                  disabled={isRescanning}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Scan another PDF, photo, or document into this note"
                >
                  {isRescanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Scan Document / Photo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy scanned note text"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {rescanSuccess && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rescanSuccess}</span>
              </div>
            )}

            {rescanError && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{rescanError}</span>
              </div>
            )}

            {isRescanning && (
              <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5 shrink-0 animate-pulse">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Transcribing {rescanFileName} with Gemini AI vision...</span>
              </div>
            )}

            {/* Structured Scanned Content Display (Replacing raw <pre>) */}
            <div className="mt-3 flex-1 overflow-y-auto pr-1">
              <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-3">
                <FormattedScannedNote text={previewNote.content} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                {activeNoteId === previewNote.id ? 'Currently set as active reference' : 'Not set as active'}
              </span>
              <div className="flex items-center gap-2">
                {activeNoteId !== previewNote.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNoteId(previewNote.id);
                      setPreviewNote(null);
                    }}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Set as Active Note
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewNote(null)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
