import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "taskflow-web-state";

const initialTasks = [
  { id: "welcome-1", title: "Review project brief", category: "Work", dueDate: "", priority: "High", completed: true },
  { id: "welcome-2", title: "Finish presentation", category: "Work", dueDate: "", priority: "Medium", completed: false },
  { id: "welcome-3", title: "Read 20 pages", category: "Personal", dueDate: "", priority: "Low", completed: false },
];

const initialHabits = [
  { id: "habit-1", title: "Drink water", icon: "W", completed: false },
  { id: "habit-2", title: "Read for 20 minutes", icon: "R", completed: false },
  { id: "habit-3", title: "Evening walk", icon: "E", completed: true },
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.tasks && saved?.habits) return saved;
  } catch {}
  return { tasks: initialTasks, habits: initialHabits, profileName: "" };
}

function getInitialSection() {
  const requestedSection = new URLSearchParams(window.location.search).get("view");
  return ["Today", "Tasks", "Habits", "Focus", "Profile"].includes(requestedSection)
    ? requestedSection
    : "Today";
}

function Icon({ name }) {
  const icons = {
    today: <><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9v11h13V9M9.5 20v-6h5v6" /></>,
    tasks: <><rect x="4" y="4" width="16" height="17" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5M9 2.5v3M15 2.5v3" /></>,
    habits: <><path d="M20.5 4c-7.5 0-13 2.7-13 8a5.5 5.5 0 0 0 5.5 5.5c5.3 0 7.5-6 7.5-13.5Z" /><path d="M3.5 21c2-5 5.5-8.5 11-11" /></>,
    focus: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2M9 2.5h6M12 2.5v1" /></>,
  };
  return (
    <span className="tf-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" focusable="false">
        {icons[name]}
      </svg>
    </span>
  );
}

export default function WebAppPage() {
  const [state, setState] = useState(loadState);
  const [section, setSection] = useState(getInitialSection);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [composer, setComposer] = useState(null);
  const [profileName, setProfileName] = useState(state.profileName);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(window.taskflowDeferredInstallPrompt);
  const [appInstalled, setAppInstalled] = useState(window.matchMedia("(display-mode: standalone)").matches);
  const showInstallPanel = new URLSearchParams(window.location.search).has("install");

  useEffect(() => {
    function handleInstallPromptAvailable() {
      setInstallPrompt(window.taskflowDeferredInstallPrompt);
    }
    function handleAppInstalled() {
      setInstallPrompt(null);
      setAppInstalled(true);
    }
    window.addEventListener("taskflowinstallprompt", handleInstallPromptAvailable);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("taskflowinstallprompt", handleInstallPromptAvailable);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    window.taskflowDeferredInstallPrompt = null;
    setInstallPrompt(null);
    if (outcome === "accepted") setAppInstalled(true);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, profileName }));
  }, [state, profileName]);

  useEffect(() => {
    if (!focusRunning) return undefined;
    const timer = window.setInterval(() => {
      setFocusSeconds((seconds) => {
        if (seconds <= 1) {
          setFocusRunning(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);

  const completed = state.tasks.filter((task) => task.completed).length;
  const progress = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const visibleTasks = useMemo(() => {
    return state.tasks
      .filter((task) => filter === "All" || (filter === "Completed" ? task.completed : !task.completed))
      .filter((task) => `${task.title} ${task.category}`.toLowerCase().includes(search.toLowerCase()));
  }, [state.tasks, filter, search]);

  function toggleTask(id) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task),
    }));
  }

  function deleteTask(id) {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  }

  function addTask(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("title").trim();
    if (!title) return;
    setState((current) => ({
      ...current,
      tasks: [...current.tasks, {
        id: `task-${Date.now()}`,
        title,
        category: form.get("category"),
        dueDate: form.get("dueDate"),
        priority: form.get("priority"),
        completed: false,
      }],
    }));
    setComposer(null);
  }

  function toggleHabit(id) {
    setState((current) => ({
      ...current,
      habits: current.habits.map((habit) => habit.id === id ? { ...habit, completed: !habit.completed } : habit),
    }));
  }

  function addHabit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("title").trim();
    if (!title) return;
    setState((current) => ({
      ...current,
      habits: [...current.habits, { id: `habit-${Date.now()}`, title, icon: title[0]?.toUpperCase() || "H", completed: false }],
    }));
    setComposer(null);
  }

  function resetFocus() {
    setFocusRunning(false);
    setFocusSeconds(focusMinutes * 60);
  }

  return (
    <main className="taskflow-web-app">
      {(showInstallPanel || installPrompt) && (
        <div className="tf-install-panel" role="region" aria-label="Instalare TaskFlow">
          <div>
            <strong>{appInstalled ? "TaskFlow este instalat" : "Instalează TaskFlow pe Windows"}</strong>
            <span>
              {appInstalled
                ? "Poți deschide aplicația din meniul Start."
                : installPrompt
                  ? "Deschide TaskFlow ca aplicație desktop."
                  : "În Edge sau Chrome, deschide meniul ••• sau Apps și alege „Instalează TaskFlow”."}
            </span>
          </div>
          {!appInstalled && installPrompt && (
            <button type="button" onClick={handleInstall}>Instalează aplicația</button>
          )}
        </div>
      )}
      <aside className="tf-sidebar">
        <a className="tf-brand" href="/" aria-label="TaskFlow home">
          <span className="brand-mark"><span /><span /><span /></span>
          <strong>taskflow</strong>
        </a>

        <nav className="tf-nav" aria-label="TaskFlow app navigation">
          {["Today", "Tasks", "Habits", "Focus"].map((item) => (
            <button key={item} type="button" className={section === item ? "active" : ""} onClick={() => setSection(item)}>
              <Icon name={item.toLowerCase()} />
              <span className="tf-nav-label">{item}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="tf-profile" onClick={() => setSection("Profile")}>
          <span>{profileName ? profileName[0].toUpperCase() : "T"}</span>
          <div><strong>{profileName || "My profile"}</strong><small>Personal space</small></div>
          <b>···</b>
        </button>
      </aside>

      <section className="tf-workspace">
        <header className="tf-topbar">
          <div>
            <span>{dateLabel}</span>
            <h1>{section === "Today" ? `${greeting}${profileName ? `, ${profileName}` : ""}` : section}</h1>
          </div>
          {section !== "Profile" && (
            <button type="button" className="tf-add-button" onClick={() => setComposer(section === "Habits" ? "habit" : "task")}>
              + Add {section === "Habits" ? "habit" : "task"}
            </button>
          )}
        </header>

        {section === "Today" && (
          <div className="tf-content">
            <article className="tf-progress-card">
              <div><span>Today&apos;s progress</span><strong>{completed} <small>/ {state.tasks.length} tasks</small></strong></div>
              <div className="tf-progress-ring" style={{ "--progress": `${progress * 3.6}deg` }}><b>{progress}%</b></div>
              <div className="tf-progress-track"><i style={{ width: `${progress}%` }} /></div>
            </article>

            <div className="tf-section-heading">
              <div><span>YOUR NEXT STEPS</span><h2>Today&apos;s tasks</h2></div>
              <button type="button" onClick={() => setSection("Tasks")}>View all</button>
            </div>
            <div className="tf-task-list">
              {state.tasks.slice(0, 5).map((task) => (
                <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} />
              ))}
              {!state.tasks.length && <div className="tf-empty">A clear day, a fresh start.</div>}
            </div>

            <div className="tf-habit-grid">
              {state.habits.slice(0, 3).map((habit) => (
                <button type="button" key={habit.id} className={`tf-habit-card ${habit.completed ? "completed" : ""}`} onClick={() => toggleHabit(habit.id)}>
                  <span>{habit.icon}</span><div><strong>{habit.title}</strong><small>{habit.completed ? "Completed today" : "Mark as done"}</small></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {section === "Tasks" && (
          <div className="tf-content">
            <div className="tf-toolbar">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or categories" />
              <div className="tf-filters">
                {["All", "Open", "Completed"].map((item) => (
                  <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>
                ))}
              </div>
            </div>
            <div className="tf-task-list">
              {visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} />
              ))}
              {!visibleTasks.length && <div className="tf-empty">No tasks match this view.</div>}
            </div>
          </div>
        )}

        {section === "Habits" && (
          <div className="tf-content tf-habits-page">
            {state.habits.map((habit) => (
              <button type="button" key={habit.id} className={`tf-habit-card ${habit.completed ? "completed" : ""}`} onClick={() => toggleHabit(habit.id)}>
                <span>{habit.icon}</span><div><strong>{habit.title}</strong><small>{habit.completed ? "Completed today" : "Daily habit"}</small></div>
                <b>{habit.completed ? "✓" : "○"}</b>
              </button>
            ))}
          </div>
        )}

        {section === "Focus" && (
          <div className="tf-content tf-focus-page">
            <article className="tf-focus-card">
              <span>FOCUS SESSION</span>
              <div className="tf-focus-time">{String(Math.floor(focusSeconds / 60)).padStart(2, "0")}:{String(focusSeconds % 60).padStart(2, "0")}</div>
              <p>One task. No distractions.</p>
              <div className="tf-focus-controls">
                <button type="button" onClick={() => setFocusRunning((running) => !running)}>{focusRunning ? "Pause" : "Start"}</button>
                <button type="button" onClick={resetFocus}>Reset</button>
              </div>
              <select value={focusMinutes} onChange={(event) => { const value = Number(event.target.value); setFocusMinutes(value); setFocusSeconds(value * 60); setFocusRunning(false); }}>
                {[15, 25, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
              </select>
            </article>
          </div>
        )}

        {section === "Profile" && (
          <div className="tf-content tf-profile-page">
            <article>
              <span className="tf-profile-avatar">{profileName ? profileName[0].toUpperCase() : "T"}</span>
              <label>Display name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" /></label>
              <p>Your data is stored privately in this browser.</p>
            </article>
          </div>
        )}
      </section>

      {composer === "task" && (
        <div className="tf-modal-backdrop" role="presentation" onMouseDown={() => setComposer(null)}>
          <form className="tf-modal" onSubmit={addTask} onMouseDown={(event) => event.stopPropagation()}>
            <div><span>NEW TASK</span><button type="button" onClick={() => setComposer(null)}>×</button></div>
            <label>Task name<input name="title" autoFocus placeholder="What needs to be done?" /></label>
            <div className="tf-modal-grid">
              <label>Category<select name="category"><option>Work</option><option>Personal</option><option>Learning</option></select></label>
              <label>Priority<select name="priority"><option>Medium</option><option>High</option><option>Low</option></select></label>
              <label>Due date<input name="dueDate" type="date" /></label>
            </div>
            <button type="submit" className="tf-modal-submit">Create task</button>
          </form>
        </div>
      )}

      {composer === "habit" && (
        <div className="tf-modal-backdrop" role="presentation" onMouseDown={() => setComposer(null)}>
          <form className="tf-modal" onSubmit={addHabit} onMouseDown={(event) => event.stopPropagation()}>
            <div><span>NEW HABIT</span><button type="button" onClick={() => setComposer(null)}>×</button></div>
            <label>Habit name<input name="title" autoFocus placeholder="What would you like to repeat?" /></label>
            <button type="submit" className="tf-modal-submit">Create habit</button>
          </form>
        </div>
      )}
    </main>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  return (
    <article className={`tf-task-row ${task.completed ? "completed" : ""}`}>
      <button type="button" className="tf-check" onClick={onToggle} aria-label={task.completed ? "Mark incomplete" : "Mark complete"}>{task.completed ? "✓" : ""}</button>
      <div><strong>{task.title}</strong><small>{task.category}{task.dueDate ? ` · ${task.dueDate}` : ""}</small></div>
      <span className={`tf-priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
      <button type="button" className="tf-delete" onClick={onDelete} aria-label={`Delete ${task.title}`}>×</button>
    </article>
  );
}
