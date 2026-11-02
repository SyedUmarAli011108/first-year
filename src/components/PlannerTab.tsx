import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { PLANNER_TOPICS, SUBJECT_LIST, SUBJECT_META_MAP } from '../data/studyData';
import { StudyTask, SubjectName, SubjectPlanConfig } from '../types/study';
import { SubjectIcon } from './Logo';
import { NotesManager } from './NotesManager';
import { useAuth } from '../context/AuthContext';

function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatReadableDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function daysBetween(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const start = new Date(sy, (sm || 1) - 1, sd || 1, 12, 0, 0);
  const end = new Date(ey, (em || 1) - 1, ed || 1, 12, 0, 0);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

function buildSchedule(
  configs: SubjectPlanConfig[],
  hoursPerDay: number,
  todayIso: string
): StudyTask[] {
  const activeConfigs = configs
    .filter((c) => c.selected && c.examDate)
    .map((c) => ({
      ...c,
      daysLeft: daysBetween(todayIso, c.examDate),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (activeConfigs.length === 0) return [];

  const maxHorizon = Math.min(
    7,
    Math.max(3, Math.max(...activeConfigs.map((c) => c.daysLeft)))
  );

  const tasks: StudyTask[] = [];
  const topicCounters: Record<SubjectName, number> = {
    Chemistry: 0,
    'Communication Skills': 0,
    PSC: 0,
  };

  const todayDate = new Date(
    Number(todayIso.slice(0, 4)),
    Number(todayIso.slice(5, 7)) - 1,
    Number(todayIso.slice(8, 10)),
    12,
    0,
    0
  );

  for (let dayOffset = 0; dayOffset < maxHorizon; dayOffset++) {
    const currentIso = addDaysISO(todayDate, dayOffset);
    const dateLabel = formatReadableDate(currentIso);

    // Subjects whose exam is still upcoming on or after this day (fallback to all selected if past)
    let subjectsToday = activeConfigs.filter((c) => dayOffset < c.daysLeft);
    if (subjectsToday.length === 0) {
      subjectsToday = activeConfigs;
    }

    // Decide how many study blocks to schedule today based on hoursPerDay
    const maxSubjectsToday =
      hoursPerDay <= 1.5
        ? Math.min(2, subjectsToday.length)
        : subjectsToday.length;

    // Rotate starting offset slightly if fewer slots than active subjects
    const chosenSubjects =
      maxSubjectsToday < subjectsToday.length
        ? Array.from({ length: maxSubjectsToday }, (_, idx) => {
            return subjectsToday[(dayOffset + idx) % subjectsToday.length];
          })
        : subjectsToday;

    // Distribute daily study hours cleanly across today's subjects (urgent exam gets slight priority)
    const weights = chosenSubjects.map((s) => 1 / Math.max(1, s.daysLeft - dayOffset));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);

    let allocatedSum = 0;
    const durations = chosenSubjects.map((_, idx) => {
      if (idx === chosenSubjects.length - 1) {
        return Math.max(0.5, Math.round((hoursPerDay - allocatedSum) * 2) / 2);
      }
      const raw = (hoursPerDay * weights[idx]) / totalWeight;
      const rounded = Math.max(0.5, Math.round(raw * 2) / 2);
      allocatedSum += rounded;
      return rounded;
    });

    // Normalize if rounding pushed sum slightly off
    const finalDurations = durations.map((d) => Math.max(0.5, d));

    chosenSubjects.forEach((subjCfg, idx) => {
      const subject = subjCfg.subject;
      const bank = PLANNER_TOPICS[subject];
      const topicIdx = topicCounters[subject] % bank.length;
      topicCounters[subject] += 1;

      const isExamEve = dayOffset === subjCfg.daysLeft - 1;
      const title = isExamEve
        ? `Final Exam-Eve Revision: ${bank[topicIdx]}`
        : bank[topicIdx];

      tasks.push({
        id: `${currentIso}-${subject}-${idx}`,
        dayIndex: dayOffset + 1,
        dateLabel,
        isoDate: currentIso,
        subject,
        title,
        durationHours: finalDurations[idx],
        completed: false,
      });
    });
  }

  return tasks;
}

export function PlannerTab() {
  const { currentUser, recordTasksCompletedCount } = useAuth();
  const userId = currentUser?.userId || 'guest';
  const planKey = `studybuddy_plan_${userId}`;

  const todayIso = useMemo(() => addDaysISO(new Date(), 0), []);

  const [subjectConfigs, setSubjectConfigs] = useState<SubjectPlanConfig[]>(() => [
    { subject: 'Chemistry', selected: true, examDate: addDaysISO(new Date(), 4) },
    {
      subject: 'Communication Skills',
      selected: true,
      examDate: addDaysISO(new Date(), 6),
    },
    { subject: 'PSC', selected: true, examDate: addDaysISO(new Date(), 8) },
  ]);

  const [hoursPerDay, setHoursPerDay] = useState<number>(3);
  const [tasks, setTasks] = useState<StudyTask[]>(() =>
    buildSchedule(
      [
        { subject: 'Chemistry', selected: true, examDate: addDaysISO(new Date(), 4) },
        {
          subject: 'Communication Skills',
          selected: true,
          examDate: addDaysISO(new Date(), 6),
        },
        { subject: 'PSC', selected: true, examDate: addDaysISO(new Date(), 8) },
      ],
      3,
      addDaysISO(new Date(), 0)
    )
  );
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState<boolean>(false);

  const timetableRef = useRef<HTMLDivElement | null>(null);

  // Restore user-specific plan when userId changes
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(planKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.tasks)) {
          if (Array.isArray(parsed.subjectConfigs)) {
            setSubjectConfigs(parsed.subjectConfigs);
          }
          if (typeof parsed.hoursPerDay === 'number') {
            setHoursPerDay(parsed.hoursPerDay);
          }
          setTasks(parsed.tasks);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load user plan:', e);
    }
  }, [planKey]);

  // Persist user-specific plan and update stats
  const lastSavedRef = useRef<string>('');
  React.useEffect(() => {
    try {
      const payload = JSON.stringify({ subjectConfigs, hoursPerDay, tasks });
      if (payload !== lastSavedRef.current) {
        lastSavedRef.current = payload;
        localStorage.setItem(planKey, payload);
        const completed = tasks.filter((t) => t.completed).length;
        recordTasksCompletedCount(completed, tasks.length);
      }
    } catch {}
  }, [subjectConfigs, hoursPerDay, tasks, planKey, recordTasksCompletedCount]);

  const toggleSubject = (subject: SubjectName) => {
    setValidationError(null);
    setSubjectConfigs((prev) =>
      prev.map((item) =>
        item.subject === subject ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateExamDate = (subject: SubjectName, dateValue: string) => {
    setValidationError(null);
    setSubjectConfigs((prev) =>
      prev.map((item) =>
        item.subject === subject ? { ...item, examDate: dateValue } : item
      )
    );
  };

  const adjustHours = (delta: number) => {
    setHoursPerDay((prev) => {
      const next = Math.round((prev + delta) * 2) / 2;
      return Math.min(8, Math.max(1, next));
    });
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = subjectConfigs.filter((c) => c.selected);
    if (chosen.length === 0) {
      setValidationError('Select at least one subject to generate your timetable.');
      return;
    }
    const missingDate = chosen.find((c) => !c.examDate);
    if (missingDate) {
      setValidationError(`Enter an exam date for ${missingDate.subject}.`);
      return;
    }

    setValidationError(null);
    const nextTasks = buildSchedule(subjectConfigs, hoursPerDay, todayIso);
    setTasks(nextTasks);
    setSelectedDayFilter('all');
    setJustGenerated(true);
    window.setTimeout(() => setJustGenerated(false), 2000);

    if (window.innerWidth < 1024 && timetableRef.current) {
      timetableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const resetProgress = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, completed: false })));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const groupedDays = useMemo(() => {
    const map = new Map<
      number,
      { dayIndex: number; dateLabel: string; items: StudyTask[]; totalHours: number }
    >();
    tasks.forEach((t) => {
      const existing = map.get(t.dayIndex);
      if (existing) {
        existing.items.push(t);
        existing.totalHours =
          Math.round((existing.totalHours + t.durationHours) * 10) / 10;
      } else {
        map.set(t.dayIndex, {
          dayIndex: t.dayIndex,
          dateLabel: t.dateLabel,
          items: [t],
          totalHours: t.durationHours,
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const visibleDays =
    selectedDayFilter === 'all'
      ? groupedDays
      : groupedDays.filter((d) => d.dayIndex === selectedDayFilter);

  const perSubjectStats = useMemo(() => {
    return SUBJECT_LIST.map((meta) => {
      const subTasks = tasks.filter((t) => t.subject === meta.id);
      const subDone = subTasks.filter((t) => t.completed).length;
      return {
        meta,
        total: subTasks.length,
        done: subDone,
      };
    }).filter((s) => s.total > 0);
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Study Plan Form & Uploaded Notes */}
      <div className="lg:col-span-5 space-y-6">
        <section
          aria-labelledby="planner-form-heading"
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
        >
        <div className="mb-5">
          <h2
            id="planner-form-heading"
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            Configure Study Plan
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Pick your upcoming exams and daily study hours to build a balanced schedule.
          </p>
        </div>

        <form onSubmit={handleGeneratePlan} className="space-y-6">
          {/* Subject Checkboxes & Exam Dates */}
          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-3">
              1. Subjects &amp; Exam Dates
            </span>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {subjectConfigs.map((cfg) => {
                const meta = SUBJECT_META_MAP[cfg.subject];
                const daysLeft = cfg.examDate
                  ? daysBetween(todayIso, cfg.examDate)
                  : null;

                return (
                  <div
                    key={cfg.subject}
                    className={`p-3.5 transition-colors ${
                      cfg.selected ? 'bg-white' : 'bg-slate-50/70'
                    }`}
                  >
                    <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer select-none">
                      <span className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={cfg.selected}
                          onChange={() => toggleSubject(cfg.subject)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 shrink-0 cursor-pointer"
                        />
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.accentBg} ${meta.accentText}`}
                        >
                          <SubjectIcon subject={cfg.subject} className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900 truncate">
                            {meta.fullLabel}
                          </span>
                          <span className="block text-xs text-slate-500 truncate">
                            {meta.subtitle}
                          </span>
                        </span>
                      </span>
                    </label>

                    {cfg.selected && (
                      <div className="mt-2.5 pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label
                          htmlFor={`exam-date-${cfg.subject}`}
                          className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>Exam date</span>
                          {daysLeft !== null && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-slate-500">
                                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} away
                              </span>
                            </>
                          )}
                        </label>
                        <input
                          id={`exam-date-${cfg.subject}`}
                          type="date"
                          min={todayIso}
                          value={cfg.examDate}
                          onChange={(e) => updateExamDate(cfg.subject, e.target.value)}
                          required={cfg.selected}
                          className="min-h-[42px] px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Study Hours */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label
                htmlFor="study-hours-range"
                className="text-sm font-semibold text-slate-800"
              >
                2. Study Hours per Day
              </label>
              <span className="text-sm font-mono font-semibold tabular-nums text-blue-700">
                {hoursPerDay.toFixed(1)} hrs / day
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustHours(-0.5)}
                disabled={hoursPerDay <= 1}
                aria-label="Decrease study hours"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                id="study-hours-range"
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay( parseFloat(e.target.value) )}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => adjustHours(0.5)}
                disabled={hoursPerDay >= 8}
                aria-label="Increase study hours"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              {[2, 3, 4, 6].map((preset) => {
                const active = hoursPerDay === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHoursPerDay(preset)}
                    className={`min-h-[40px] rounded-lg text-xs font-mono font-semibold tabular-nums border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {preset}.0 hrs
                  </button>
                );
              })}
            </div>
          </div>

          {validationError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">
              {justGenerated ? 'Timetable Updated!' : 'Generate Plan'}
            </span>
          </button>
        </form>
      </section>

      {/* Upload Notes Manager */}
      <NotesManager />
    </div>

      {/* Right Column: Progress Bar & Daily Timetable */}
      <div ref={timetableRef} className="lg:col-span-7 space-y-6 min-w-0">
        {/* Live Progress Card */}
        <section
          aria-labelledby="progress-heading"
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div>
              <h2
                id="progress-heading"
                className="text-lg font-bold text-slate-900 tracking-tight"
              >
                Study Progress
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {completedCount === 0
                  ? 'Tick checkboxes as you finish each daily study task.'
                  : completedCount === totalCount && totalCount > 0
                  ? 'Every scheduled task is complete. Awesome consistency!'
                  : 'Keep going — steady daily blocks beat last-minute cramming.'}
              </p>
            </div>

            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                {progressPercent}%
              </span>
              <span className="text-xs text-slate-500">
                ({completedCount}/{totalCount} tasks)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-label="Completed study tasks"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"
          >
            <svg
              className="w-full h-full block"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect
                x="0"
                y="0"
                width={progressPercent}
                height="12"
                className="fill-emerald-600 transition-all duration-200"
              />
            </svg>
          </div>

          {/* Clean Unboxed Metadata Summary + Reset */}
          {perSubjectStats.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono tabular-nums">
                {perSubjectStats.map((stat, index) => (
                  <React.Fragment key={stat.meta.id}>
                    {index > 0 && <span aria-hidden="true">·</span>}
                    <span>
                      <span className="font-sans font-medium text-slate-700">
                        {stat.meta.shortLabel}
                      </span>{' '}
                      {stat.done}/{stat.total}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={resetProgress}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 min-h-[36px] px-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset Checks</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Daily Timetable Card */}
        <section
          aria-labelledby="timetable-heading"
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2
                id="timetable-heading"
                className="text-lg font-bold text-slate-900 tracking-tight"
              >
                Daily Timetable
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                {groupedDays.length} days scheduled · {hoursPerDay.toFixed(1)} hrs/day target
              </p>
            </div>
          </div>

          {/* Day Filter Segmented Bar */}
          {groupedDays.length > 1 && (
            <div
              role="tablist"
              aria-label="Filter timetable by day"
              className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-100"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedDayFilter === 'all'}
                onClick={() => setSelectedDayFilter('all')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDayFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All Days
              </button>
              {groupedDays.map((day) => {
                const isSelected = selectedDayFilter === day.dayIndex;
                return (
                  <button
                    key={day.dayIndex}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedDayFilter(day.dayIndex)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Day {day.dayIndex}
                  </button>
                );
              })}
            </div>
          )}

          {visibleDays.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-600">
                Select at least one subject on the left and click{' '}
                <span className="font-semibold text-slate-900">Generate Plan</span> to
                build your daily timetable.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {visibleDays.map((day) => (
                <div key={day.dayIndex}>
                  {/* Day Header */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      Day {day.dayIndex}{' '}
                      <span className="font-normal text-slate-400" aria-hidden="true">
                        ·
                      </span>{' '}
                      <span className="font-medium text-slate-600">{day.dateLabel}</span>
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-slate-500 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {day.totalHours.toFixed(1)} hrs
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {day.items.map((task) => {
                      const meta = SUBJECT_META_MAP[task.subject];
                      return (
                        <label
                          key={task.id}
                          className={`flex items-start gap-3.5 p-3.5 min-h-[56px] cursor-pointer select-none transition-colors ${
                            task.completed
                              ? 'bg-slate-50/80'
                              : 'bg-white hover:bg-slate-50/60'
                          }`}
                        >
                          <span className="pt-0.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompleted(task.id)}
                              className="sr-only peer"
                            />
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                task.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600'
                              }`}
                            >
                              {task.completed && (
                                <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                              )}
                            </span>
                          </span>

                          <span className="flex-1 min-w-0">
                            <span
                              className={`block text-sm font-medium leading-snug transition-colors ${
                                task.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  task.completed ? 'text-slate-400' : meta.accentText
                                }`}
                              >
                                <SubjectIcon
                                  subject={task.subject}
                                  className="w-3.5 h-3.5"
                                />
                                {meta.fullLabel}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {task.durationHours.toFixed(1)}{' '}
                                {task.durationHours === 1 ? 'hr' : 'hrs'}
                              </span>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
