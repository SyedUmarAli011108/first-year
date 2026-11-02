import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  RotateCcw,
  XCircle,
  BookOpen,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
  Plus,
  AlertTriangle,
  Upload,
  X,
  FileQuestion,
} from 'lucide-react';
import { STUDY_DATA, SUBJECT_LIST, SUBJECT_META_MAP } from '../data/studyData';
import { QuizQuestion, SubjectName, QuizMode } from '../types/study';
import { SubjectIcon } from './Logo';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

interface AnswerRecord {
  questionIndex: number;
  selectedOption: string;
  isCorrect: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeQuiz(questions: QuizQuestion[]): QuizQuestion[] {
  const shuffledQuestions = shuffleArray(questions);
  return shuffledQuestions.map((q) => ({
    ...q,
    options: shuffleArray(q.options),
    answer: q.answer,
  }));
}

interface QuizTabProps {
  onNavigateToPlanner?: () => void;
}

export function QuizTab({ onNavigateToPlanner }: QuizTabProps) {
  const { notes, activeNote, activeNoteId, setActiveNoteId } = useNotes();
  const { recordQuizCompleted } = useAuth();

  const [quizMode, setQuizMode] = useState<QuizMode>('syllabus');
  const [chosenSubject, setChosenSubject] = useState<SubjectName | null>(null);

  // Subject filter for custom notes quiz
  const [subjectForNotesQuiz, setSubjectForNotesQuiz] = useState<SubjectName>('Chemistry');

  // Pop-up modal error state if notes are not provided by user
  const [noNotesModal, setNoNotesModal] = useState<{
    isOpen: boolean;
    subject: SubjectName;
  }>({
    isOpen: false,
    subject: 'Chemistry',
  });

  // Custom Quiz from Notes State
  const [selectedNoteIdForQuiz, setSelectedNoteIdForQuiz] = useState<string>(
    activeNoteId || (notes[0]?.id ?? '')
  );
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [customQuizQuestions, setCustomQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [customQuizTitle, setCustomQuizTitle] = useState<string>('');

  // Keep selectedNoteIdForQuiz aligned with the selected subject
  useEffect(() => {
    const subjectNotes = notes.filter((n) => n.subject === subjectForNotesQuiz);
    if (subjectNotes.length > 0) {
      const alreadyMatches = subjectNotes.some((n) => n.id === selectedNoteIdForQuiz);
      if (!alreadyMatches) {
        setSelectedNoteIdForQuiz(subjectNotes[0].id);
      }
    }
  }, [subjectForNotesQuiz, notes, selectedNoteIdForQuiz]);

  // Active Quiz Progress
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Active questions depend on whether taking syllabus quiz or custom notes quiz
  const activeQuestions: QuizQuestion[] = useMemo(() => {
    if (quizMode === 'custom_notes') {
      return customQuizQuestions || [];
    }
    if (!chosenSubject) return [];
    return STUDY_DATA.filter((d) => d.subject === chosenSubject).flatMap((d) => d.quiz);
  }, [quizMode, chosenSubject, customQuizQuestions]);

  const startSubjectQuiz = (subject: SubjectName) => {
    setQuizMode('syllabus');
    setChosenSubject(subject);
    setCustomQuizQuestions(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setRecords([]);
    setIsFinished(false);
  };

  const handleGenerateQuizForSubject = (subject: SubjectName) => {
    const subjectNotes = notes.filter((n) => n.subject === subject);
    if (subjectNotes.length === 0) {
      setNoNotesModal({ isOpen: true, subject });
      return;
    }
    const chosenNote =
      subjectNotes.find((n) => n.id === selectedNoteIdForQuiz) || subjectNotes[0];
    setSubjectForNotesQuiz(subject);
    setSelectedNoteIdForQuiz(chosenNote.id);
    generateQuizFromNoteTarget(chosenNote);
  };

  const handleGenerateQuizFromNote = async () => {
    const subjectNotes = notes.filter((n) => n.subject === subjectForNotesQuiz);
    if (subjectNotes.length === 0) {
      setNoNotesModal({ isOpen: true, subject: subjectForNotesQuiz });
      return;
    }

    const targetNote =
      subjectNotes.find((n) => n.id === selectedNoteIdForQuiz) ||
      subjectNotes[0] ||
      notes.find((n) => n.id === selectedNoteIdForQuiz) ||
      notes[0];

    if (!targetNote) {
      setNoNotesModal({ isOpen: true, subject: subjectForNotesQuiz });
      return;
    }

    await generateQuizFromNoteTarget(targetNote);
  };

  const generateQuizFromNoteTarget = async (targetNote: typeof notes[0]) => {
    setGenerateError(null);
    setIsGeneratingQuiz(true);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notesText: targetNote.content,
          subject: targetNote.subject,
          count: 5,
          randomSeed: Math.random(),
          timestamp: Date.now(),
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!response.ok) {
          const cleanErr = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 150).trim();
          throw new Error(`Quiz server error (${response.status}): ${cleanErr || 'Generation failed'}`);
        }
        throw new Error('Server returned an unexpected format for quiz data.');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Quiz generation failed with status ${response.status}`);
      }

      if (!Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error(
          'No questions could be extracted from these notes. Please check the text length.'
        );
      }

      // Randomize questions and choices every single time
      const randomized = randomizeQuiz(data.quiz);

      setCustomQuizQuestions(randomized);
      setCustomQuizTitle(targetNote.title);
      setQuizMode('custom_notes');
      setCurrentIndex(0);
      setSelectedOption(null);
      setRecords([]);
      setIsFinished(false);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setGenerateError(err?.message || 'Could not generate quiz. Check API key or note length.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setRecords([]);
    setIsFinished(false);
  };

  const handleResetToMenu = () => {
    setChosenSubject(null);
    setCustomQuizQuestions(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setRecords([]);
    setIsFinished(false);
  };

  const handleSelectAnswer = (option: string) => {
    if (selectedOption !== null) return;
    const currentQ = activeQuestions[currentIndex];
    if (!currentQ) return;

    const correct = option.trim() === currentQ.answer.trim();
    setSelectedOption(option);
    setRecords((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        selectedOption: option,
        isCorrect: correct,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      recordQuizCompleted();
    }
  };

  const isTakingQuiz =
    (quizMode === 'syllabus' && chosenSubject !== null) ||
    (quizMode === 'custom_notes' && customQuizQuestions !== null && customQuizQuestions.length > 0);

  // 1. Final Score & Summary Screen
  if (isTakingQuiz && isFinished) {
    const totalQuestions = activeQuestions.length;
    const score = records.filter((r) => r.isCorrect).length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const headline =
      percentage >= 80
        ? 'Great job!'
        : percentage >= 50
        ? 'Good effort! Keep going!'
        : 'Keep practicing!';
    const subMessage =
      percentage >= 80
        ? 'You have a solid command of these engineering concepts.'
        : percentage >= 50
        ? 'You got more than half right — review the explanations below to master the rest.'
        : 'Every practice round builds recall. Check the one-line explanations below and retry!';

    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <section
          aria-labelledby="quiz-score-heading"
          className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center"
        >
          {/* SVG Score Ring */}
          <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 104 104" aria-hidden="true">
              <circle
                cx="52"
                cy="52"
                r={radius}
                strokeWidth="8"
                className="stroke-slate-100 fill-none"
              />
              <circle
                cx="52"
                cy="52"
                r={radius}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`fill-none transition-all duration-300 ${
                  percentage >= 80
                    ? 'stroke-emerald-600'
                    : percentage >= 50
                    ? 'stroke-blue-600'
                    : 'stroke-amber-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                {score}/{totalQuestions}
              </span>
              <span className="text-xs text-slate-500">{percentage}%</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
            <Award className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>
              {quizMode === 'custom_notes'
                ? `Quiz from Notes: ${customQuizTitle}`
                : chosenSubject
                ? SUBJECT_META_MAP[chosenSubject]?.fullLabel
                : 'Engineering Quiz'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Final Score</span>
          </div>

          <h2
            id="quiz-score-heading"
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
          >
            {headline}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5 max-w-lg mx-auto">
            {subMessage}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Retry Quiz</span>
            </button>

            <button
              type="button"
              onClick={handleResetToMenu}
              className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Choose another quiz</span>
            </button>
          </div>
        </section>

        {/* Answer Review Breakdown */}
        <section
          aria-labelledby="review-heading"
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
        >
          <h3 id="review-heading" className="text-base font-bold text-slate-900 mb-4">
            Question Review ({score} of {totalQuestions} correct)
          </h3>

          <div className="divide-y divide-slate-100">
            {activeQuestions.map((q, idx) => {
              const rec = records.find((r) => r.questionIndex === idx);
              const isCorrect = rec?.isCorrect ?? false;
              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600 shrink-0 mt-1"
                        aria-label="Correct"
                      />
                    ) : (
                      <XCircle
                        className="w-4 h-4 text-rose-600 shrink-0 mt-1"
                        aria-label="Incorrect"
                      />
                    )}
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      <span className="font-mono tabular-nums text-slate-400 mr-1.5">
                        {idx + 1}.
                      </span>
                      {q.question}
                    </p>
                  </div>

                  <div className="pl-7 text-xs space-y-1">
                    {!isCorrect && rec && (
                      <p className="text-rose-700">
                        Your answer: <span className="font-medium">{rec.selectedOption}</span>
                      </p>
                    )}
                    <p className="text-emerald-800">
                      Correct answer: <span className="font-semibold">{q.answer}</span>
                    </p>
                    <p className="text-slate-600">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // 2. Active One-at-a-Time Question Screen
  if (isTakingQuiz) {
    const totalQuestions = activeQuestions.length;
    const currentQuestion = activeQuestions[currentIndex];
    const isAnswered = selectedOption !== null;
    const isCurrentCorrect = selectedOption?.trim() === currentQuestion?.answer?.trim();
    const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
    const score = records.filter((r) => r.isCorrect).length;

    const quizBadgeLabel =
      quizMode === 'custom_notes'
        ? `Notes Quiz: ${customQuizTitle}`
        : chosenSubject
        ? SUBJECT_META_MAP[chosenSubject]?.fullLabel
        : 'Quiz';

    return (
      <div className="max-w-3xl mx-auto">
        <section
          aria-labelledby="active-question-text"
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6"
        >
          {/* Top Meta & Progress */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={handleResetToMenu}
                  className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 min-h-[36px] pr-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>All Quizzes</span>
                </button>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-blue-700 truncate max-w-[200px] sm:max-w-xs">
                  {quizBadgeLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
                <span className="font-semibold text-slate-900">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span aria-hidden="true">·</span>
                <span>Score: {score}</span>
              </div>
            </div>

            <div
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuenow={currentIndex + 1}
              aria-valuemin={1}
              aria-valuemax={totalQuestions}
              className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
            >
              <svg
                className="w-full h-full block"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <rect
                  x="0"
                  y="0"
                  width={progressPercent}
                  height="8"
                  className="fill-blue-600 transition-all duration-200"
                />
              </svg>
            </div>
          </div>

          {/* Question Prompt */}
          <h2
            id="active-question-text"
            className="text-lg sm:text-xl font-bold text-slate-900 leading-snug"
          >
            {currentQuestion?.question}
          </h2>

          {/* MCQ Options */}
          <div className="space-y-2.5" role="group" aria-label="Answer options">
            {currentQuestion?.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isRightAnswer = option.trim() === currentQuestion.answer.trim();

              let optionClasses =
                'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-blue-500';
              let badgeClasses = 'bg-white border-slate-200 text-slate-600';

              if (isAnswered) {
                if (isRightAnswer) {
                  optionClasses = 'bg-emerald-50/90 border-emerald-600 text-emerald-950';
                  badgeClasses = 'bg-emerald-600 border-emerald-600 text-white';
                } else if (isSelected && !isRightAnswer) {
                  optionClasses = 'bg-rose-50/90 border-rose-500 text-rose-950';
                  badgeClasses = 'bg-rose-600 border-rose-600 text-white';
                } else {
                  optionClasses = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-75';
                  badgeClasses = 'bg-slate-100 border-slate-200 text-slate-400';
                }
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full min-h-[54px] p-3.5 sm:px-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${optionClasses} ${
                    isAnswered ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg border font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${badgeClasses}`}
                    >
                      {OPTION_LETTERS[idx] ?? idx + 1}
                    </span>
                    <span className="text-sm sm:text-base font-medium leading-snug">
                      {option}
                    </span>
                  </span>

                  {isAnswered && isRightAnswer && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0 whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Correct</span>
                    </span>
                  )}

                  {isAnswered && isSelected && !isRightAnswer && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 shrink-0 whitespace-nowrap">
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Wrong</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback & One-Line Explanation */}
          {isAnswered && (
            <div
              role="status"
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isCurrentCorrect
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-rose-50/80 border-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {isCurrentCorrect ? (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
                <div className="space-y-1">
                  <p
                    className={`text-sm font-bold ${
                      isCurrentCorrect ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {isCurrentCorrect
                      ? 'Correct!'
                      : `Incorrect — Correct answer: ${currentQuestion.answer}`}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>
                  {currentIndex + 1 < totalQuestions ? 'Next Question' : 'See Final Score'}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // 3. Quiz Mode Picker & Custom Note Generator Screen
  return (
    <section aria-labelledby="quiz-hub-heading" className="space-y-6">
      {/* Quiz Hub Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 id="quiz-hub-heading" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Test Your Knowledge
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Test concepts from our syllabus bank or generate a brand new interactive quiz from your uploaded notes!
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setQuizMode('syllabus')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                quizMode === 'syllabus'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Syllabus Quizzes</span>
            </button>

            <button
              type="button"
              onClick={() => setQuizMode('custom_notes')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                quizMode === 'custom_notes'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Generate from Uploaded Notes</span>
            </button>
          </div>
        </div>

        {/* Feature 1: Syllabus Quizzes Grid */}
        {quizMode === 'syllabus' && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Standard First-Year Engineering Banks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBJECT_LIST.map((subj) => {
                const count = STUDY_DATA.filter((d) => d.subject === subj.id).reduce(
                  (acc, item) => acc + item.quiz.length,
                  0
                );
                const unitList = STUDY_DATA.filter((d) => d.subject === subj.id).map(
                  (d) => `Unit ${d.unit}`
                );
                const subjectNotesCount = notes.filter((n) => n.subject === subj.id).length;

                return (
                  <div
                    key={subj.id}
                    className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${subj.accentBg} ${subj.accentText}`}
                      >
                        <SubjectIcon subject={subj.id} className="w-5 h-5" />
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{subj.fullLabel}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{subj.subtitle}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                        {unitList.length > 0 && (
                          <>
                            <span>{unitList.join(', ')}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>
                          {count} {count === 1 ? 'Question' : 'Questions'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-600 font-sans font-medium">
                          {subjectNotesCount} {subjectNotesCount === 1 ? 'Note' : 'Notes'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <button
                        type="button"
                        onClick={() => startSubjectQuiz(subj.id)}
                        className={`w-full min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                          count > 0
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-white border border-slate-300 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        <span>Start Standard Bank</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGenerateQuizForSubject(subj.id)}
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Generate Quiz from {subj.shortLabel} Notes</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature 2: Generate Quiz from Uploaded Notes */}
        {quizMode === 'custom_notes' && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-slate-900">
                Generate Interactive Quiz from Subject Notes
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Select a subject and use your uploaded study notes (PDF, PNG, JPEG, JPG, TXT) to create a brand-new randomized quiz every single time.
              </p>
            </div>

            {/* Subject Selector for Custom Quiz */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Choose Subject for Quiz:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {SUBJECT_LIST.map((subj) => {
                  const isSelected = subjectForNotesQuiz === subj.id;
                  const countNotes = notes.filter((n) => n.subject === subj.id).length;
                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => {
                        setSubjectForNotesQuiz(subj.id);
                        const match = notes.filter((n) => n.subject === subj.id);
                        if (match.length > 0) {
                          setSelectedNoteIdForQuiz(match[0].id);
                        }
                      }}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <SubjectIcon subject={subj.id} className="w-3.5 h-3.5" />
                      <span>{subj.shortLabel}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {countNotes} {countNotes === 1 ? 'note' : 'notes'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Selector for Chosen Subject */}
            <div className="space-y-3">
              <label htmlFor="note-picker-quiz" className="block text-xs font-semibold text-slate-700">
                Select Source Study Note ({subjectForNotesQuiz}):
              </label>

              {(() => {
                const subjectNotes = notes.filter((n) => n.subject === subjectForNotesQuiz);
                if (subjectNotes.length === 0) {
                  return (
                    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <FileQuestion className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            No notes provided for {subjectForNotesQuiz}
                          </p>
                          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                            Upload a lecture photo (PNG/JPEG), PDF handout, or text notes in the Planner to generate quizzes for this subject.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onNavigateToPlanner}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Notes Now</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subjectNotes.map((note) => {
                      const isSelected = selectedNoteIdForQuiz === note.id;
                      return (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => setSelectedNoteIdForQuiz(note.id)}
                          className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                              {note.subject}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {note.wordCount} words
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2">{note.title}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {generateError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{generateError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                disabled={isGeneratingQuiz}
                onClick={handleGenerateQuizFromNote}
                className="min-h-[50px] px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm flex items-center gap-2.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingQuiz ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting MCQs with Gemini 3.8 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate &amp; Start Quiz (Randomized)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up Error Modal when notes are not provided by the user */}
      {noNotesModal.isOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="no-notes-title"
          aria-describedby="no-notes-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => setNoNotesModal({ isOpen: false, subject: 'Chemistry' })}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                aria-label="Close error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 id="no-notes-title" className="text-lg font-bold text-slate-900">
                No Notes Provided for {noNotesModal.subject}
              </h3>
              <p id="no-notes-desc" className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You haven&apos;t uploaded or provided any study notes for{' '}
                <strong className="text-slate-900">{noNotesModal.subject}</strong> yet. Notes are required
                to extract and generate a randomized interactive quiz for this subject.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <span className="font-semibold text-slate-800 block">Accepted File Formats in Planner:</span>
              <p className="text-slate-500">
                PDF, PNG, JPEG, JPG, WebP, Markdown, or pasted lecture notes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setNoNotesModal({ isOpen: false, subject: 'Chemistry' })}
                className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setNoNotesModal({ isOpen: false, subject: 'Chemistry' });
                  onNavigateToPlanner?.();
                }}
                className="w-full sm:w-auto min-h-[42px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shadow-blue-500/20 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Notes in Planner</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
