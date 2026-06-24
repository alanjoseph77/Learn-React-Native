// ================================================================
//  SECTION METADATA (must match build.js's SECTIONS order/colors)
// ================================================================
const SECTION_META = [
  { name: "Fundamentals",         color: "blue",   icon: "fa-seedling",         range: "Lessons 00–14", desc: "TS/JS primer, JSX, props, state, styling, navigation, fetching, your first app" },
  { name: "Advanced Hooks",       color: "purple", icon: "fa-link",             range: "Lessons 15–18", desc: "useMemo, useCallback, useRef, custom hooks, Context API" },
  { name: "State Management",     color: "pink",   icon: "fa-diagram-project",  range: "Lessons 19–20", desc: "Redux Toolkit, Zustand" },
  { name: "Backend Integration",  color: "green",  icon: "fa-server",           range: "Lessons 21–26", desc: "REST APIs, JWT auth, login/register, refresh tokens, file upload" },
  { name: "Database",             color: "amber",  icon: "fa-database",         range: "Lessons 27–30", desc: "AsyncStorage, SQLite, Firestore, MongoDB Atlas" },
  { name: "Real-Time",            color: "cyan",   icon: "fa-bolt",             range: "Lessons 31–34", desc: "WebSockets, Socket.io, Firebase Realtime DB, Chat App" },
  { name: "Native Features",      color: "red",    icon: "fa-mobile-screen",    range: "Lessons 35–40", desc: "Push notifications, BLE, Camera, GPS, Sensors, Background tasks" },
  { name: "Performance",          color: "orange", icon: "fa-gauge-high",       range: "Lessons 41–44", desc: "Memoization, FlatList optimization, Lazy loading, Image optimization" },
  { name: "Testing",              color: "lime",   icon: "fa-vial",             range: "Lessons 45–46", desc: "Jest, React Native Testing Library" },
  { name: "Deployment",           color: "indigo", icon: "fa-rocket",           range: "Lessons 47–48", desc: "Android (Play Store), iOS (App Store)" },
  { name: "Professional Skills",  color: "rose",   icon: "fa-graduation-cap",   range: "Lessons 49–53", desc: "TypeScript mastery, Git/GitHub, env config, error handling, CI/CD" },
];

// ================================================================
//  APP STATE
// ================================================================
let currentLesson = null;
const progress = JSON.parse(localStorage.getItem("rn_progress") || "{}");

// ================================================================
//  WELCOME SCREEN -- SECTION CARDS
// ================================================================
function buildSectionCards() {
  const wrap = document.getElementById("sectionCards");
  wrap.innerHTML = SECTION_META.map((s) => `
    <div class="stage-card border-${s.color}" data-section="${s.name}">
      <div class="stage-card-icon icon-${s.color}"><i class="fa-solid ${s.icon}"></i></div>
      <h3>${s.name}</h3>
      <p class="stage-card-desc">${s.desc}</p>
      <span class="stage-card-range">${s.range}</span>
    </div>`).join("");

  wrap.querySelectorAll(".stage-card").forEach((card) => {
    card.addEventListener("click", () => {
      const first = LESSONS.find((l) => l.section === card.dataset.section);
      if (first) openLesson(first);
    });
  });
}

// ================================================================
//  BUILD SIDEBAR
// ================================================================
function buildSidebar(filter = "") {
  const list = document.getElementById("lessonList");
  list.innerHTML = "";

  SECTION_META.forEach((section) => {
    const lessons = LESSONS.filter((l) =>
      l.section === section.name &&
      (filter === "" || l.title.toLowerCase().includes(filter.toLowerCase()))
    );
    if (lessons.length === 0) return;

    const group = document.createElement("div");
    group.className = "stage-group";
    group.innerHTML = `<div class="stage-group-label"><span class="stage-dot dot-${section.color}"></span>${section.name}</div>`;

    lessons.forEach((lesson) => {
      const done = !!progress[lesson.id];
      const active = currentLesson && currentLesson.id === lesson.id;
      const item = document.createElement("div");
      item.className = `lesson-item${done ? " done" : ""}${active ? " active" : ""}`;
      item.innerHTML = `
        <div class="lesson-num">${done
          ? '<i class="fa-solid fa-check"></i>'
          : String(lesson.num).padStart(2, "0")}</div>
        <div class="lesson-info">
          <div class="lesson-item-title">${lesson.title}</div>
          <div class="lesson-item-sub">${(lesson.subtitle || "").slice(0, 44)}…</div>
        </div>`;
      item.onclick = () => {
        openLesson(lesson);
        document.getElementById("sidebar").classList.remove("open");
        document.getElementById("backdrop").classList.remove("open");
      };
      group.appendChild(item);
    });

    list.appendChild(group);
  });
}

// ================================================================
//  OPEN LESSON
// ================================================================
function saveCurrentNotes() {
  if (!currentLesson) return;
  const val = document.getElementById("notesArea").value;
  if (val.trim() === "") {
    localStorage.removeItem(`rn_notes_${currentLesson.id}`);
  } else {
    localStorage.setItem(`rn_notes_${currentLesson.id}`, val);
  }
}

function openLesson(lesson) {
  saveCurrentNotes();   // persist whatever was in the previous lesson's notes box

  currentLesson = lesson;
  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("lessonView").classList.remove("hidden");

  const section = SECTION_META.find((s) => s.name === lesson.section);

  document.getElementById("lessonBadge").textContent = `Lesson ${String(lesson.num).padStart(2, "0")}`;
  document.getElementById("lessonTitle").textContent = lesson.title;
  document.getElementById("lessonDesc").textContent = lesson.subtitle || "";

  const tag = document.getElementById("lessonSectionTag");
  tag.textContent = lesson.section;
  tag.className = `lesson-stage-tag tag-${lesson.color}`;

  const milestoneEl = document.getElementById("lessonMilestone");
  if (lesson.milestone) {
    milestoneEl.textContent = lesson.milestone.replace(/\.$/, "");
    milestoneEl.classList.remove("hidden");
  } else {
    milestoneEl.classList.add("hidden");
  }

  // Goals / key takeaways
  const goalsBox = document.getElementById("lessonGoalsBox");
  if (lesson.takeaways && lesson.takeaways.length) {
    document.getElementById("lessonGoals").innerHTML =
      lesson.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
    goalsBox.classList.remove("hidden");
  } else {
    goalsBox.classList.add("hidden");
  }

  // Body: main code panel + practice questions panel
  const body = document.getElementById("lessonBody");
  body.innerHTML = "";
  body.appendChild(buildCodePanel("Lesson Code", "fa-code", "green", lesson.mainCode, lesson.filename));
  if (lesson.questionsCode) {
    body.appendChild(buildCodePanel("Practice Questions", "fa-dumbbell", "amber", lesson.questionsCode, lesson.filename, true));
  }

  // Notes (load saved value for this lesson)
  document.getElementById("notesArea").value = localStorage.getItem(`rn_notes_${lesson.id}`) || "";

  // Done button
  const doneBtn = document.getElementById("doneBtn");
  if (progress[lesson.id]) {
    doneBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed';
    doneBtn.className = "btn-done completed";
  } else {
    doneBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Mark Complete';
    doneBtn.className = "btn-done";
  }

  // Prev / Next
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  document.getElementById("prevBtn").disabled = idx === 0;
  document.getElementById("nextBtn").disabled = idx === LESSONS.length - 1;

  buildSidebar(document.getElementById("searchBox").value);
  document.getElementById("mainContent").scrollTo(0, 0);
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildCodePanel(label, icon, accent, code, filename, isQuestions = false) {
  const div = document.createElement("div");
  div.className = "code-block" + (isQuestions ? " questions-block" : "");
  const langClass = "language-tsx";
  div.innerHTML = `
    <div class="code-block-hdr">
      <span class="code-block-title">
        <i class="fa-solid ${icon}"></i> ${label} <span style="opacity:.5">— ${filename}</span>
      </span>
      <button class="btn-copy"><i class="fa-solid fa-copy"></i> Copy</button>
    </div>
    <pre class="${langClass}"><code class="${langClass}"></code></pre>`;

  const codeEl = div.querySelector("code");
  codeEl.textContent = code;   // set as text first (safe), Prism re-highlights below

  div.querySelector(".btn-copy").addEventListener("click", (e) => {
    navigator.clipboard.writeText(code).then(() => {
      const btn = e.currentTarget;
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
  });

  // Highlight once attached to the DOM (Prism reads textContent)
  requestAnimationFrame(() => {
    if (window.Prism) Prism.highlightElement(codeEl);
  });

  return div;
}

// ================================================================
//  PROGRESS
// ================================================================
function updateProgress() {
  const done = Object.keys(progress).length;
  const total = LESSONS.length;
  document.getElementById("progressFill").style.width = Math.round((done / total) * 100) + "%";
  document.getElementById("progressText").textContent = `${done} / ${total}`;
  const sd = document.getElementById("statDone");
  if (sd) sd.textContent = done;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

// ================================================================
//  EVENTS
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  buildSectionCards();
  buildSidebar();
  updateProgress();

  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  function openSidebar() { sidebar.classList.add("open"); backdrop.classList.add("open"); }
  function closeSidebar() { sidebar.classList.remove("open"); backdrop.classList.remove("open"); }

  document.getElementById("hamburger").addEventListener("click", openSidebar);
  document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
  backdrop.addEventListener("click", closeSidebar);

  document.getElementById("searchBox").addEventListener("input", (e) => {
    buildSidebar(e.target.value);
  });

  document.getElementById("startBtn").addEventListener("click", () => {
    openLesson(LESSONS[0]);
  });

  // Notes autosave (debounced)
  let notesTimer = null;
  document.getElementById("notesArea").addEventListener("input", () => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(saveCurrentNotes, 400);
  });

  // Mark complete
  document.getElementById("doneBtn").addEventListener("click", () => {
    if (!currentLesson) return;
    const doneBtn = document.getElementById("doneBtn");
    if (progress[currentLesson.id]) {
      delete progress[currentLesson.id];
      doneBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Mark Complete';
      doneBtn.className = "btn-done";
      showToast("Unmarked");
    } else {
      progress[currentLesson.id] = true;
      doneBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed';
      doneBtn.className = "btn-done completed";
      showToast(`Lesson ${currentLesson.num} completed!`);
    }
    localStorage.setItem("rn_progress", JSON.stringify(progress));
    updateProgress();
    buildSidebar(document.getElementById("searchBox").value);
  });

  // Prev / Next
  document.getElementById("prevBtn").addEventListener("click", () => {
    const idx = LESSONS.findIndex((l) => l.id === currentLesson.id);
    if (idx > 0) openLesson(LESSONS[idx - 1]);
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    const idx = LESSONS.findIndex((l) => l.id === currentLesson.id);
    if (idx < LESSONS.length - 1) openLesson(LESSONS[idx + 1]);
  });

  // Reset
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset ALL progress? This cannot be undone.")) return;
    Object.keys(progress).forEach((k) => delete progress[k]);
    localStorage.removeItem("rn_progress");
    updateProgress();
    buildSidebar(document.getElementById("searchBox").value);
    showToast("Progress reset");
  });

  // Save notes if the user leaves/closes the tab
  window.addEventListener("beforeunload", saveCurrentNotes);
});
