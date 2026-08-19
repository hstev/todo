const STORAGE_KEY = 'hoy-todo:v1';

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function createTask(title) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    deletedAt: null,
    timeSpentMs: 0,
    timerStartedAt: null,
    comments: [],
  };
}

function normalizeTask(task) {
  return {
    ...task,
    comments: Array.isArray(task?.comments) ? task.comments : [],
  };
}

function defaultState() {
  return {
    settings: {
      name: '',
      dailyReset: true,
      theme: 'system',
    },
    lastResetDate: todayKey(),
    tasks: [],
    archive: [],
  };
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...(parsed.settings ?? {}) },
      tasks: (Array.isArray(parsed.tasks) ? parsed.tasks : []).map(normalizeTask),
      archive: (Array.isArray(parsed.archive) ? parsed.archive : []).map((day) => ({
        ...day,
        tasks: (day.tasks ?? []).map(normalizeTask),
      })),
    };
  } catch {
    return defaultState();
  }
}

function settleTimer(task, now = Date.now()) {
  if (!task.timerStartedAt) return task;
  return {
    ...task,
    timeSpentMs: task.timeSpentMs + (now - task.timerStartedAt),
    timerStartedAt: null,
    updatedAt: now,
  };
}

let state = loadRaw();
const listeners = new Set();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persist();
  for (const listener of listeners) listener(state);
}

function archiveCurrentDay(fromDate) {
  if (!state.tasks.length) return;
  state.archive = [
    ...state.archive,
    {
      date: fromDate,
      archivedAt: Date.now(),
      tasks: state.tasks.map((task) => settleTimer({ ...task })),
    },
  ];
  state.tasks = [];
}

export function maybeResetDay() {
  const today = todayKey();
  if (!state.lastResetDate) {
    state.lastResetDate = today;
    persist();
    return false;
  }
  if (!state.settings.dailyReset) {
    if (state.lastResetDate !== today) {
      state.lastResetDate = today;
      persist();
    }
    return false;
  }
  if (state.lastResetDate === today) return false;
  archiveCurrentDay(state.lastResetDate);
  state.lastResetDate = today;
  persist();
  return true;
}

maybeResetDay();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addTask(title) {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const task = createTask(trimmed);
  state = { ...state, tasks: [...state.tasks, task] };
  emit();
  return task;
}

export function updateTask(id, patch, notify = true) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...patch, updatedAt: now } : task,
    ),
  };
  if (notify) emit();
  else persist();
}

export function renameTask(id, title, notify = true) {
  const trimmed = title.trim();
  if (!trimmed) return;
  const current = state.tasks.find((task) => task.id === id);
  if (!current || current.title === trimmed) return;
  updateTask(id, { title: trimmed }, notify);
}

export function toggleTask(id) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== id) return task;
      const settled = settleTimer(task, now);
      const completed = !settled.completed;
      return {
        ...settled,
        completed,
        completedAt: completed ? now : null,
        updatedAt: now,
      };
    }),
  };
  emit();
}

export function softDelete(id) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== id) return task;
      return {
        ...settleTimer(task, now),
        deletedAt: now,
        updatedAt: now,
      };
    }),
  };
  emit();
}

export function restoreTask(id) {
  updateTask(id, { deletedAt: null });
}

export function startTimer(id) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.deletedAt) return task;
      if (task.id === id) {
        if (task.timerStartedAt) return task;
        return { ...task, timerStartedAt: now, updatedAt: now };
      }
      return settleTimer(task, now);
    }),
  };
  emit();
}

export function pauseTimer(id) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id ? settleTimer(task, now) : task,
    ),
  };
  emit();
}

export function completeFromFocus(id) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== id) return task;
      const settled = settleTimer(task, now);
      return {
        ...settled,
        completed: true,
        completedAt: now,
        updatedAt: now,
      };
    }),
  };
  emit();
}

function patchTaskComments(taskId, mutate) {
  const now = Date.now();
  state = {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        comments: mutate([...(task.comments ?? [])]),
        updatedAt: now,
      };
    }),
  };
  emit();
}

export function addComment(taskId, text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const now = Date.now();
  const comment = {
    id: crypto.randomUUID(),
    text: trimmed,
    createdAt: now,
    updatedAt: now,
  };
  patchTaskComments(taskId, (comments) => [...comments, comment]);
  return comment;
}

export function updateComment(taskId, commentId, text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const current = state.tasks
    .find((task) => task.id === taskId)
    ?.comments?.find((comment) => comment.id === commentId);
  if (!current || current.text === trimmed) return false;
  const now = Date.now();
  patchTaskComments(taskId, (comments) =>
    comments.map((comment) =>
      comment.id === commentId ? { ...comment, text: trimmed, updatedAt: now } : comment,
    ),
  );
  return true;
}

export function deleteComment(taskId, commentId) {
  patchTaskComments(taskId, (comments) => comments.filter((comment) => comment.id !== commentId));
}

export function resetTasks() {
  state = {
    ...state,
    tasks: [],
    lastResetDate: todayKey(),
  };
  emit();
}

export function updateSettings(patch) {
  state = {
    ...state,
    settings: { ...state.settings, ...patch },
  };
  emit();
}

export function activeTasks() {
  return state.tasks.filter((task) => !task.deletedAt);
}

export function deletedTasks() {
  return state.tasks
    .filter((task) => task.deletedAt)
    .slice()
    .sort((a, b) => b.deletedAt - a.deletedAt);
}

export function runningTask() {
  return state.tasks.find((task) => task.timerStartedAt && !task.deletedAt) ?? null;
}

export function elapsedMs(task, now = Date.now()) {
  if (!task) return 0;
  return task.timeSpentMs + (task.timerStartedAt ? now - task.timerStartedAt : 0);
}

export function msUntilMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function exportPayload() {
  const snapshot = JSON.parse(JSON.stringify(state));
  snapshot.tasks = snapshot.tasks.map((task) => settleTimer(task));
  snapshot.exportedAt = new Date().toISOString();
  return snapshot;
}

export function taskStatus(task) {
  if (task.deletedAt) return 'eliminada';
  if (task.timerStartedAt) return 'en curso';
  if (task.completed) return 'hecha';
  return 'pendiente';
}

export { todayKey };
