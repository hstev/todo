import {
  addComment,
  addTask,
  activeTasks,
  completeFromFocus,
  deleteComment,
  deletedTasks,
  elapsedMs,
  exportPayload,
  getState,
  maybeResetDay,
  msUntilMidnight,
  pauseTimer,
  renameTask,
  restoreTask,
  runningTask,
  softDelete,
  startTimer,
  subscribe,
  taskStatus,
  toggleTask,
  updateComment,
  updateSettings,
  resetTasks,
} from './store.js';
import {
  escapeHtml,
  formatArchiveDate,
  formatClock,
  formatDuration,
  formatLongDate,
  greeting,
  relativeTime,
} from './format.js';
import { icons } from './icons.js';

const app = document.getElementById('app');

function parseRoute() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const focus = hash.match(/^\/foco\/(.+)$/);
  if (focus) return { name: 'focus', id: decodeURIComponent(focus[1]) };
  if (hash === '/eliminados') return { name: 'deleted' };
  if (hash === '/datos') return { name: 'data' };
  if (hash === '/ajustes') return { name: 'settings' };
  return { name: 'home' };
}

function go(path) {
  if (location.hash === `#${path}`) {
    render();
    return;
  }
  location.hash = path;
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#161310' : '#f3efe6');
}

function nav(active) {
  const deletedCount = deletedTasks().length;
  const items = [
    ['/', 'Hoy', active === 'home'],
    ['/eliminados', 'Eliminados', active === 'deleted', deletedCount],
    ['/datos', 'Datos', active === 'data'],
    ['/ajustes', 'Ajustes', active === 'settings'],
  ];
  return `
    <nav class="nav" aria-label="Secciones">
      ${items
        .map(
          ([href, label, isActive, count]) => `
            <a href="#${href}" class="${isActive ? 'is-active' : ''}" ${
              isActive ? 'aria-current="page"' : ''
            }>
              ${label}${count ? `<span class="badge">${count}</span>` : ''}
            </a>`,
        )
        .join('')}
    </nav>
  `;
}

function header() {
  const { settings } = getState();
  const name = settings.name.trim();
  const title = name ? `${greeting()}, ${name}` : greeting();
  document.title = name || 'Hoy';
  return `
    <header class="masthead">
      <p class="date">${escapeHtml(formatLongDate())}</p>
      <h1>${escapeHtml(title)}</h1>
    </header>
  `;
}

function taskMeta(task, now) {
  const spent = elapsedMs(task, now);
  const bits = [
    `<span data-relative="${task.createdAt}">${relativeTime(task.createdAt, now)}</span>`,
  ];
  if (spent >= 1000) {
    bits.push(`<span class="tracked" data-elapsed="${task.id}">${formatDuration(spent)}</span>`);
  }
  return bits.join('<span class="dot" aria-hidden="true">·</span>');
}

function taskRow(task, now) {
  return `
    <li class="row ${task.completed ? 'is-done' : ''}" data-id="${task.id}">
      <button class="check" type="button" data-action="toggle" aria-label="${
        task.completed ? 'Marcar como pendiente' : 'Marcar como hecha'
      }">
        ${task.completed ? icons.check : ''}
      </button>
      <input
        class="title"
        data-role="title"
        value="${escapeHtml(task.title)}"
        aria-label="Título de la tarea"
        autocomplete="off"
      />
      <div class="meta">${taskMeta(task, now)}</div>
      <div class="actions">
        ${
          task.completed
            ? ''
            : `<button class="icon-btn" type="button" data-action="play" aria-label="Iniciar medición">
                ${icons.play}
              </button>`
        }
        <button class="icon-btn danger" type="button" data-action="delete" aria-label="Eliminar">
          ${icons.trash}
        </button>
      </div>
    </li>
  `;
}

function renderHome() {
  const tasks = activeTasks();
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const now = Date.now();
  return `
    <div class="shell">
      ${header()}
      ${nav('home')}
      <ul class="list" aria-label="Tareas de hoy">
        ${open.map((task) => taskRow(task, now)).join('')}
        ${done.map((task) => taskRow(task, now)).join('')}
        <li class="row composer">
          <span class="check ghost" aria-hidden="true"></span>
          <input
            id="composer"
            class="title"
            placeholder="Nueva tarea"
            aria-label="Nueva tarea"
            autocomplete="off"
            enterkeyhint="done"
          />
        </li>
      </ul>
    </div>
  `;
}

function renderDeleted() {
  const tasks = deletedTasks();
  const now = Date.now();
  return `
    <div class="shell">
      <header class="masthead">
        <p class="date">Se pueden restaurar</p>
        <h1>Eliminados</h1>
      </header>
      ${nav('deleted')}
      ${
        tasks.length === 0
          ? `<p class="empty">Nada en la papelera.</p>`
          : `<ul class="list">
              ${tasks
                .map(
                  (task) => `
                    <li class="row" data-id="${task.id}">
                      <span class="check ghost" aria-hidden="true"></span>
                      <p class="title static">${escapeHtml(task.title)}</p>
                      <div class="meta">
                        <span data-relative="${task.deletedAt}" data-relative-prefix="eliminada ">eliminada ${relativeTime(task.deletedAt, now)}</span>
                      </div>
                      <div class="actions always">
                        <button class="icon-btn" type="button" data-action="restore" aria-label="Restaurar">
                          ${icons.restore}
                        </button>
                      </div>
                    </li>`,
                )
                .join('')}
            </ul>`
      }
    </div>
  `;
}

function allHistory() {
  const { archive, lastResetDate } = getState();
  const today = {
    date: lastResetDate,
    tasks: getState().tasks,
    isToday: true,
  };
  return [...archive.map((day) => ({ ...day, isToday: false })), today].reverse();
}

function renderData() {
  const days = allHistory();
  const allTasks = days.flatMap((day) => day.tasks);
  const done = allTasks.filter((t) => t.completed && !t.deletedAt).length;
  const tracked = allTasks.reduce((sum, t) => sum + elapsedMs(t), 0);
  return `
    <div class="shell">
      <header class="masthead cluster">
        <div>
          <p class="date">Historial y metadatos</p>
          <h1>Datos</h1>
        </div>
        <button class="text-btn" type="button" data-action="export">
          ${icons.download} Exportar JSON
        </button>
      </header>
      ${nav('data')}
      <dl class="stats">
        <div><dt>Tareas</dt><dd>${allTasks.length}</dd></div>
        <div><dt>Hechas</dt><dd>${done}</dd></div>
        <div><dt>Tiempo</dt><dd>${formatDuration(tracked)}</dd></div>
        <div><dt>Días</dt><dd>${days.filter((d) => d.tasks.length).length}</dd></div>
      </dl>
      <div class="journal">
        ${days
          .filter((day) => day.tasks.length)
          .map(
            (day) => `
              <section>
                <h2>${day.isToday ? 'Hoy' : escapeHtml(formatArchiveDate(day.date))}</h2>
                <ul>
                  ${day.tasks
                    .slice()
                    .sort((a, b) => a.createdAt - b.createdAt)
                    .map((task) => {
                      const status = taskStatus(task);
                      return `
                        <li>
                          <span class="pill ${status.replace(' ', '-')}">${status}</span>
                          <span class="journal-title">${escapeHtml(task.title)}</span>
                          <span class="journal-meta">
                            ${formatClock(task.createdAt)}
                            ${elapsedMs(task) >= 1000 ? ` · ${formatDuration(elapsedMs(task))}` : ''}
                          </span>
                        </li>`;
                    })
                    .join('')}
                </ul>
              </section>`,
          )
          .join('') || `<p class="empty">Aún no hay tareas para mostrar.</p>`}
      </div>
    </div>
  `;
}

function renderSettings() {
  const { settings } = getState();
  const name = escapeHtml(settings.name);
  return `
    <div class="shell">
      <header class="masthead">
        <p class="date">Preferencias locales</p>
        <h1>Ajustes</h1>
      </header>
      ${nav('settings')}
      <form class="settings" id="settings-form">
        <label class="field">
          <span>Nombre</span>
          <input name="name" type="text" maxlength="40" value="${name}" placeholder="Cómo te llamas" autocomplete="nickname" />
          <small>Si lo escribes, aparece en la pantalla principal.</small>
        </label>
        <label class="switch">
          <input name="dailyReset" type="checkbox" ${settings.dailyReset ? 'checked' : ''} />
          <span>
            <strong>Reiniciar a las 00:00</strong>
            <small>El listado de hoy se archiva al cambiar el día y empiezas en blanco.</small>
          </span>
        </label>
        <fieldset class="field">
          <legend>Tema</legend>
          <div class="segmented" role="radiogroup" aria-label="Tema">
            ${['system', 'light', 'dark']
              .map((value) => {
                const labels = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' };
                return `
                  <label>
                    <input type="radio" name="theme" value="${value}" ${
                      settings.theme === value ? 'checked' : ''
                    } />
                    <span>${labels[value]}</span>
                  </label>`;
              })
              .join('')}
          </div>
        </fieldset>
      </form>
      <div class="field reset-tasks">
        <span>Tareas</span>
        <button class="btn ghost danger" type="button" data-action="reset-tasks">
          Reiniciar tareas
        </button>
        <small>Borra el listado de hoy y lo que haya en Eliminados. El historial de otros días se conserva.</small>
      </div>
    </div>
  `;
}

function commentsHtml(task, now = Date.now()) {
  const comments = task.comments ?? [];
  if (!comments.length) {
    return `<li class="comment-empty">Sin comentarios todavía.</li>`;
  }
  return comments
    .map(
      (comment) => `
        <li class="comment" data-comment-id="${comment.id}" data-action="edit-comment">
          <p class="comment-text">${escapeHtml(comment.text)}</p>
          <div class="actions">
            <button class="icon-btn danger" type="button" data-action="delete-comment" aria-label="Eliminar comentario">
              ${icons.trash}
            </button>
          </div>
          <span class="comment-meta" data-relative="${comment.updatedAt}">${relativeTime(comment.updatedAt, now)}</span>
        </li>`,
    )
    .join('');
}

function renderFocus(id) {
  const task = getState().tasks.find((item) => item.id === id && !item.deletedAt);
  if (!task) {
    go('/');
    return '';
  }
  const now = Date.now();
  return `
    <div class="focus" data-id="${task.id}">
      <button class="text-btn back" type="button" data-action="pause" data-id="${task.id}">
        ${icons.back} Pausar
      </button>
      <div class="focus-stage">
        <p class="focus-time" data-elapsed="${task.id}">${formatDuration(elapsedMs(task, now))}</p>
        <h1>${escapeHtml(task.title)}</h1>
        <div class="focus-actions">
          <button class="btn ghost" type="button" data-action="pause" data-id="${task.id}">Pausar</button>
          <button class="btn" type="button" data-action="complete-focus" data-id="${task.id}">Hecha</button>
        </div>
      </div>
      <section class="focus-notes" aria-label="Comentarios">
        <ul id="comment-list" class="focus-notes-list">${commentsHtml(task, now)}</ul>
        <form class="comment-composer" data-action="add-comment">
          <input
            id="comment-input"
            type="text"
            maxlength="280"
            placeholder="Escribe un comentario"
            aria-label="Nuevo comentario"
            autocomplete="off"
            enterkeyhint="send"
          />
        </form>
      </section>
    </div>
  `;
}

let pendingFocus = 'composer';
let pendingCommentScroll = null;
let skipCommentBlurSave = false;

function syncFocusComments(taskId) {
  const list = document.getElementById('comment-list');
  if (!list) {
    render();
    return;
  }
  const task = getState().tasks.find((item) => item.id === taskId && !item.deletedAt);
  if (!task) return;
  const keepBottom =
    pendingCommentScroll === 'end' ||
    list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  list.innerHTML = commentsHtml(task);
  if (keepBottom) list.scrollTop = list.scrollHeight;
  pendingCommentScroll = null;
}

function beginCommentEdit(row) {
  const textEl = row.querySelector('.comment-text');
  if (!textEl || textEl.tagName === 'INPUT') return;
  const input = document.createElement('input');
  input.className = 'comment-text';
  input.dataset.role = 'comment-edit';
  input.value = textEl.textContent;
  input.maxLength = 280;
  input.setAttribute('aria-label', 'Editar comentario');
  textEl.replaceWith(input);
  input.focus();
  input.select();
}

function saveCommentEdit(input) {
  const row = input.closest('[data-comment-id]');
  const taskId = document.querySelector('.focus')?.dataset.id;
  if (!row || !taskId) return;
  const changed = updateComment(taskId, row.dataset.commentId, input.value);
  if (!changed) syncFocusComments(taskId);
}

function restoreFocus() {
  if (pendingFocus === 'composer') {
    document.getElementById('composer')?.focus({ preventScroll: true });
    return;
  }
  if (pendingFocus?.task && pendingFocus.target === 'check') {
    document
      .querySelector(`[data-id="${pendingFocus.task}"] .check`)
      ?.focus({ preventScroll: true });
  }
}

function render() {
  const route = parseRoute();
  const { settings } = getState();
  applyTheme(settings.theme);

  const running = runningTask();
  if (running && route.name !== 'focus') {
    go(`/foco/${running.id}`);
    return;
  }

  let html = '';
  if (route.name === 'home') html = renderHome();
  else if (route.name === 'deleted') html = renderDeleted();
  else if (route.name === 'data') html = renderData();
  else if (route.name === 'settings') html = renderSettings();
  else if (route.name === 'focus') html = renderFocus(route.id);

  app.innerHTML = html;

  if (route.name === 'home') restoreFocus();
}

function downloadExport() {
  const payload = exportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `hoy-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function onClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const row = actionEl.closest('[data-id]');
  const id = actionEl.dataset.id || row?.dataset.id;

  if (action === 'toggle') {
    pendingFocus = { task: id, target: 'check' };
    toggleTask(id);
  } else if (action === 'delete') {
    pendingFocus = 'composer';
    softDelete(id);
  } else if (action === 'restore') {
    restoreTask(id);
  } else if (action === 'play') {
    startTimer(id);
    go(`/foco/${id}`);
  } else if (action === 'pause') {
    pauseTimer(id);
    pendingFocus = 'composer';
    go('/');
  } else if (action === 'complete-focus') {
    completeFromFocus(id);
    pendingFocus = 'composer';
    go('/');
  } else if (action === 'export') {
    downloadExport();
  } else if (action === 'reset-tasks') {
    resetTasks();
    actionEl.textContent = 'Listo';
    actionEl.disabled = true;
  } else if (action === 'add-comment') {
    event.preventDefault();
  } else if (action === 'delete-comment') {
    const taskId = document.querySelector('.focus')?.dataset.id;
    const commentId = actionEl.closest('[data-comment-id]')?.dataset.commentId;
    if (taskId && commentId) deleteComment(taskId, commentId);
  } else if (action === 'edit-comment') {
    beginCommentEdit(actionEl.closest('[data-comment-id]'));
  }
}

function onKeydown(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.id === 'comment-input') {
    if (event.key === 'Enter') {
      event.preventDefault();
      const taskId = document.querySelector('.focus')?.dataset.id;
      if (!taskId) return;
      const created = addComment(taskId, target.value);
      if (created) {
        target.value = '';
        pendingCommentScroll = 'end';
      }
    }
    return;
  }

  if (target.dataset.role === 'comment-edit') {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveCommentEdit(target);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      skipCommentBlurSave = true;
      const taskId = document.querySelector('.focus')?.dataset.id;
      if (taskId) syncFocusComments(taskId);
    }
    return;
  }

  if (target.id === 'composer') {
    if (event.key === 'Enter') {
      event.preventDefault();
      const created = addTask(target.value);
      if (created) {
        target.value = '';
        pendingFocus = 'composer';
      }
    }
    return;
  }

  if (target.dataset.role === 'title') {
    const id = target.closest('[data-id]')?.dataset.id;
    if (event.key === 'Enter') {
      event.preventDefault();
      renameTask(id, target.value);
      pendingFocus = 'composer';
      render();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      pendingFocus = 'composer';
      render();
    }
  }
}

function onFocusIn(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.role === 'title') {
    pendingFocus = null;
  }
}

function onFocusOut(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.role === 'title') {
    const id = target.closest('[data-id]')?.dataset.id;
    if (id) renameTask(id, target.value, false);
  }
  if (target instanceof HTMLInputElement && target.dataset.role === 'comment-edit') {
    if (skipCommentBlurSave) {
      skipCommentBlurSave = false;
      return;
    }
    saveCommentEdit(target);
  }
}

function onSettingsInput(event) {
  const form = event.target.closest('#settings-form');
  if (!form) return;
  const data = new FormData(form);
  updateSettings({
    name: String(data.get('name') ?? ''),
    dailyReset: data.get('dailyReset') === 'on',
    theme: String(data.get('theme') ?? 'system'),
  });
}

function tick() {
  const now = Date.now();
  document.querySelectorAll('[data-relative]').forEach((el) => {
    const prefix = el.dataset.relativePrefix ?? '';
    el.textContent = `${prefix}${relativeTime(Number(el.dataset.relative), now)}`;
  });
  document.querySelectorAll('[data-elapsed]').forEach((el) => {
    const task = getState().tasks.find((item) => item.id === el.dataset.elapsed);
    if (!task) return;
    el.textContent = formatDuration(elapsedMs(task, now));
  });
}

function scheduleMidnightReset() {
  window.setTimeout(() => {
    if (maybeResetDay()) {
      pendingFocus = 'composer';
      const running = runningTask();
      if (running) go(`/foco/${running.id}`);
      else if (parseRoute().name === 'focus') go('/');
      else render();
    }
    scheduleMidnightReset();
  }, msUntilMidnight() + 50);
}

export function mount() {
  applyTheme(getState().settings.theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyTheme(getState().settings.theme);
  });
  subscribe(() => {
    const route = parseRoute();
    if (route.name === 'settings') {
      applyTheme(getState().settings.theme);
      return;
    }
    if (route.name === 'focus') {
      syncFocusComments(route.id);
      return;
    }
    render();
  });
  window.addEventListener('hashchange', () => {
    pendingFocus = parseRoute().name === 'home' ? 'composer' : null;
    render();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (maybeResetDay()) {
      pendingFocus = 'composer';
      render();
    }
  });
  app.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.target.classList.contains('comment-composer')) return;
    const input = document.getElementById('comment-input');
    const taskId = document.querySelector('.focus')?.dataset.id;
    if (!input || !taskId) return;
    const created = addComment(taskId, input.value);
    if (created) {
      input.value = '';
      pendingCommentScroll = 'end';
    }
  });
  app.addEventListener('click', onClick);
  app.addEventListener('keydown', onKeydown);
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (parseRoute().name !== 'focus') return;
    const running = runningTask();
    if (!running) return;
    pauseTimer(running.id);
    pendingFocus = 'composer';
    go('/');
  });
  app.addEventListener('focusin', onFocusIn);
  app.addEventListener('focusout', onFocusOut);
  app.addEventListener('input', onSettingsInput);
  window.setInterval(tick, 1000);
  scheduleMidnightReset();

  const running = runningTask();
  if (running) location.hash = `/foco/${running.id}`;
  pendingFocus = 'composer';
  render();
}
