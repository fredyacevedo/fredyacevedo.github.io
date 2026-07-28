const DB_KEY = "estetica-mooc-db-v1";
const SESSION_KEY = "estetica-mooc-session-v1";
const app = document.getElementById("app");

let db = loadDb();
let session = loadSession();
let ui = {
  view: "overview",
  courseId: null,
  gradeStudentId: null,
  gradeItemId: null,
  editUserId: null,
  editCourseId: null,
  usersTab: "students",
  dirty: false,
};

const BRAND_NAME = "JESSIKA RUIZ ACADEMIA";
const BRAND_TAGLINE = "Gestión académica simple para cursos, temarios, matrículas y notas.";

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function inferKind(title) {
  const text = title.toLowerCase();
  if (text.includes("práctica") || text.includes("practica") || text.includes("brigada") || text.includes("modelo real") || text.includes("examen final") || text.includes("evaluación final") || text.includes("evaluacion final")) {
    return "practice";
  }
  return "topic";
}

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
  return Number(value).toFixed(1);
}

function average(values) {
  const filtered = values.map(Number).filter((value) => !Number.isNaN(value));
  if (!filtered.length) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function round(value) {
  return value === null || value === undefined ? null : Math.round(value * 10) / 10;
}

function resetUiState(next = {}) {
  ui = {
    view: "overview",
    courseId: null,
    gradeStudentId: null,
    gradeItemId: null,
    editUserId: null,
    editCourseId: null,
    usersTab: "students",
    dirty: false,
    ...next,
  };
}

function searchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function setDirty(next = true) {
  ui.dirty = next;
}

function confirmDiscardChanges() {
  if (!ui.dirty) return true;
  return confirm("Tienes cambios sin guardar. ¿Deseas salir y perderlos?");
}

function markClean() {
  ui.dirty = false;
}

function courseLabel(course) {
  return course ? course.name : "";
}

function userLabel(user) {
  return user ? `${user.fullName} @${user.username}` : "";
}

function resolveByText(options, text) {
  const needle = searchText(text);
  if (!needle) return null;
  const exact = options.find((option) => searchText(option.label) === needle || searchText(option.id) === needle);
  if (exact) return exact;
  const matches = options.filter((option) => searchText(option.label).includes(needle) || searchText(option.id).includes(needle));
  return matches.length === 1 ? matches[0] : null;
}

function autocompleteMarkup({ key, label, placeholder, options, selectedId = "", name = key }) {
  const listId = `${key}-list`;
  const selected = options.find((option) => option.id === selectedId) || null;
  return `
    <div class="field autocomplete-field">
      <label>${label}</label>
      <input type="text" name="${name}Label" value="${escapeHtml(selected ? selected.label : "")}" placeholder="${escapeHtml(placeholder)}" list="${listId}" data-autocomplete-key="${key}" />
      <input type="hidden" name="${name}Id" value="${escapeHtml(selected?.id || selectedId || "")}" data-autocomplete-value="${key}" />
      <datalist id="${listId}">
        ${options.map((option) => `<option value="${escapeHtml(option.label)}"></option>`).join("")}
      </datalist>
    </div>
  `;
}

function syncAutocompleteField(input) {
  const key = input.dataset.autocompleteKey;
  const hidden = app.querySelector(`[data-autocomplete-value="${key}"]`);
  if (!hidden) return;
  const options = getAutocompleteOptions(key);
  const match = resolveByText(options, input.value);
  hidden.value = match?.id || "";
}

function getAutocompleteOptions(key) {
  if (key === "enroll-course" || key === "teacher-course" || key === "grade-course") {
    return db.courses.map((course) => ({ id: course.id, label: course.name }));
  }
  if (key === "enroll-student" || key === "teacher-user" || key === "grade-student") {
    return db.users.filter((user) => user.role === "student" || user.role === "teacher").map((user) => ({ id: user.id, label: userLabel(user) }));
  }
  if (key === "grade-item") {
    const course = courseById(ui.courseId) || db.courses[0] || null;
    return (course?.items || []).map((item) => ({ id: item.id, label: `${String(item.order).padStart(2, "0")} · ${item.title}` }));
  }
  return [];
}

function selectedCourseIds(form) {
  return Array.from(form.querySelectorAll("[name='courseIds[]']:checked")).map((input) => input.value);
}

function renderCourseChecklist(selectedIds = [], mode = "matricular") {
  const courses = db.courses;
  return `
    <div class="course-picklist">
      ${courses.map((course) => `
        <label class="course-picklist__item">
          <input type="checkbox" name="courseIds[]" value="${course.id}" ${selectedIds.includes(course.id) ? "checked" : ""} />
          <span>
            <strong>${course.name}</strong>
            <small>${mode === "asignar" ? "Asignado al docente" : "Matriculado al curso"}</small>
          </span>
        </label>
      `).join("")}
    </div>
  `;
}

function noteRowMarkup(note = {}, index = 0) {
  return `
    <tr class="table-editor__row">
      <td>${index + 1}</td>
      <td><input name="noteScore[]" type="number" min="0" max="5" step="0.1" value="${escapeHtml(note.score ?? "")}" placeholder="0.0" /></td>
      <td>
        <input type="hidden" name="noteLabel[]" value="Calificación ${index + 1}" />
        <button class="btn btn--ghost icon-btn" type="button" data-remove-note-row aria-label="Eliminar nota">−</button>
      </td>
    </tr>
  `;
}

function newNoteRows(notes = []) {
  const base = notes.length ? notes : [{ score: "" }, { score: "" }];
  return base.map((note, index) => noteRowMarkup(note, index)).join("");
}

function loadDb() {
  const stored = safeParse(localStorage.getItem(DB_KEY));
  if (stored && stored.users && stored.courses) return stored;
  const seeded = buildInitialDb(window.SCHOOL_SEED);
  localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveDb(nextDb) {
  db = nextDb;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function loadSession() {
  return safeParse(localStorage.getItem(SESSION_KEY));
}

function saveSession(nextSession) {
  session = nextSession;
  if (nextSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function safeParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildInitialDb(seed) {
  const users = seed.users.map((user) => ({ ...user }));
  const courses = seed.courses.map((course) => ({
    id: course.id,
    name: course.name,
    description: course.description,
    teacherIds: seed.assignments.filter((item) => item.courseId === course.id).map((item) => item.userId),
    studentIds: seed.enrollments.filter((item) => item.courseId === course.id).map((item) => item.userId),
    items: course.lessons.map((title, index) => ({
      id: `${course.id}-${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      title,
      kind: inferKind(title),
    })),
  }));

  const grades = seed.grades.map((grade) => {
    const course = courses.find((item) => item.id === grade.courseId);
    const item = course?.items.find((entry) => entry.order === grade.itemOrder);
    return {
      id: uid("grade"),
      courseId: grade.courseId,
      studentId: grade.studentId,
      itemId: item ? item.id : null,
      notes: grade.notes.map((note) => ({ id: uid("note"), label: note.label, score: Number(note.score) })),
      updatedBy: "teacher-demo",
      updatedAt: new Date().toISOString(),
    };
  }).filter((grade) => grade.itemId);

  return {
    version: 1,
    users,
    courses,
    grades,
  };
}

function currentUser() {
  return db.users.find((user) => user.id === session?.userId) || null;
}

function visibleCourses(user) {
  if (!user) return [];
  if (user.role === "admin") return db.courses;
  if (user.role === "teacher") return db.courses.filter((course) => course.teacherIds.includes(user.id));
  return db.courses.filter((course) => course.studentIds.includes(user.id));
}

function courseById(courseId) {
  return db.courses.find((course) => course.id === courseId) || null;
}

function itemById(course, itemId) {
  return course?.items.find((item) => item.id === itemId) || null;
}

function gradesFor(studentId, courseId) {
  return db.grades.filter((grade) => grade.studentId === studentId && grade.courseId === courseId);
}

function gradeFor(studentId, courseId, itemId) {
  return db.grades.find((grade) => grade.studentId === studentId && grade.courseId === courseId && grade.itemId === itemId) || null;
}

function gradeAverage(grade) {
  return average(grade?.notes?.map((note) => note.score) || []);
}

function courseSummary(course, studentId) {
  const items = course.items.map((item) => {
    const grade = gradeFor(studentId, course.id, item.id);
    return {
      ...item,
      grade,
      avg: gradeAverage(grade),
    };
  });

  const topicItems = items.filter((item) => item.kind === "topic" && item.avg !== null);
  const practiceItems = items.filter((item) => item.kind !== "topic" && item.avg !== null);
  const allItems = items.filter((item) => item.avg !== null);
  const topicAverage = average(topicItems.map((item) => item.avg));
  const practiceAverage = average(practiceItems.map((item) => item.avg));
  const finalAverage = average(allItems.map((item) => item.avg));

  return {
    items,
    topicAverage: round(topicAverage),
    practiceAverage: round(practiceAverage),
    finalAverage: round(finalAverage),
    gradedCount: allItems.length,
    totalCount: course.items.length,
  };
}

function studentSummary(user) {
  const courses = visibleCourses(user);
  const summaries = courses.map((course) => ({
    course,
    summary: courseSummary(course, user.id),
  }));
  return {
    courses,
    summaries,
    overall: round(average(summaries.map((entry) => entry.summary.finalAverage).filter((value) => value !== null))),
  };
}

function setView(view) {
  if (!confirmDiscardChanges()) return;
  ui.view = view;
  render();
}

function setCourse(courseId) {
  if (!confirmDiscardChanges()) return;
  ui.courseId = courseId;
  const course = courseById(courseId);
  if (course) {
    const defaultStudent = course.studentIds[0] || null;
    const defaultItem = course.items[0]?.id || null;
    ui.gradeStudentId = ui.gradeStudentId || defaultStudent;
    ui.gradeItemId = ui.gradeItemId || defaultItem;
  }
  render();
}

function logout() {
  if (!confirmDiscardChanges()) return;
  saveSession(null);
  resetUiState();
  toast("Sesión cerrada.");
  render();
}

function login(form) {
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const user = db.users.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password);
  if (!user) {
    toast("Credenciales inválidas. Usa las cuentas de prueba.");
    return;
  }
  saveSession({ userId: user.id });
  resetUiState({ courseId: visibleCourses(user)[0]?.id || null });
  toast(`Bienvenido, ${user.fullName}.`);
  render();
}

function saveUser(form) {
  const data = new FormData(form);
  const userId = String(data.get("userId") || "");
  const fullName = String(data.get("fullName") || "").trim();
  const username = String(data.get("username") || "").trim();
  const password = String(data.get("password") || "").trim();
  const role = String(data.get("role") || "student");
  const documentId = String(data.get("documentId") || "").trim();
  const email = String(data.get("email") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const courseIds = selectedCourseIds(form);

  if (!fullName || !username || !password) {
    toast("Completa nombre, usuario y contraseña.");
    return;
  }
  if (role === "student" && !documentId) {
    toast("El documento de identidad es obligatorio para estudiantes.");
    return;
  }
  if (db.users.some((user) => user.username.toLowerCase() === username.toLowerCase() && user.id !== userId)) {
    toast("Ese usuario ya existe.");
    return;
  }

  const nextUsers = userId
    ? db.users.map((user) => (user.id === userId ? { ...user, fullName, username, password, role, documentId, email, phone } : user))
    : [{ id: uid("user"), fullName, username, password, role, documentId, email, phone }, ...db.users];

  const finalUser = nextUsers.find((user) => user.id === (userId || nextUsers[0].id)) || null;
  const updatedCourses = syncUserCourseMembership(db.courses, finalUser?.id || userId || nextUsers[0].id, role, courseIds);

  saveDb({ ...db, users: nextUsers, courses: updatedCourses });
  applyUserCourseDefaults(finalUser?.id || userId || nextUsers[0].id, role, courseIds);
  ui.editUserId = null;
  markClean();
  toast(userId ? "Usuario actualizado." : "Usuario creado.");
  render();
}

function syncUserCourseMembership(courses, userId, role, courseIds) {
  return courses.map((course) => {
    const nextCourse = { ...course };
    nextCourse.studentIds = course.studentIds.filter((id) => id !== userId);
    nextCourse.teacherIds = course.teacherIds.filter((id) => id !== userId);
    if (role === "student" && courseIds.includes(course.id)) nextCourse.studentIds = [...nextCourse.studentIds, userId];
    if (role === "teacher" && courseIds.includes(course.id)) nextCourse.teacherIds = [...nextCourse.teacherIds, userId];
    return nextCourse;
  });
}

function applyUserCourseDefaults(userId, role, courseIds) {
  if (!userId) return;
  if (role === "student" || role === "teacher") {
    const assignForm = app.querySelector(role === "student" ? "[data-form='assign-student-course']" : "[data-form='assign-teacher-course']");
    if (assignForm) {
      assignForm.reset();
    }
  }
}

function saveCourse(form) {
  const data = new FormData(form);
  const courseId = String(data.get("courseId") || "");
  const name = String(data.get("name") || "").trim();
  const description = String(data.get("description") || "").trim();
  if (!name) {
    toast("Escribe un nombre de curso.");
    return;
  }
  const id = courseId || normalize(name);
  if (db.courses.some((course) => (course.id === id || course.name.toLowerCase() === name.toLowerCase()) && course.id !== courseId)) {
    toast("Ya existe un curso con ese nombre.");
    return;
  }

  const nextCourses = courseId
    ? db.courses.map((course) => (course.id === courseId ? { ...course, name, description } : course))
    : [{ id, name, description, teacherIds: [], studentIds: [], items: [] }, ...db.courses];

  saveDb({ ...db, courses: nextCourses });
  ui.courseId = id;
  ui.editCourseId = null;
  ui.view = "courses";
  markClean();
  toast(courseId ? "Curso actualizado." : "Curso creado.");
  render();
}

function saveCourseItems(form) {
  const data = new FormData(form);
  const courseId = String(data.get("courseId") || "");
  const course = courseById(courseId);
  if (!course) {
    toast("Selecciona un curso y escribe un título.");
    return;
  }

  const itemIds = data.getAll("itemId[]").map((value) => String(value || "")).filter(Boolean);
  const itemTitles = data.getAll("itemTitle[]").map((value) => String(value || "").trim());
  const itemKinds = data.getAll("itemKind[]").map((value) => String(value || "topic"));

  const nextItems = itemTitles
    .map((title, index) => ({
      id: itemIds[index] || `${course.id}-${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      title,
      kind: itemKinds[index] === "practice" ? "practice" : "topic",
    }))
    .filter((item) => item.title);

  const nextCourses = db.courses.map((entry) => (entry.id === course.id ? { ...entry, items: nextItems } : entry));
  saveDb({ ...db, courses: nextCourses });
  ui.courseId = course.id;
  markClean();
  toast("Temario actualizado.");
  render();
}

function assignCourse(form) {
  const data = new FormData(form);
  const courseId = String(data.get("courseId") || "");
  const userId = String(data.get("userId") || "");
  const role = String(data.get("assignRole") || "student");
  const course = courseById(courseId);
  const user = db.users.find((entry) => entry.id === userId);
  if (!course || !user) {
    toast("Selecciona usuario y curso.");
    return;
  }
  const nextCourses = db.courses.map((entry) => {
    if (entry.id !== course.id) return entry;
    const key = role === "teacher" ? "teacherIds" : "studentIds";
    if (entry[key].includes(user.id)) return entry;
    return { ...entry, [key]: [...entry[key], user.id] };
  });
  saveDb({ ...db, courses: nextCourses });
  markClean();
  toast(role === "teacher" ? "Docente asignado." : "Estudiante matriculado.");
  render();
}

function saveGrade(form) {
  const data = new FormData(form);
  const courseId = String(data.get("courseId") || "");
  const studentId = String(data.get("studentId") || "");
  const itemIds = data.getAll("itemId[]").map((value) => String(value || ""));
  const notesTexts = data.getAll("notesText[]").map((value) => String(value || "").trim());

  if (!courseId || !studentId) {
    toast("Completa curso y estudiante.");
    return;
  }

  const parsedRows = notesTexts.map((text, index) => ({
    itemId: itemIds[index],
    notes: parseGradeText(text),
  }));
  if (parsedRows.some((row) => row.notes === null)) {
    toast("Revisa las notas: usa valores entre 0 y 5 separados por coma.");
    return;
  }

  const nextGrades = db.grades.filter((grade) => !(grade.courseId === courseId && grade.studentId === studentId));
  parsedRows.forEach((row) => {
    if (!row.itemId) return;
    if (!row.notes.length) return;
    nextGrades.unshift({
      id: uid("grade"),
      courseId,
      studentId,
      itemId: row.itemId,
      notes: row.notes.map((score, index) => ({ id: uid("note"), label: `Calificación ${index + 1}`, score })),
      updatedBy: currentUser()?.id || null,
      updatedAt: new Date().toISOString(),
    });
  });

  saveDb({ ...db, grades: nextGrades });
  markClean();
  toast("Notas guardadas.");
  render();
}

function parseGradeText(text) {
  if (!text) return [];
  const values = text
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value));
  if (values.some((value) => Number.isNaN(value) || value < 0 || value > 5)) return null;
  return values;
}

function removeGradeNoteRow(button) {
  const row = button.closest("tr");
  const tbody = button.closest("tbody");
  if (!row || !tbody) return;
  if (tbody.querySelectorAll("tr").length <= 1) {
    toast("Debe quedar al menos una calificación.");
    return;
  }
  row.remove();
  renumberNoteRows(tbody);
}

function renumberNoteRows(tbody) {
  tbody.querySelectorAll("tr").forEach((row, index) => {
    const orderCell = row.querySelector("[data-note-order]");
    const labelInput = row.querySelector("input[name='noteLabel[]']");
    if (orderCell) orderCell.textContent = String(index + 1);
    if (labelInput) labelInput.value = `Calificación ${index + 1}`;
  });
}

function removeUser(userId) {
  if (userId === currentUser()?.id) {
    toast("No puedes eliminar tu propio usuario desde esta sesión.");
    return;
  }
  const nextUsers = db.users.filter((user) => user.id !== userId);
  const nextGrades = db.grades.filter((grade) => grade.studentId !== userId && grade.updatedBy !== userId);
  const nextCourses = db.courses.map((course) => ({
    ...course,
    teacherIds: course.teacherIds.filter((id) => id !== userId),
    studentIds: course.studentIds.filter((id) => id !== userId),
  }));
  saveDb({ ...db, users: nextUsers, grades: nextGrades, courses: nextCourses });
  toast("Usuario eliminado.");
  render();
}

function removeCourse(courseId) {
  const nextCourses = db.courses.filter((course) => course.id !== courseId);
  const nextGrades = db.grades.filter((grade) => grade.courseId !== courseId);
  saveDb({ ...db, courses: nextCourses, grades: nextGrades });
  ui.courseId = nextCourses[0]?.id || null;
  toast("Curso eliminado.");
  render();
}

function removeItem(courseId, itemId) {
  const nextCourses = db.courses.map((course) => {
    if (course.id !== courseId) return course;
    const items = course.items.filter((item) => item.id !== itemId).map((item, index) => ({ ...item, order: index + 1 }));
    return { ...course, items };
  });
  const nextGrades = db.grades.filter((grade) => grade.itemId !== itemId);
  saveDb({ ...db, courses: nextCourses, grades: nextGrades });
  toast("Tema o práctica eliminada.");
  render();
}

function resetDemo() {
  if (!confirmDiscardChanges()) return;
  if (!confirm("Esto restablece la base inicial y borra cambios locales. ¿Continuar?")) return;
  const seeded = buildInitialDb(window.SCHOOL_SEED);
  saveDb(seeded);
  saveSession(null);
  resetUiState();
  toast("Base inicial restaurada.");
  render();
}

function quickLogin(userId) {
  if (!confirmDiscardChanges()) return;
  saveSession({ userId });
  const user = db.users.find((entry) => entry.id === userId);
  resetUiState({ courseId: visibleCourses(user)[0]?.id || null });
  render();
}

function toast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  window.clearTimeout(node._timer);
  node._timer = window.setTimeout(() => node.remove(), 2600);
}

function loginView() {
  return `
    <main class="login">
      <div class="login__panel">
        <section class="login__hero">
          <div class="row" style="align-items: center;">
            <div class="brand-mark"><img src="logo.svg" alt="Logo Jessika Ruiz" /></div>
            <div>
              <div class="brand__kicker">${BRAND_NAME}</div>
              <h1 class="login__title">Sistema académico para cursos, matrículas y calificaciones</h1>
            </div>
          </div>
          <p class="login__copy">${BRAND_TAGLINE}</p>
          <div class="kpi-row">
            <div class="kpi"><strong>${db.courses.length}</strong><span>Cursos</span></div>
            <div class="kpi"><strong>${db.users.length}</strong><span>Usuarios</span></div>
            <div class="kpi"><strong>Responsive</strong><span>PC y móvil</span></div>
          </div>
        </section>
        <section class="login__form">
          <div class="brand">
            <div class="brand__kicker">Acceso académico</div>
            <div class="brand__title">Iniciar sesión</div>
            <div class="brand__subtitle">Ingresa con tu usuario para ver solo la información que te corresponde.</div>
          </div>
          <form class="form" data-login-form>
            <div class="field">
              <label>Usuario</label>
              <input name="username" autocomplete="username" placeholder="admin" required />
            </div>
            <div class="field">
              <label>Contraseña</label>
              <input name="password" type="password" autocomplete="current-password" placeholder="Admin123!" required />
            </div>
            <button class="btn btn--gold" type="submit">Entrar</button>
          </form>
          <div class="notice" style="margin-top: 16px;">
            Cuentas de prueba: <strong>admin / Admin123!</strong>, <strong>docente / Docente123!</strong>, <strong>estudiante / Estudiante123!</strong>
          </div>
        </section>
      </div>
    </main>
  `;
}

function shellView(user) {
  const visible = visibleCourses(user);
  const selectedCourse = courseById(ui.courseId) || visible[0] || null;
  if (!ui.courseId && selectedCourse) ui.courseId = selectedCourse.id;
  const navItems = [
    { id: "overview", label: "Resumen" },
    user.role === "admin" ? { id: "users", label: "Usuarios" } : null,
    user.role === "admin" || user.role === "teacher" ? { id: "courses", label: "Cursos" } : null,
    user.role === "teacher" || user.role === "admin" ? { id: "grades", label: "Calificaciones" } : null,
    user.role === "student" ? { id: "notes", label: "Mis notas" } : null,
  ].filter(Boolean);

  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark"><img src="logo.svg" alt="Logo Jessika Ruiz" /></div>
          <div class="brand__kicker">${BRAND_NAME}</div>
          <div class="brand__title">Panel académico</div>
          <div class="brand__subtitle">${user.fullName} · ${roleLabel(user.role)}</div>
        </div>
        <nav class="nav">
          ${navItems
            .map(
              (item) => `
                <button class="${ui.view === item.id ? "is-active" : ""}" data-view="${item.id}">${item.label}</button>
              `,
            )
            .join("")}
        </nav>
        <div class="sidebar__footer">
          <div class="pill">Rol: ${roleLabel(user.role)}</div>
          <div class="pill">Cursos visibles: ${visible.length}</div>
          <button class="btn btn--ghost" data-action="logout">Cerrar sesión</button>
          ${user.role === "admin" ? '<button class="btn btn--ghost" data-action="reset-demo">Restablecer datos</button>' : ""}
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1 class="topbar__title">${viewTitle(ui.view, user)}</h1>
            <div class="topbar__meta">${viewSubtitle(ui.view, user, selectedCourse, visible)}</div>
          </div>
          <div class="actions">
            <span class="badge">${visible.length} curso(s)</span>
            ${selectedCourse ? `<span class="badge badge--muted">${selectedCourse.name}</span>` : ""}
          </div>
        </header>
        ${renderView(user, selectedCourse, visible)}
      </main>
    </div>
  `;
}

function viewTitle(view, user) {
  if (view === "users") return "Usuarios";
  if (view === "courses") return "Cursos y temarios";
  if (view === "grades") return user.role === "admin" ? "Calificaciones" : "Registro de notas";
  if (view === "notes") return "Mis notas";
  return "Resumen general";
}

function viewSubtitle(view, user, course, visible) {
  if (view === "users") return "Crea y administra usuarios del sistema.";
  if (view === "courses") return "Agrega cursos, temas, brigadas y asignaciones.";
  if (view === "grades") return "Carga varias notas por práctica o por clase y guarda el promedio.";
  if (view === "notes") return "Consulta tus cursos, promedios y nota final calculada.";
  return `Vista filtrada según el rol. ${visible.length} cursos disponibles.`;
}

function renderView(user, selectedCourse, visible) {
  if (ui.view === "users" && user.role === "admin") return usersView();
  if (ui.view === "courses" && (user.role === "admin" || user.role === "teacher")) return coursesView(user, selectedCourse, visible);
  if (ui.view === "grades" && (user.role === "teacher" || user.role === "admin")) return gradesView(user, selectedCourse, visible);
  if (ui.view === "notes" && user.role === "student") return studentView(user, visible);
  return overviewView(user, selectedCourse, visible);
}

function overviewView(user, selectedCourse, visible) {
  const summaries = user.role === "student" ? studentSummary(user) : null;
  const visibleGrades = db.grades.filter((grade) => visible.some((course) => course.id === grade.courseId));
  const assignedStudents = visible.reduce((sum, course) => sum + course.studentIds.length, 0);
  const pendingItems = summaries
    ? summaries.summaries.reduce((sum, entry) => sum + (entry.summary.totalCount - entry.summary.gradedCount), 0)
    : 0;
  return `
    <section class="card card--soft">
      <div class="card__body">
        <div class="toolbar">
          <div>
            <div class="section-title">${roleLabel(user.role)}</div>
            <h2 class="card__title">${BRAND_NAME}</h2>
            <p class="card__subtitle">${BRAND_TAGLINE}</p>
          </div>
          <span class="badge">Cursos visibles: ${visible.length}</span>
          ${user.role === "student" ? `<span class="badge badge--muted">Promedio general ${formatScore(summaries?.overall)}</span>` : ""}
          ${user.role === "teacher" ? `<span class="badge badge--muted">Estudiantes matriculados ${assignedStudents}</span>` : ""}
          ${user.role === "admin" ? `<span class="badge badge--muted">Calificaciones ${visibleGrades.length}</span>` : ""}
        </div>
      </div>
    </section>
    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Cursos disponibles</h2>
          <p class="card__subtitle">Selecciona un curso para ver sus clases y promedios.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${visible.map((course) => `<button class="${selectedCourse?.id === course.id ? "is-active" : ""}" data-course="${course.id}">${course.name}</button>`).join("")}
        </div>
        ${selectedCourse ? courseSnapshot(selectedCourse, user) : '<p class="muted" style="margin-top: 16px;">No hay cursos asignados a este usuario.</p>'}
      </div>
    </section>
  `;
}

function courseSnapshot(course, user) {
  const summary = user.role === "student" ? courseSummary(course, user.id) : null;
  const teacherNames = course.teacherIds.map((id) => db.users.find((userEntry) => userEntry.id === id)?.fullName).filter(Boolean);
  return `
    <div class="grid" style="margin-top: 16px;">
      <div class="list__item">
        <div class="list__title">${course.name}</div>
        <div class="list__meta">${course.description || "Sin descripción."}</div>
      </div>
      <div class="split">
        <div class="list__item">
          <div class="list__title">Clases</div>
          <div class="list__meta">${course.items.length} temas/prácticas</div>
        </div>
        <div class="list__item">
          <div class="list__title">Docente asignado</div>
          <div class="list__meta">${teacherNames.join(", ") || "Sin asignar"}</div>
        </div>
      </div>
      ${summary ? `<div class="list__item"><div class="list__title">Promedio final</div><div class="list__meta">${formatScore(summary.finalAverage)} · Temas ${formatScore(summary.topicAverage)} · Prácticas ${formatScore(summary.practiceAverage)}</div></div>` : ""}
    </div>
  `;
}

function usersView() {
  const selectedUser = ui.editUserId ? db.users.find((user) => user.id === ui.editUserId) || null : null;
  const roleCourseMode = selectedUser?.role === "teacher" ? "asignar" : "matricular";
  return `
    <section class="grid grid--split">
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">${selectedUser ? "Editar usuario" : "Crear usuario"}</h2>
            <p class="card__subtitle">Documento, contacto y cursos vinculados al guardar.</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="save-user">
            <input type="hidden" name="userId" value="${selectedUser?.id || ""}" />
            <div class="field"><label>Nombre completo</label><input name="fullName" value="${escapeHtml(selectedUser?.fullName || "")}" required /></div>
            <div class="field"><label>Usuario</label><input name="username" value="${escapeHtml(selectedUser?.username || "")}" required /></div>
            <div class="field"><label>Contraseña</label><input name="password" type="text" value="${escapeHtml(selectedUser?.password || "")}" required /></div>
            <div class="field">
              <label>Rol</label>
              <select name="role">
                <option value="student" ${selectedUser?.role === "student" ? "selected" : ""}>Estudiante</option>
                <option value="teacher" ${selectedUser?.role === "teacher" ? "selected" : ""}>Docente</option>
                <option value="admin" ${selectedUser?.role === "admin" ? "selected" : ""}>Administrador</option>
              </select>
            </div>
            <div class="field"><label>Documento de identidad</label><input name="documentId" value="${escapeHtml(selectedUser?.documentId || "")}" placeholder="CC, TI, pasaporte..." /></div>
            <div class="split">
              <div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(selectedUser?.email || "")}" placeholder="opcional" /></div>
              <div class="field"><label>Teléfono</label><input name="phone" value="${escapeHtml(selectedUser?.phone || "")}" placeholder="opcional" /></div>
            </div>
            <div class="field">
              <label>Cursos ${selectedUser?.role === "teacher" ? "a asignar" : "a matricular"}</label>
              ${renderCourseChecklist(selectedUser ? visibleCourses(selectedUser).map((course) => course.id) : [], roleCourseMode)}
            </div>
            <div class="toolbar">
              <button class="btn btn--gold" type="submit">${selectedUser ? "Guardar cambios" : "Crear usuario"}</button>
              <button class="btn btn--ghost" type="button" data-clear-user-form>+ Nuevo</button>
            </div>
          </form>
        </div>
      </article>
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Accesos rápidos</h2>
            <p class="card__subtitle">Usuarios de prueba para entrar sin teclear.</p>
          </div>
        </div>
        <div class="card__body">
          <div class="list">
            ${db.users.map((user) => `
              <div class="list__item">
                <div class="row" style="justify-content: space-between;">
                  <div>
                    <div class="list__title">${user.fullName}</div>
                    <div class="list__meta">@${user.username} · ${roleLabel(user.role)}</div>
                  </div>
                  <button class="btn btn--ghost" type="button" data-action="quick-login" data-user-id="${user.id}">Entrar</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </article>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Administración en tabla</h2>
          <p class="card__subtitle">Edita por categoría y guarda cada bloque de una sola vez.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${[
            { id: "students", label: "Estudiantes" },
            { id: "teachers", label: "Docentes" },
            { id: "admins", label: "Administradores" },
            { id: "by-course", label: "Por curso" },
          ].map((tab) => `<button class="${ui.usersTab === tab.id ? "is-active" : ""}" data-user-tab="${tab.id}" type="button">${tab.label}</button>`).join("")}
        </div>
      </div>
    </section>

    ${ui.usersTab === "students" ? renderUsersBulkTable("student", "Estudiantes", "Nombre, documento, contacto y contraseña editables en bloque.") : ""}
    ${ui.usersTab === "teachers" ? renderUsersBulkTable("teacher", "Docentes", "Información base editable en una sola tabla.") : ""}
    ${ui.usersTab === "admins" ? renderUsersBulkTable("admin", "Administradores", "Acceso y datos base de los administradores.") : ""}
    ${ui.usersTab === "by-course" ? renderCourseRosterByCourse() : ""}
  `;
}

function coursesView(user, selectedCourse, visible) {
  const teachers = db.users.filter((item) => item.role === "teacher");
  const students = db.users.filter((item) => item.role === "student");
  const course = selectedCourse || visible[0] || db.courses[0] || null;
  const editingCourse = ui.editCourseId ? db.courses.find((item) => item.id === ui.editCourseId) || null : null;
  return `
    <section class="grid grid--split split--top">
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">${editingCourse ? "Editar curso" : "Crear curso"}</h2>
            <p class="card__subtitle">Cursos, temarios, matrículas y docentes.</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="save-course">
            <input type="hidden" name="courseId" value="${editingCourse?.id || ""}" />
            <div class="field"><label>Nombre del curso</label><input name="name" value="${escapeHtml(editingCourse?.name || "")}" required /></div>
            <div class="field"><label>Descripción</label><textarea name="description" placeholder="Breve descripción">${escapeHtml(editingCourse?.description || "")}</textarea></div>
            <div class="toolbar">
              <button class="btn btn--gold" type="submit">${editingCourse ? "Guardar curso" : "Crear curso"}</button>
              <button class="btn btn--ghost" type="button" data-clear-course-form>+ Nuevo</button>
            </div>
          </form>
        </div>
      </article>
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Matricular estudiantes</h2>
            <p class="card__subtitle">Selecciona con autocompletado y guarda la matrícula de una vez.</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="assign-course">
            <input type="hidden" name="assignRole" value="student" />
            ${autocompleteMarkup({ key: "enroll-course", label: "Curso", placeholder: "Escribe el nombre del curso", options: db.courses.map((item) => ({ id: item.id, label: item.name })), selectedId: course?.id || "", name: "course" })}
            ${autocompleteMarkup({ key: "enroll-student", label: "Estudiante", placeholder: "Escribe el nombre del estudiante", options: students.map((item) => ({ id: item.id, label: userLabel(item) })), selectedId: "", name: "user" })}
            <button class="btn btn--gold" type="submit">Matricular +</button>
          </form>
        </div>
      </article>
    </section>

    ${user.role === "admin" ? `
	    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Cursos registrados</h2>
          <p class="card__subtitle">Abrir, editar o eliminar cursos.</p>
        </div>
      </div>
      <div class="card__body">
        <table class="table table--tight">
          <thead>
            <tr>
              <th>Curso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${visible.map((entry) => `
              <tr>
                <td>
                  <div class="list__title">${entry.name}</div>
                  <div class="list__meta">${entry.items.length} clases · ${entry.studentIds.length} estudiantes</div>
                </td>
                <td>
                  <div class="row">
                    <button class="btn btn--ghost icon-btn" data-course="${entry.id}" type="button" aria-label="Abrir curso">↗</button>
                    <button class="btn btn--ghost icon-btn" data-edit-course="${entry.id}" type="button" aria-label="Editar curso">✎</button>
                    <button class="btn btn--ghost icon-btn" data-remove-course="${entry.id}" type="button" aria-label="Eliminar curso">−</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
      <section class="card" style="margin-top: 18px;">
        <div class="card__header">
          <div>
            <h2 class="card__title">Asignar docente</h2>
            <p class="card__subtitle">La matrícula de docentes queda separada de la matrícula de estudiantes.</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="assign-course">
            <input type="hidden" name="assignRole" value="teacher" />
            ${autocompleteMarkup({ key: "teacher-course", label: "Curso", placeholder: "Escribe el curso", options: db.courses.map((item) => ({ id: item.id, label: item.name })), selectedId: course?.id || "", name: "course" })}
            ${autocompleteMarkup({ key: "teacher-user", label: "Docente", placeholder: "Escribe el docente", options: teachers.map((item) => ({ id: item.id, label: userLabel(item) })), selectedId: "", name: "user" })}
            <button class="btn btn--gold" type="submit">Asignar docente +</button>
          </form>
        </div>
      </section>
    ` : ""}

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Temario editable</h2>
          <p class="card__subtitle">Edita clases y prácticas como tabla. Guarda todo de una sola vez.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${visible.map((entry) => `<button class="${course?.id === entry.id ? "is-active" : ""}" data-course="${entry.id}">${entry.name}</button>`).join("")}
        </div>
        ${course ? `
          <div class="grid" style="margin-top: 16px;">
            <div class="split">
              <div class="list__item">
                <div class="list__title">${course.name}</div>
                <div class="list__meta">${course.description || "Sin descripción."}</div>
              </div>
              <div class="list__item">
                <div class="list__title">Matrícula</div>
                <div class="list__meta">Estudiantes ${course.studentIds.length} · Docentes ${course.teacherIds.length}</div>
              </div>
            </div>
            <form class="form" data-form="save-course-items">
              <input type="hidden" name="courseId" value="${course.id}" />
              <table class="table table--tight table-editor">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Clase / tema</th>
                    <th>Tipo</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody data-course-item-rows>
                  ${course.items.length ? course.items.map((item, index) => `
                    <tr>
                      <td data-course-item-order>${index + 1}</td>
                      <td>
                        <input type="hidden" name="itemId[]" value="${item.id}" />
                        <input name="itemTitle[]" value="${escapeHtml(item.title)}" placeholder="Título de clase" />
                      </td>
                      <td>
                        <select name="itemKind[]">
                          <option value="topic" ${item.kind === "topic" ? "selected" : ""}>Clase / tema</option>
                          <option value="practice" ${item.kind === "practice" ? "selected" : ""}>Práctica / brigada</option>
                        </select>
                      </td>
                      <td><button class="btn btn--ghost icon-btn" type="button" data-remove-course-item-row aria-label="Eliminar fila">−</button></td>
                    </tr>
                  `).join("") : ""}
                </tbody>
              </table>
              <div class="toolbar">
                <button class="btn btn--ghost" type="button" data-add-course-item-row>+ Clase</button>
                <button class="btn btn--gold" type="submit">Guardar temario</button>
              </div>
            </form>
          </div>
        ` : `<p class="muted" style="margin-top: 16px;">No hay cursos creados.</p>`}
      </div>
    </section>


  `;
}

function gradesView(user, selectedCourse, visible) {
  const teacherCourses = visible;
  const course = selectedCourse || teacherCourses[0] || null;
  const studentOptions = course ? course.studentIds.map((id) => db.users.find((item) => item.id === id)).filter(Boolean) : [];
  const currentStudent = db.users.find((item) => item.id === ui.gradeStudentId) || studentOptions[0] || null;
  const studentGrades = currentStudent && course ? course.items.map((item) => ({ item, grade: gradeFor(currentStudent.id, course.id, item.id) })) : [];

  return `
    <section class="grid grid--split">
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Registro rápido de notas</h2>
            <p class="card__subtitle">Busca al estudiante, selecciona la clase y captura varias calificaciones en tabla.</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="save-grade">
            ${autocompleteMarkup({ key: "grade-course", label: "Curso", placeholder: "Escribe el curso", options: teacherCourses.map((entry) => ({ id: entry.id, label: entry.name })), selectedId: course?.id || "", name: "course" })}
            ${autocompleteMarkup({ key: "grade-student", label: "Estudiante", placeholder: "Escribe el estudiante", options: studentOptions.map((entry) => ({ id: entry.id, label: userLabel(entry) })), selectedId: currentStudent?.id || "", name: "student" })}
            <div class="field">
              <label>Temario evaluativo</label>
              <table class="table table--tight table-editor">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Clase</th>
                    <th>Tipo</th>
                    <th>Notas</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody data-note-rows>
                  ${course ? course.items.map((item, index) => {
                    const grade = currentStudent ? gradeFor(currentStudent.id, course.id, item.id) : null;
                    const notesText = grade?.notes?.map((note) => formatScore(note.score)).join(", ") || "";
                    const pending = !notesText;
                    return `
                      <tr class="${pending ? "table-editor__row--pending" : ""}">
                        <td data-note-order>${index + 1}</td>
                        <td>
                          <input type="hidden" name="itemId[]" value="${item.id}" />
                          ${String(item.order).padStart(2, "0")} · ${escapeHtml(item.title)}
                        </td>
                        <td>${item.kind === "practice" ? "Práctica / brigada" : "Tema / clase"}</td>
                        <td><input name="notesText[]" value="${escapeHtml(notesText)}" placeholder="4.5, 4.7" /></td>
                        <td>${formatScore(gradeAverage(grade))}</td>
                      </tr>
                    `;
                  }).join("") : `<tr><td colspan="5" class="muted">Selecciona un curso para ver su temario.</td></tr>`}
                </tbody>
              </table>
              <div class="helper" style="margin-top: 8px;">Escribe varias notas separadas por coma. Las filas vacías quedan marcadas en rojo.</div>
            </div>
            <button class="btn btn--gold" type="submit">Guardar notas</button>
          </form>
        </div>
      </article>
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Promedios</h2>
            <p class="card__subtitle">Promedio por clase, prácticas y nota final.</p>
          </div>
        </div>
        <div class="card__body">
          ${course && currentStudent ? teacherGradeSummary(course, currentStudent, studentGrades) : '<p class="muted">Selecciona un curso con estudiantes asignados.</p>'}
        </div>
      </article>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Cursos asignados</h2>
          <p class="card__subtitle">Cursos que el docente puede administrar.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${teacherCourses.map((entry) => `<button class="${course?.id === entry.id ? "is-active" : ""}" data-course="${entry.id}">${entry.name}</button>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function teacherGradeSummary(course, student, studentGrades) {
  const summary = courseSummary(course, student.id);
  return `
    <div class="list">
      <div class="list__item">
        <div class="list__title">${student.fullName}</div>
        <div class="list__meta">${course.name}</div>
      </div>
      <div class="split">
        <div class="list__item"><div class="list__title">Tema promedio</div><div class="list__meta">${formatScore(summary.topicAverage)}</div></div>
        <div class="list__item"><div class="list__title">Prácticas promedio</div><div class="list__meta">${formatScore(summary.practiceAverage)}</div></div>
      </div>
      <div class="list__item"><div class="list__title">Nota final</div><div class="list__meta">${formatScore(summary.finalAverage)}</div></div>
      <div class="list__item">
        <div class="list__title">Notas registradas</div>
        <div class="list__meta">${studentGrades.filter((entry) => entry.grade).length} de ${course.items.length} actividades evaluadas</div>
      </div>
      <table class="table table--tight">
        <thead><tr><th>Clase</th><th>Tipo</th><th>Promedio</th><th>Notas</th></tr></thead>
        <tbody>
          ${studentGrades
            .map(
              ({ item, grade }) => `
                <tr>
                  <td>${String(item.order).padStart(2, "0")} · ${item.title}</td>
                  <td>${item.kind === "practice" ? "Práctica" : "Tema"}</td>
                  <td>${formatScore(gradeAverage(grade))}</td>
                  <td>${grade ? grade.notes.map((note) => formatScore(note.score)).join(" · ") : "Sin notas"}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function noteRowsMarkup(course, student, item) {
  const existing = student && item ? gradeFor(student.id, course.id, item.id) : null;
  const notes = existing?.notes?.length ? existing.notes : [{ score: "" }, { score: "" }];
  return notes.map((note, index) => noteRowMarkup(note, index)).join("");
}

function studentView(user, visible) {
  const summaries = studentSummary(user);
  return `
    <section class="card card--soft">
      <div class="card__body">
        <div class="toolbar">
          <div>
            <div class="section-title">Estudiante</div>
            <h2 class="card__title">${user.fullName}</h2>
            <p class="card__subtitle">Consulta tus cursos, promedios y nota final.</p>
          </div>
          <span class="badge">Promedio general ${formatScore(summaries.overall)}</span>
          <span class="badge badge--muted">Cursos inscritos ${summaries.courses.length}</span>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Mis cursos</h2>
          <p class="card__subtitle">Promedios por curso y nota final.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="list">
          ${summaries.summaries.map(({ course, summary }) => `
            <div class="list__item">
              <div class="row" style="justify-content: space-between;">
                <div>
                  <div class="list__title">${course.name}</div>
                  <div class="list__meta">Temas ${formatScore(summary.topicAverage)} · Prácticas ${formatScore(summary.practiceAverage)} · Final ${formatScore(summary.finalAverage)}</div>
                </div>
                <span class="badge">${summary.gradedCount}/${summary.totalCount}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Detalle de notas</h2>
          <p class="card__subtitle">Cada práctica puede tener varias notas; aquí se promedian de forma automática.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${visible.map((course) => `<button class="${ui.courseId === course.id ? "is-active" : ""}" data-course="${course.id}">${course.name}</button>`).join("")}
        </div>
        ${visible.map((course) => `<div style="margin-top: 16px;">${studentCourseDetail(course, user)}</div>`).join("")}
      </div>
    </section>
  `;
}

function studentCourseDetail(course, user) {
  const summary = courseSummary(course, user.id);
  return `
    <div class="list">
      <div class="list__item">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="list__title">${course.name}</div>
            <div class="list__meta">${course.description || "Sin descripción."}</div>
          </div>
          <span class="badge">Nota final ${formatScore(summary.finalAverage)}</span>
        </div>
      </div>
      <table class="table table--tight">
        <thead><tr><th>Clase</th><th>Tipo</th><th>Promedio</th><th>Notas</th></tr></thead>
        <tbody>
          ${summary.items.map((item) => `
            <tr>
              <td>${String(item.order).padStart(2, "0")} · ${item.title}</td>
              <td>${item.kind === "practice" ? "Práctica / brigada" : "Tema / clase"}</td>
              <td>${formatScore(item.avg)}</td>
              <td>${item.grade ? item.grade.notes.map((note) => formatScore(note.score)).join(" · ") : "Sin notas"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function editUser(userId) {
  ui.editUserId = userId;
  ui.view = "users";
  render();
}

function editCourse(courseId) {
  ui.editCourseId = courseId;
  ui.courseId = courseId;
  ui.view = "courses";
  render();
}

function clearUserForm() {
  ui.editUserId = null;
  render();
}

function clearCourseForm() {
  ui.editCourseId = null;
  render();
}

function bulkUsersByRole(role) {
  return db.users.filter((user) => user.role === role);
}

function renderUserCourseSummary(user) {
  const assigned = db.courses.filter((course) => course.studentIds.includes(user.id) || course.teacherIds.includes(user.id));
  return assigned.length ? assigned.map((course) => course.name).join(" · ") : "Sin cursos";
}

function renderUsersBulkTable(role, title, subtitle) {
  const users = bulkUsersByRole(role);
  return `
    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">${title}</h2>
          <p class="card__subtitle">${subtitle}</p>
        </div>
      </div>
      <div class="card__body">
        <form class="form" data-form="bulk-users" data-user-role="${role}">
          <table class="table table--tight table-editor">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Contraseña</th>
                <th>Cursos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${users.map((user) => `
                <tr>
                  <td>
                    <input type="hidden" name="userId[]" value="${escapeHtml(user.id)}" />
                    <input name="fullName[]" value="${escapeHtml(user.fullName)}" required />
                  </td>
                  <td><input name="username[]" value="${escapeHtml(user.username)}" required /></td>
                  <td><input name="documentId[]" value="${escapeHtml(user.documentId || "")}" /></td>
                  <td><input name="email[]" type="email" value="${escapeHtml(user.email || "")}" /></td>
                  <td><input name="phone[]" value="${escapeHtml(user.phone || "")}" /></td>
                  <td><input name="password[]" type="text" value="${escapeHtml(user.password)}" required /></td>
                  <td><span class="badge badge--muted">${renderUserCourseSummary(user)}</span></td>
                  <td>
                    <div class="row">
                      <button class="btn btn--ghost icon-btn" type="button" data-remove-user="${user.id}" aria-label="Eliminar usuario">−</button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="toolbar" style="margin-top: 14px; justify-content: flex-end;">
            <button class="btn btn--gold" type="submit">Guardar ${title.toLowerCase()}</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderCourseRosterByCourse() {
  return `
    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Estudiantes por curso</h2>
          <p class="card__subtitle">Agrupación simple de estudiantes matriculados por curso.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="grid">
          ${db.courses.map((course) => {
            const students = course.studentIds.map((id) => db.users.find((user) => user.id === id)).filter(Boolean);
            return `
              <div class="list__item">
                <div class="row" style="justify-content: space-between;">
                  <div>
                    <div class="list__title">${course.name}</div>
                    <div class="list__meta">${students.length} estudiante(s) matriculado(s)</div>
                  </div>
                  <span class="badge badge--muted">${course.teacherIds.length} docente(s)</span>
                </div>
                <table class="table table--tight" style="margin-top: 12px;">
                  <thead><tr><th>Estudiante</th><th>Documento</th><th>Contacto</th></tr></thead>
                  <tbody>
                    ${students.map((student) => `
                      <tr>
                        <td>${student.fullName}</td>
                        <td>${student.documentId || "Sin documento"}</td>
                        <td>${[student.email, student.phone].filter(Boolean).join(" · ") || "Sin contacto"}</td>
                      </tr>
                    `).join("") || '<tr><td colspan="3" class="muted">Sin estudiantes matriculados.</td></tr>'}
                  </tbody>
                </table>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}

function saveBulkUsers(form) {
  const data = new FormData(form);
  const role = String(form.dataset.userRole || "student");
  const ids = data.getAll("userId[]").map((value) => String(value || ""));
  const fullNames = data.getAll("fullName[]").map((value) => String(value || "").trim());
  const usernames = data.getAll("username[]").map((value) => String(value || "").trim());
  const documentIds = data.getAll("documentId[]").map((value) => String(value || "").trim());
  const emails = data.getAll("email[]").map((value) => String(value || "").trim());
  const phones = data.getAll("phone[]").map((value) => String(value || "").trim());
  const passwords = data.getAll("password[]").map((value) => String(value || "").trim());

  const nextUsers = db.users.map((user) => {
    const index = ids.indexOf(user.id);
    if (index < 0 || user.role !== role) return user;
    if (!fullNames[index] || !usernames[index] || !passwords[index]) return user;
    if (role === "student" && !documentIds[index]) return user;
    return {
      ...user,
      fullName: fullNames[index],
      username: usernames[index],
      documentId: documentIds[index],
      email: emails[index],
      phone: phones[index],
      password: passwords[index],
    };
  });

  saveDb({ ...db, users: nextUsers });
  markClean();
  toast(`${titleCase(role)} actualizados.`);
  render();
}

function titleCase(text) {
  return String(text || "").charAt(0).toUpperCase() + String(text || "").slice(1);
}

function courseItemRowMarkup(item = {}, index = 0) {
  return `
    <tr>
      <td data-course-item-order>${index + 1}</td>
      <td>
        <input type="hidden" name="itemId[]" value="${escapeHtml(item.id || "")}" />
        <input name="itemTitle[]" value="${escapeHtml(item.title || "")}" placeholder="Título de clase" />
      </td>
      <td>
        <select name="itemKind[]">
          <option value="topic" ${item.kind !== "practice" ? "selected" : ""}>Clase / tema</option>
          <option value="practice" ${item.kind === "practice" ? "selected" : ""}>Práctica / brigada</option>
        </select>
      </td>
      <td><button class="btn btn--ghost icon-btn" type="button" data-remove-course-item-row aria-label="Eliminar fila">−</button></td>
    </tr>
  `;
}

function appendCourseItemRow() {
  const tbody = app.querySelector("[data-course-item-rows]");
  if (!tbody) return;
  const index = tbody.querySelectorAll("tr").length;
  const row = document.createElement("tr");
  row.innerHTML = courseItemRowMarkup({}, index).replace(/^<tr>|<\/tr>$/g, "");
  tbody.appendChild(row);
}

function addNoteRow(amount = 1) {
  const tbody = app.querySelector("[data-note-rows]");
  if (!tbody) return;
  const current = tbody.querySelectorAll("tr").length;
  for (let index = 0; index < amount; index += 1) {
    const row = document.createElement("tr");
    row.innerHTML = noteRowMarkup({}, current + index).replace(/^<tr>|<\/tr>$/g, "");
    tbody.appendChild(row);
  }
}

function renumberCourseItemRows(tbody) {
  tbody.querySelectorAll("tr").forEach((row, index) => {
    const orderCell = row.querySelector("[data-course-item-order]");
    if (orderCell) orderCell.textContent = String(index + 1);
  });
}

function roleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "teacher") return "Docente";
  return "Estudiante";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  app.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  app.querySelectorAll("[data-course]").forEach((button) => {
    button.addEventListener("click", () => setCourse(button.dataset.course));
  });

  app.querySelectorAll("[data-action='logout']").forEach((button) => button.addEventListener("click", logout));
  app.querySelectorAll("[data-action='reset-demo']").forEach((button) => button.addEventListener("click", resetDemo));
  app.querySelectorAll("[data-action='quick-login']").forEach((button) => {
    button.addEventListener("click", () => quickLogin(button.dataset.userId));
  });
  app.querySelectorAll("[data-clear-user-form]").forEach((button) => button.addEventListener("click", clearUserForm));
  app.querySelectorAll("[data-clear-course-form]").forEach((button) => button.addEventListener("click", clearCourseForm));
  app.querySelectorAll("[data-user-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!confirmDiscardChanges()) return;
      ui.usersTab = button.dataset.userTab;
      render();
    });
  });

  app.querySelectorAll("[data-remove-user]").forEach((button) => {
    button.addEventListener("click", () => removeUser(button.dataset.removeUser));
  });

  app.querySelectorAll("[data-edit-user]").forEach((button) => {
    button.addEventListener("click", () => editUser(button.dataset.editUser));
  });

  app.querySelectorAll("[data-remove-course]").forEach((button) => {
    button.addEventListener("click", () => removeCourse(button.dataset.removeCourse));
  });

  app.querySelectorAll("[data-edit-course]").forEach((button) => {
    button.addEventListener("click", () => editCourse(button.dataset.editCourse));
  });

  app.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const [courseId, itemId] = button.dataset.removeItem.split("|");
      removeItem(courseId, itemId);
    });
  });

  app.querySelectorAll("[data-remove-course-item-row]").forEach((button) => {
    button.addEventListener("click", () => {
      const tbody = button.closest("tbody");
      const row = button.closest("tr");
      if (!tbody || !row) return;
      if (tbody.querySelectorAll("tr").length <= 1) {
        toast("Debe quedar al menos una clase.");
        return;
      }
      row.remove();
      renumberCourseItemRows(tbody);
    });
  });

  app.querySelectorAll("[data-add-course-item-row]").forEach((button) => {
    button.addEventListener("click", () => appendCourseItemRow());
  });

  app.querySelectorAll("[data-login-form]").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    login(form);
  }));

  app.querySelectorAll("[data-form='save-user']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveUser(form);
  }));

  app.querySelectorAll("[data-form='save-course']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCourse(form);
  }));

  app.querySelectorAll("[data-form='save-course-items']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCourseItems(form);
  }));

  app.querySelectorAll("[data-form='assign-course']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    assignCourse(form);
  }));

  app.querySelectorAll("[data-form='save-grade']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveGrade(form);
  }));

  app.querySelectorAll("[data-form='bulk-users']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveBulkUsers(form);
  }));

  app.querySelectorAll("[data-autocomplete-key]").forEach((input) => {
    input.addEventListener("input", () => {
      syncAutocompleteField(input);
      setDirty();
    });
  });

  app.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => setDirty());
    field.addEventListener("change", () => setDirty());
  });
}

function render() {
  const user = currentUser();
  if (!user) {
    app.innerHTML = loginView();
  } else {
    app.innerHTML = shellView(user);
  }
  bindEvents();
}

render();
