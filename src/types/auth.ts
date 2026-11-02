export interface UserProfile {
  id: string;
  userId: string; // chosen by user, 4-20 chars, alphanumeric + underscore
  fullName: string;
  createdAt: string; // ISO string
  salt: string;
  passwordHash: string;
  avatarBg: string;
}

export interface UserStudyStats {
  tasksCompleted: number;
  totalTasks: number;
  studyStreakDays: number;
  notesCount: number;
  quizzesTaken: number;
}
