const DB_KEY = "estetica-mooc-db-v1";
const SESSION_KEY = "estetica-mooc-session-v1";
const THEME_KEY = "estetica-mooc-theme-v1";
const app = document.getElementById("app");

let db;
let session;
let theme;
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
const COURSE_ICON_MAP = {
  "book-open": { label: "Libro", svg: '<path d="M12 7v13"/><path d="M3 18a1 1 0 0 1 1-1h5a3 3 0 0 1 3 3v-2a3 3 0 0 0-3-3H4a1 1 0 0 0-1 1z"/><path d="M21 18a1 1 0 0 0-1-1h-5a3 3 0 0 0-3 3v-2a3 3 0 0 1 3-3h5a1 1 0 0 1 1 1z"/>' },
  scissors: { label: "Corte", svg: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/>' },
  sparkles: { label: "Estrella", svg: '<path d="M9 12 7.5 9 4 7.5 7.5 6 9 3l1.5 3L14 7.5 10.5 9z"/><path d="m14 4 1.5 3L19 8.5 15.5 10 14 13l-1.5-3L9 8.5 12.5 7z"/>' },
  "flask-conical": { label: "Laboratorio", svg: '<path d="M10 2v4.15a2 2 0 0 1-.41 1.21L5.6 12.77A4 4 0 0 0 8.77 19h6.46a4 4 0 0 0 3.17-6.23l-3.99-5.41A2 2 0 0 1 14 6.15V2"/><path d="M7 14h10"/>' },
  palette: { label: "Maquillaje", svg: '<path d="M12 2a10 10 0 1 0 10 10c0-1.1-.9-2-2-2h-2.5a1.5 1.5 0 0 1 0-3H18a3 3 0 0 0 0-6z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>' },
  "graduation-cap": { label: "Academia", svg: '<path d="m2 8 10 5 10-5-10-5-10 5z"/><path d="M6 10.5V15a6 6 0 0 0 12 0v-4.5"/>' },
  image: { label: "Imagen", svg: '<rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5-5 5"/>' },
  camera: { label: "Cámara", svg: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-1.5-3Z"/><circle cx="12" cy="13" r="3"/>' },
  award: { label: "Logro", svg: '<circle cx="12" cy="8" r="5"/><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"/>' },
  "clipboard-list": { label: "Lista", svg: '<rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 7h4"/><path d="M9 11h4"/><path d="M9 15h4"/>' },
  users: { label: "Usuarios", svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  "layout-dashboard": { label: "Inicio", svg: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>' },
  "log-out": { label: "Salir", svg: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>' },
  "moon-star": { label: "Oscuro", svg: '<path d="M12 3a6 6 0 0 0 0 12 7 7 0 0 1 7-7 9 9 0 1 1-7-5Z"/><path d="m19 3 1.5 3L24 7.5 20.5 9 19 12l-1.5-3L14 7.5 17.5 6z"/>' },
  sun: { label: "Claro", svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
};
const COURSE_ICON_NAMES = Object.keys(COURSE_ICON_MAP);
const COURSE_ICON_ALIASES = {
  "📘": "book-open",
  "📗": "book-open",
  "📕": "book-open",
  "🧪": "flask-conical",
  "✂️": "scissors",
  "💄": "palette",
  "🪞": "image",
  "🧴": "award",
  "⭐": "sparkles",
  "🎓": "graduation-cap",
};

db = loadDb();
session = loadSession();
theme = loadTheme();

function defaultCourseIcon(courseId, name = "") {
  const source = `${courseId || ""}${name || ""}`;
  const index = Math.abs(Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0)) % COURSE_ICON_NAMES.length;
  return COURSE_ICON_NAMES[index];
}

function normalizeCourseIcon(value, courseId = "", name = "") {
  const normalized = COURSE_ICON_ALIASES[value] || value;
  return COURSE_ICON_NAMES.includes(normalized) ? normalized : defaultCourseIcon(courseId, name);
}

function lucideIcon(name, size = 18, title = "") {
  const entry = COURSE_ICON_MAP[name] || COURSE_ICON_MAP["book-open"];
  const label = title || entry.label;
  return `
    <svg class="lucide-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" role="img">
      <title>${escapeHtml(label)}</title>
      ${entry.svg}
    </svg>
  `;
}

function safePhotoValue(value) {
  return typeof value === "string" && value.startsWith("data:image/") ? value : "";
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function loadTheme() {
  const stored = safeParse(localStorage.getItem(THEME_KEY));
  return stored === "dark" ? "dark" : "light";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function saveTheme(nextTheme) {
  theme = nextTheme === "dark" ? "dark" : "light";
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  } catch (error) {
    console.warn("No se pudo guardar el tema.", error);
  }
  applyTheme();
}

function toggleTheme() {
  saveTheme(theme === "dark" ? "light" : "dark");
  render();
}

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
  const labelHtml = label ? `<label>${label}</label>` : "";
  return `
    <div class="field autocomplete-field">
      ${labelHtml}
      <input type="text" name="${name}Label" value="${escapeHtml(selected ? selected.label : "")}" placeholder="${escapeHtml(placeholder)}" list="${listId}" data-autocomplete-key="${key}" autocomplete="off" />
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
  if (!hidden) return null;
  const options = getAutocompleteOptions(key);
  const match = resolveByText(options, input.value);
  hidden.value = match?.id || "";
  return match;
}

function getAutocompleteOptions(key) {
  if (key === "enroll-course" || key === "teacher-course" || key === "grade-course" || key === "user-linked-course") {
    return db.courses.map((course) => ({ id: course.id, label: course.name }));
  }
  if (key === "enroll-student") {
    return db.users.filter((user) => user.role === "student").map((user) => ({ id: user.id, label: userLabel(user) }));
  }
  if (key === "teacher-user") {
    return db.users.filter((user) => user.role === "teacher").map((user) => ({ id: user.id, label: userLabel(user) }));
  }
  if (key === "grade-student") {
    const course = courseById(ui.courseId);
    if (course) {
      return course.studentIds
        .map((id) => db.users.find((user) => user.id === id))
        .filter(Boolean)
        .map((user) => ({ id: user.id, label: userLabel(user) }));
    }
    return db.users.filter((user) => user.role === "student").map((user) => ({ id: user.id, label: userLabel(user) }));
  }
  if (key === "grade-item") {
    const course = courseById(ui.courseId) || db.courses[0] || null;
    return (course?.items || []).map((item) => ({ id: item.id, label: `${String(item.order).padStart(2, "0")} · ${item.title}` }));
  }
  return [];
}

function handleAutocompleteCommit(key, id) {
  if (!id) return;
  if (key === "grade-course") {
    if (ui.courseId === id) return;
    ui.courseId = id;
    const course = courseById(id);
    const stillValid = course?.studentIds.includes(ui.gradeStudentId);
    ui.gradeStudentId = stillValid ? ui.gradeStudentId : course?.studentIds[0] || null;
    ui.gradeItemId = course?.items[0]?.id || null;
    markClean();
    render();
    return;
  }
  if (key === "grade-student") {
    if (ui.gradeStudentId === id) return;
    ui.gradeStudentId = id;
    markClean();
    render();
  }
}

function bindAutocompleteInput(input) {
  const key = input.dataset.autocompleteKey;

  input.addEventListener("focus", () => {
    input.dataset.restoreLabel = input.value;
    // Vaciar el valor al abrir para que el datalist muestre todas las opciones
    input.value = "";
  });

  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      const options = getAutocompleteOptions(key);
      const match = resolveByText(options, input.value);
      const hidden = app.querySelector(`[data-autocomplete-value="${key}"]`);
      if (match) {
        input.value = match.label;
        if (hidden) hidden.value = match.id;
        handleAutocompleteCommit(key, match.id);
        return;
      }
      const restore = input.dataset.restoreLabel || "";
      const prev = resolveByText(options, restore);
      if (prev) {
        input.value = prev.label;
        if (hidden) hidden.value = prev.id;
      } else if (hidden?.value) {
        const byId = options.find((option) => option.id === hidden.value);
        input.value = byId ? byId.label : restore;
      } else {
        input.value = restore;
      }
    }, 150);
  });

  input.addEventListener("change", () => {
    const match = syncAutocompleteField(input);
    if (match) {
      input.value = match.label;
      handleAutocompleteCommit(key, match.id);
    }
    setDirty();
  });

  input.addEventListener("input", () => {
    syncAutocompleteField(input);
    setDirty();
  });
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
      <td><input name="noteScore[]" type="number" min="0" max="5" step="0.1" value="${escapeHtml(note.score ?? "")}" aria-label="Nota ${index + 1}" /></td>
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

function normalizeDb(raw) {
  if (!raw || typeof raw !== "object") return null;
  const users = Array.isArray(raw.users) ? raw.users : null;
  const courses = Array.isArray(raw.courses) ? raw.courses : null;
  const grades = Array.isArray(raw.grades) ? raw.grades : [];
  if (!users || !courses) return null;
  return {
    version: Number(raw.version) || 1,
    users: users.map((user) => ({
      ...user,
      documentId: user.documentId || "",
      email: user.email || "",
      phone: user.phone || "",
      photo: safePhotoValue(user.photo),
      birthDate: user.birthDate || "",
      address: user.address || "",
      guardianName: user.guardianName || "",
      emergencyContact: user.emergencyContact || "",
      emergencyPhone: user.emergencyPhone || "",
      healthInfo: user.healthInfo || "",
    })),
    courses: courses.map((course) => ({
      ...course,
      icon: normalizeCourseIcon(course.icon, course.id, course.name),
      teacherIds: Array.isArray(course.teacherIds) ? course.teacherIds : [],
      studentIds: Array.isArray(course.studentIds) ? course.studentIds : [],
      items: Array.isArray(course.items) ? course.items : [],
    })),
    grades: grades.filter((grade) => grade && grade.courseId && grade.studentId && grade.itemId),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function loadDb() {
  const stored = normalizeDb(safeParse(localStorage.getItem(DB_KEY)));
  if (stored) return stored;
  const seeded = buildInitialDb(window.SCHOOL_SEED);
  localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveDb(nextDb) {
  const normalized = normalizeDb({ ...nextDb, updatedAt: new Date().toISOString() }) || nextDb;
  db = normalized;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    toast("No se pudo guardar en el navegador (almacenamiento lleno o bloqueado).");
    console.error(error);
  }
}

function persistDb() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error(error);
  }
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportDbJson() {
  const payload = {
    ...db,
    exportedAt: new Date().toISOString(),
    brand: BRAND_NAME,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadBlob(`jessika-ruiz-academia-backup-${stamp}.json`, blob);
  toast("Copia de seguridad JSON descargada.");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function rowsToCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => lines.push(row.map(csvEscape).join(",")));
  return lines.join("\n");
}

function rowsToExcelHtml(title, headers, rows) {
  const tableRows = rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value ?? "")}</td>`).join("")}</tr>`).join("");
  return `
    <h2>${escapeHtml(title)}</h2>
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
}

function exportDbExcel() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>JESSIKA RUIZ ACADEMIA - Exportación Excel</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; }
          h2 { margin: 24px 0 8px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
          th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f3d1df; }
        </style>
      </head>
      <body>
        ${rowsToExcelHtml("Usuarios", ["id", "fullName", "username", "role", "documentId", "email", "phone", "birthDate", "address", "guardianName", "emergencyContact", "emergencyPhone", "healthInfo", "photo", "password"], db.users.map((user) => [user.id, user.fullName, user.username, user.role, user.documentId || "", user.email || "", user.phone || "", user.birthDate || "", user.address || "", user.guardianName || "", user.emergencyContact || "", user.emergencyPhone || "", user.healthInfo || "", user.photo || "", user.password || ""]))}
        ${rowsToExcelHtml("Cursos", ["id", "name", "icon", "description", "teacherIds", "studentIds", "itemsCount"], db.courses.map((course) => [course.id, course.name, course.icon || "", course.description || "", (course.teacherIds || []).join("|"), (course.studentIds || []).join("|"), (course.items || []).length]))}
        ${rowsToExcelHtml("Temario", ["courseId", "courseName", "itemId", "order", "title", "kind"], db.courses.flatMap((course) => (course.items || []).map((item) => [course.id, course.name, item.id, item.order, item.title, item.kind])))}
        ${rowsToExcelHtml("Calificaciones", ["id", "courseId", "studentId", "itemId", "average", "updatedBy", "updatedAt"], db.grades.map((grade) => [grade.id, grade.courseId, grade.studentId, grade.itemId, gradeAverage(grade), grade.updatedBy || "", grade.updatedAt || ""]))}
        ${rowsToExcelHtml("Matrículas", ["courseId", "courseName", "userId", "fullName", "role"], db.courses.flatMap((course) => (course.studentIds || []).map((userId) => {
          const user = db.users.find((entry) => entry.id === userId);
          return [course.id, course.name, userId, user?.fullName || "", user?.role || "student"];
        })))}
      </body>
    </html>
  `;
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(`jessika-ruiz-academia-export-${stamp}.xls`, blob);
  toast("Archivo Excel descargado.");
}

function exportDbCsv() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const usersCsv = rowsToCsv(
    ["id", "fullName", "username", "role", "documentId", "email", "phone", "birthDate", "address", "guardianName", "emergencyContact", "emergencyPhone", "healthInfo", "photo", "password"],
    db.users.map((user) => [
      user.id,
      user.fullName,
      user.username,
      user.role,
      user.documentId || "",
      user.email || "",
      user.phone || "",
      user.birthDate || "",
      user.address || "",
      user.guardianName || "",
      user.emergencyContact || "",
      user.emergencyPhone || "",
      user.healthInfo || "",
      user.photo || "",
      user.password || "",
    ]),
  );

  const coursesCsv = rowsToCsv(
    ["id", "name", "icon", "description", "teacherIds", "studentIds", "itemsCount"],
    db.courses.map((course) => [
      course.id,
      course.name,
      course.icon || "",
      course.description || "",
      (course.teacherIds || []).join("|"),
      (course.studentIds || []).join("|"),
      (course.items || []).length,
    ]),
  );

  const itemsCsv = rowsToCsv(
    ["courseId", "courseName", "itemId", "order", "title", "kind"],
    db.courses.flatMap((course) =>
      (course.items || []).map((item) => [course.id, course.name, item.id, item.order, item.title, item.kind]),
    ),
  );

  const gradesCsv = rowsToCsv(
    ["id", "courseId", "courseName", "studentId", "studentName", "itemId", "itemTitle", "notes", "average", "updatedBy", "updatedAt"],
    db.grades.map((grade) => {
      const course = courseById(grade.courseId);
      const student = db.users.find((user) => user.id === grade.studentId);
      const item = course ? itemById(course, grade.itemId) : null;
      const avg = gradeAverage(grade);
      return [
        grade.id,
        grade.courseId,
        course?.name || "",
        grade.studentId,
        student?.fullName || "",
        grade.itemId,
        item?.title || "",
        (grade.notes || []).map((note) => note.score).join("|"),
        avg === null ? "" : formatScore(avg),
        grade.updatedBy || "",
        grade.updatedAt || "",
      ];
    }),
  );

  const enrollmentsCsv = rowsToCsv(
    ["courseId", "courseName", "userId", "fullName", "role", "membership"],
    db.courses.flatMap((course) => {
      const students = (course.studentIds || []).map((id) => {
        const user = db.users.find((entry) => entry.id === id);
        return [course.id, course.name, id, user?.fullName || "", user?.role || "student", "student"];
      });
      const teachers = (course.teacherIds || []).map((id) => {
        const user = db.users.find((entry) => entry.id === id);
        return [course.id, course.name, id, user?.fullName || "", user?.role || "teacher", "teacher"];
      });
      return [...students, ...teachers];
    }),
  );

  // Empaquetar varias hojas como un ZIP no es viable sin librería; se descargan archivos CSV separados.
  downloadBlob(`usuarios-${stamp}.csv`, new Blob(["\uFEFF" + usersCsv], { type: "text/csv;charset=utf-8" }));
  downloadBlob(`cursos-${stamp}.csv`, new Blob(["\uFEFF" + coursesCsv], { type: "text/csv;charset=utf-8" }));
  downloadBlob(`temario-${stamp}.csv`, new Blob(["\uFEFF" + itemsCsv], { type: "text/csv;charset=utf-8" }));
  downloadBlob(`calificaciones-${stamp}.csv`, new Blob(["\uFEFF" + gradesCsv], { type: "text/csv;charset=utf-8" }));
  downloadBlob(`matriculas-${stamp}.csv`, new Blob(["\uFEFF" + enrollmentsCsv], { type: "text/csv;charset=utf-8" }));
  toast("Archivos CSV descargados (usuarios, cursos, temario, calificaciones, matrículas).");
}

function importDbJson(file) {
  if (!confirmDiscardChanges()) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = safeParse(String(reader.result || ""));
      const normalized = normalizeDb(parsed);
      if (!normalized) {
        toast("El archivo JSON no tiene la estructura esperada (users, courses).");
        return;
      }
      if (!confirm(`Importar respaldo con ${normalized.users.length} usuarios, ${normalized.courses.length} cursos y ${normalized.grades.length} calificaciones?`)) return;
      saveDb(normalized);
      saveSession(null);
      resetUiState();
      toast("Base de datos importada. Inicia sesión de nuevo.");
      render();
    } catch (error) {
      toast("No se pudo leer el archivo JSON.");
      console.error(error);
    }
  };
  reader.readAsText(file);
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
  const users = seed.users.map((user) => ({
    ...user,
    documentId: user.documentId || "",
    email: user.email || "",
    phone: user.phone || "",
    photo: safePhotoValue(user.photo),
    birthDate: user.birthDate || "",
    address: user.address || "",
    guardianName: user.guardianName || "",
    emergencyContact: user.emergencyContact || "",
    emergencyPhone: user.emergencyPhone || "",
    healthInfo: user.healthInfo || "",
  }));
  const courses = seed.courses.map((course) => ({
    id: course.id,
    name: course.name,
    description: course.description,
    icon: normalizeCourseIcon(course.icon, course.id, course.name),
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
    const stillValid = course.studentIds.includes(ui.gradeStudentId);
    ui.gradeStudentId = stillValid ? ui.gradeStudentId : course.studentIds[0] || null;
    ui.gradeItemId = course.items[0]?.id || null;
  } else {
    ui.gradeStudentId = null;
    ui.gradeItemId = null;
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

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatDocumentId(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  // Formato colombiano con puntos de miles: 1.234.567
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function credentialsFromDocument(raw) {
  const digits = digitsOnly(raw);
  return {
    digits,
    formatted: formatDocumentId(digits),
    username: digits,
    password: digits,
  };
}

function bindDocumentIdField(input) {
  if (!input) return;
  const form = input.closest("form");
  const usernameInput = form?.querySelector('[name="username"]');
  const passwordInput = form?.querySelector('[name="password"]');
  const isCreate = !form?.querySelector('[name="userId"]')?.value;

  const syncCredentials = () => {
    const creds = credentialsFromDocument(input.value);
    input.value = creds.formatted;
    if (!isCreate) return;
    // Solo autocompleta usuario/clave al crear, si están vacíos o aún coinciden con el documento anterior
    const prevDigits = input.dataset.prevDigits || "";
    if (usernameInput && (!usernameInput.value || usernameInput.value === prevDigits)) {
      usernameInput.value = creds.username;
    }
    if (passwordInput && (!passwordInput.value || passwordInput.value === prevDigits)) {
      passwordInput.value = creds.password;
    }
    input.dataset.prevDigits = creds.digits;
  };

  input.addEventListener("blur", () => {
    syncCredentials();
    setDirty();
  });
  input.addEventListener("input", () => {
    // Mientras escribe: permitir dígitos; al blur se formatea
    setDirty();
  });
  input.addEventListener("change", syncCredentials);
}

async function updatePhotoField(form, value) {
  const hidden = form?.querySelector("[data-photo-data]");
  const preview = form?.querySelector("[data-photo-preview]");
  if (!hidden) return;
  hidden.value = safePhotoValue(value);
  if (preview) {
    preview.innerHTML = hidden.value
      ? `<img src="${escapeAttr(hidden.value)}" alt="Foto del estudiante" />`
      : '<span class="muted">Sin foto</span>';
  }
}

function bindPhotoField(form) {
  if (!form) return;
  const fileInput = form.querySelector("[data-photo-file]");
  const hidden = form.querySelector("[data-photo-data]");
  const preview = form.querySelector("[data-photo-preview]");
  const video = form.querySelector("[data-photo-camera]");
  const startButton = form.querySelector("[data-photo-camera-start]");
  const captureButton = form.querySelector("[data-photo-camera-capture]");
  const stopButton = form.querySelector("[data-photo-camera-stop]");
  let stream = null;

  if (hidden && preview) {
    preview.innerHTML = hidden.value
      ? `<img src="${escapeAttr(hidden.value)}" alt="Foto del estudiante" />`
      : '<span class="muted">Sin foto</span>';
  }

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    await updatePhotoField(form, dataUrl);
    setDirty();
  });

  startButton?.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (video) {
        video.hidden = false;
        video.srcObject = stream;
      }
    } catch (error) {
      toast("No se pudo activar la cámara.");
      console.error(error);
    }
  });

  captureButton?.addEventListener("click", async () => {
    if (!video || !stream) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    await updatePhotoField(form, canvas.toDataURL("image/png"));
    setDirty();
  });

  stopButton?.addEventListener("click", () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) {
      video.srcObject = null;
      video.hidden = true;
    }
  });
}

function saveUser(form) {
  const data = new FormData(form);
  const userId = String(data.get("userId") || "");
  const fullName = String(data.get("fullName") || "").trim();
  const role = String(data.get("role") || "student");
  const documentId = formatDocumentId(data.get("documentId") || "");
  const bareDoc = digitsOnly(documentId);
  let username = String(data.get("username") || "").trim();
  let password = String(data.get("password") || "").trim();
  const email = String(data.get("email") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const birthDate = String(data.get("birthDate") || "").trim();
  const address = String(data.get("address") || "").trim();
  const guardianName = String(data.get("guardianName") || "").trim();
  const emergencyContact = String(data.get("emergencyContact") || "").trim();
  const emergencyPhone = String(data.get("emergencyPhone") || "").trim();
  const healthInfo = String(data.get("healthInfo") || "").trim();
  const photoData = safePhotoValue(String(data.get("photoData") || ""));
  const linkedCourseId = String(data.get("linkedCourseId") || "").trim();

  // Por defecto usuario y contraseña = documento sin separadores
  if (!username && bareDoc) username = bareDoc;
  if (!password && bareDoc) password = bareDoc;

  if (!role || !["student", "teacher", "admin"].includes(role)) {
    toast("Selecciona un rol válido.");
    return;
  }
  if (role === "student" && !bareDoc) {
    toast("El documento de identidad es obligatorio para estudiantes.");
    return;
  }
  if (!fullName || !username || !password) {
    toast("Completa documento, nombre, usuario y contraseña.");
    return;
  }
  if (password.length < 4) {
    toast("La contraseña debe tener al menos 4 caracteres.");
    return;
  }
  if ((role === "student" || role === "teacher") && !linkedCourseId && !userId) {
    toast(role === "student" ? "Selecciona el curso a matricular." : "Selecciona el curso a asignar al docente.");
    return;
  }
  if (linkedCourseId && !courseById(linkedCourseId)) {
    toast("El curso seleccionado no existe.");
    return;
  }
  if (db.users.some((user) => user.username.toLowerCase() === username.toLowerCase() && user.id !== userId)) {
    toast("Ese nombre de usuario ya existe.");
    return;
  }
  if (bareDoc && db.users.some((user) => digitsOnly(user.documentId) === bareDoc && user.id !== userId)) {
    toast("Ya existe un usuario con ese documento de identidad.");
    return;
  }

  const nextUsers = userId
    ? db.users.map((user) => (user.id === userId ? { ...user, fullName, username, password, role, documentId, email, phone, birthDate, address, guardianName, emergencyContact, emergencyPhone, healthInfo, photo: photoData || user.photo || "" } : user))
    : [{ id: uid("user"), fullName, username, password, role, documentId, email, phone, birthDate, address, guardianName, emergencyContact, emergencyPhone, healthInfo, photo: photoData }, ...db.users];

  const finalUser = nextUsers.find((user) => user.id === (userId || nextUsers[0].id)) || null;
  const courseIds = linkedCourseId ? [linkedCourseId] : [];
  const updatedCourses = userId && !linkedCourseId
    ? syncUserCourseMembershipKeep(db.courses, finalUser.id, role)
    : syncUserCourseMembership(db.courses, finalUser.id, role, courseIds);

  saveDb({ ...db, users: nextUsers, courses: updatedCourses });
  ui.editUserId = null;
  markClean();
  toast(userId ? "Usuario actualizado." : "Usuario creado.");
  render();
}

function syncUserCourseMembershipKeep(courses, userId, role) {
  return courses.map((course) => {
    const nextCourse = { ...course };
    // Si cambió de rol, limpiar membresía incompatible
    if (role === "admin") {
      nextCourse.studentIds = course.studentIds.filter((id) => id !== userId);
      nextCourse.teacherIds = course.teacherIds.filter((id) => id !== userId);
    } else if (role === "student") {
      nextCourse.teacherIds = course.teacherIds.filter((id) => id !== userId);
    } else if (role === "teacher") {
      nextCourse.studentIds = course.studentIds.filter((id) => id !== userId);
    }
    return nextCourse;
  });
}

function syncUserCourseMembership(courses, userId, role, courseIds) {
  return courses.map((course) => {
    const nextCourse = { ...course };
    nextCourse.studentIds = course.studentIds.filter((id) => id !== userId);
    nextCourse.teacherIds = course.teacherIds.filter((id) => id !== userId);
    if (role === "student" && courseIds.includes(course.id)) {
      nextCourse.studentIds = [...nextCourse.studentIds, userId];
    }
    if (role === "teacher" && courseIds.includes(course.id)) {
      // Un solo docente por curso
      nextCourse.teacherIds = [userId];
    }
    return nextCourse;
  });
}

function changeOwnPassword(form) {
  const data = new FormData(form);
  const currentPassword = String(data.get("currentPassword") || "").trim();
  const newPassword = String(data.get("newPassword") || "").trim();
  const confirmPassword = String(data.get("confirmPassword") || "").trim();
  const user = currentUser();
  if (!user) return;
  if (user.password !== currentPassword) {
    toast("La contraseña actual no es correcta.");
    return;
  }
  if (newPassword.length < 6) {
    toast("La nueva contraseña debe tener al menos 6 caracteres.");
    return;
  }
  if (newPassword !== confirmPassword) {
    toast("La confirmación no coincide.");
    return;
  }
  const nextUsers = db.users.map((entry) => (entry.id === user.id ? { ...entry, password: newPassword } : entry));
  saveDb({ ...db, users: nextUsers });
  markClean();
  toast("Contraseña actualizada.");
  render();
}

function saveCourse(form) {
  const data = new FormData(form);
  const courseId = String(data.get("courseId") || "");
  const icon = normalizeCourseIcon(String(data.get("icon") || ""), courseId, String(data.get("name") || ""));
  const name = String(data.get("name") || "").trim();
  const description = String(data.get("description") || "").trim();
  const teacherId = String(data.get("teacherId") || "").trim();
  if (!name) {
    toast("Escribe un nombre de curso.");
    return;
  }
  if (teacherId) {
    const teacher = db.users.find((user) => user.id === teacherId);
    if (!teacher || teacher.role !== "teacher") {
      toast("Selecciona un docente válido.");
      return;
    }
  }
  const id = courseId || normalize(name);
  if (db.courses.some((course) => (course.id === id || course.name.toLowerCase() === name.toLowerCase()) && course.id !== courseId)) {
    toast("Ya existe un curso con ese nombre.");
    return;
  }

  const teacherIds = teacherId ? [teacherId] : [];
  const nextCourses = courseId
    ? db.courses.map((course) => {
        if (course.id !== courseId) return course;
        return {
          ...course,
          name,
          description,
          icon,
          teacherIds,
        };
      })
    : [{ id, name, description, icon, teacherIds, studentIds: [], items: [] }, ...db.courses];

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
  if (role === "teacher" && user.role !== "teacher" && user.role !== "admin") {
    toast("Solo se puede asignar un usuario con rol docente.");
    return;
  }
  if (role === "student" && user.role !== "student") {
    toast("Solo se puede matricular un usuario con rol estudiante.");
    return;
  }
  const nextCourses = db.courses.map((entry) => {
    if (entry.id !== course.id) return entry;
    if (role === "teacher") {
      // Un solo docente por curso: reemplaza al anterior
      return { ...entry, teacherIds: [user.id] };
    }
    if (entry.studentIds.includes(user.id)) return entry;
    return { ...entry, studentIds: [...entry.studentIds, user.id] };
  });
  saveDb({ ...db, courses: nextCourses });
  markClean();
  toast(role === "teacher" ? "Docente asignado (único por curso)." : "Estudiante matriculado.");
  render();
}

function availableCoursesForStudent(studentId) {
  return db.courses.filter((course) => !course.studentIds.includes(studentId));
}

function enrolledCoursesForStudent(studentId) {
  return db.courses.filter((course) => course.studentIds.includes(studentId));
}

function enrollExistingStudent(form) {
  const data = new FormData(form);
  const studentId = String(data.get("studentId") || "").trim();
  const courseId = String(data.get("courseId") || "").trim();
  const student = db.users.find((user) => user.id === studentId && user.role === "student");
  const course = courseById(courseId);

  if (!student) {
    toast("Selecciona un estudiante válido.");
    return;
  }
  if (!course) {
    toast("Selecciona un curso válido.");
    return;
  }
  if (course.studentIds.includes(student.id)) {
    toast("El estudiante ya está matriculado en ese curso.");
    return;
  }

  const nextCourses = db.courses.map((entry) => {
    if (entry.id !== course.id) return entry;
    return { ...entry, studentIds: [...entry.studentIds, student.id] };
  });
  saveDb({ ...db, courses: nextCourses });
  markClean();
  toast(`${student.fullName} matriculado en ${course.name}.`);
  render();
}

function normalizeScoreInput(raw) {
  let text = String(raw ?? "").trim();
  if (!text) return { empty: true, value: null, display: "" };

  // Coma decimal → punto
  text = text.replace(/,/g, ".");
  // Quitar espacios y símbolos no numéricos excepto punto
  text = text.replace(/[^\d.]/g, "");

  // Varios puntos: conservar el primero
  const parts = text.split(".");
  if (parts.length > 2) text = `${parts[0]}.${parts.slice(1).join("")}`;

  // Casos tipo "45" → 4.5, "38" → 3.8 (dos dígitos sin decimal, interpretados como décimas)
  if (/^\d{2}$/.test(text)) {
    text = `${text[0]}.${text[1]}`;
  }

  let value = Number(text);
  if (Number.isNaN(value)) return { empty: false, value: null, display: text, error: true };

  // Si quedó > 5 por un enter mal (ej. 45 sin corregir), intentar /10 una vez
  if (value > 5 && value <= 50) {
    value = Math.round((value / 10) * 10) / 10;
    text = String(value);
  }

  // Escala 0.0 – 5.0 (0 se usa cuando el campo quedó vacío al guardar)
  if (value < 0 || value > 5) {
    return { empty: false, value: null, display: text, error: true };
  }

  // Redondeo a 1 decimal
  value = Math.round(value * 10) / 10;
  return { empty: false, value, display: value.toFixed(1), error: false };
}

function parseSingleScore(text) {
  const result = normalizeScoreInput(text);
  if (result.empty) return { ok: true, value: null, empty: true };
  if (result.error || result.value === null) return { ok: false, value: null, empty: false };
  return { ok: true, value: result.value, empty: false };
}

function saveGrade(form) {
  const data = new FormData(form);
  const courseId = String(data.get("courseId") || ui.courseId || "");
  const studentId = String(data.get("studentId") || ui.gradeStudentId || "");
  const itemIds = data.getAll("itemId[]").map((value) => String(value || ""));
  const notesTexts = data.getAll("notesText[]").map((value) => String(value || "").trim());

  if (!courseId || !studentId) {
    toast("Completa curso y estudiante.");
    return;
  }

  const parsedRows = notesTexts.map((text, index) => {
    const parsed = parseSingleScore(text);
    return { itemId: itemIds[index], parsed, raw: text };
  });

  if (parsedRows.some((row) => !row.parsed.ok)) {
    toast("Cada clase admite una sola nota entre 0.0 y 5.0 (usa punto o coma decimal).");
    return;
  }

  // Campos vacíos → 0.0 para que el promedio del curso quede completo.
  // Reemplaza solo las notas de este estudiante en este curso.
  const nextGrades = db.grades.filter((grade) => !(grade.courseId === courseId && grade.studentId === studentId));
  let filledAsZero = 0;
  parsedRows.forEach((row) => {
    if (!row.itemId) return;
    const score = row.parsed.empty || row.parsed.value === null ? 0 : row.parsed.value;
    if (row.parsed.empty || row.parsed.value === null) filledAsZero += 1;
    nextGrades.unshift({
      id: uid("grade"),
      courseId,
      studentId,
      itemId: row.itemId,
      notes: [{ id: uid("note"), label: "Calificación", score }],
      updatedBy: currentUser()?.id || null,
      updatedAt: new Date().toISOString(),
    });
  });

  saveDb({ ...db, grades: nextGrades });
  ui.courseId = courseId;
  ui.gradeStudentId = studentId;
  markClean();
  toast(filledAsZero
    ? `Notas guardadas. ${filledAsZero} clase(s) vacía(s) se registraron como 0.0.`
    : "Notas guardadas.");
  render();
}

function bindScoreInputs() {
  app.querySelectorAll('input[name="notesText[]"]').forEach((input) => {
    input.addEventListener("blur", () => {
      const result = normalizeScoreInput(input.value);
      if (result.empty) {
        input.value = "";
        return;
      }
      if (result.error) {
        input.classList.add("is-invalid");
        toast("Nota inválida: debe estar entre 0.0 y 5.0.");
        return;
      }
      input.classList.remove("is-invalid");
      input.value = result.display;
    });
    input.addEventListener("input", () => {
      // Sustituir coma por punto mientras escribe
      if (input.value.includes(",")) {
        const pos = input.selectionStart;
        input.value = input.value.replace(/,/g, ".");
        if (typeof pos === "number") input.setSelectionRange(pos, pos);
      }
      setDirty();
    });
  });
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
  const target = db.users.find((user) => user.id === userId);
  if (!target) return;
  if (!confirm(`¿Eliminar al usuario "${target.fullName}" (@${target.username})?\n\nSe quitarán sus matrículas, asignaciones y calificaciones. Esta acción no se puede deshacer.`)) {
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
  const course = courseById(courseId);
  if (!course) return;
  if (!confirm(`¿Eliminar el curso "${course.name}"?\n\nSe borrarán el temario, matrículas y todas las calificaciones asociadas. Esta acción no se puede deshacer.`)) {
    return;
  }
  const nextCourses = db.courses.filter((entry) => entry.id !== courseId);
  const nextGrades = db.grades.filter((grade) => grade.courseId !== courseId);
  saveDb({ ...db, courses: nextCourses, grades: nextGrades });
  ui.courseId = nextCourses[0]?.id || null;
  toast("Curso eliminado.");
  render();
}

function removeItem(courseId, itemId) {
  const course = courseById(courseId);
  const item = course ? itemById(course, itemId) : null;
  if (!confirm(`¿Eliminar "${item?.title || "esta clase"}"?\n\nTambién se borrarán las notas de esa actividad. Esta acción no se puede deshacer.`)) {
    return;
  }
  const nextCourses = db.courses.map((entry) => {
    if (entry.id !== courseId) return entry;
    const items = entry.items.filter((row) => row.id !== itemId).map((row, index) => ({ ...row, order: index + 1 }));
    return { ...entry, items };
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
            <div class="brand-mark brand-mark--beveled brand-mark--png"><img src="jessika-ruiz-logo.png" alt="Logo Jessika Ruiz" /></div>
            <div>
              <div class="brand__kicker">${BRAND_NAME}</div>
              <h1 class="login__title">Sistema académico para cursos, matrículas y calificaciones</h1>
            </div>
          </div>
          <p class="login__copy">${BRAND_TAGLINE}</p>
          <button class="btn btn--ghost theme-toggle" type="button" data-action="toggle-theme">${lucideIcon(theme === "dark" ? "sun" : "moon-star", 16, theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro")} ${theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</button>
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
              <input name="username" autocomplete="username" required />
            </div>
            <div class="field">
              <label>Contraseña</label>
              <input name="password" type="password" autocomplete="current-password" required />
            </div>
            <button class="btn btn--gold" type="submit">Entrar</button>
          </form>
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
    { id: "overview", label: "Inicio" },
    user.role === "admin" ? { id: "users", label: "Usuarios" } : null,
    user.role === "admin" || user.role === "teacher" ? { id: "courses", label: "Cursos" } : null,
    user.role === "teacher" || user.role === "admin" ? { id: "grades", label: "Calificaciones" } : null,
    user.role === "student" ? { id: "notes", label: "Mis notas" } : null,
  ].filter(Boolean);

  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark brand-mark--beveled brand-mark--png"><img src="jessika-ruiz-logo.png" alt="Logo Jessika Ruiz" /></div>
          <div class="brand__kicker">${BRAND_NAME}</div>
          <div class="brand__title">Panel académico</div>
          <div class="brand__subtitle">${user.fullName} · ${roleLabel(user.role)}</div>
        </div>
        <nav class="nav">
          ${navItems
            .map(
              (item) => `
                <button class="${ui.view === item.id ? "is-active" : ""}" data-view="${item.id}">${item.id === "overview" ? lucideIcon("layout-dashboard") : item.id === "users" ? lucideIcon("users") : item.id === "courses" ? lucideIcon("book-open") : item.id === "grades" ? lucideIcon("clipboard-list") : lucideIcon("award")} ${item.label}</button>
              `,
            )
            .join("")}
        </nav>
        <div class="sidebar__footer">
          <div class="pill">Rol: ${roleLabel(user.role)}</div>
          <div class="pill">Cursos visibles: ${visible.length}</div>
          <button class="btn btn--ghost" data-action="toggle-theme">${lucideIcon(theme === "dark" ? "sun" : "moon-star", 16, theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro")} ${theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</button>
          <button class="btn btn--ghost" data-action="logout">${lucideIcon("log-out", 16, "Cerrar sesión")} Cerrar sesión</button>
          ${user.role === "admin" ? `
            <button class="btn btn--ghost" data-action="export-json">Exportar JSON</button>
            <button class="btn btn--ghost" data-action="export-excel">Exportar Excel</button>
            <button class="btn btn--ghost" data-action="import-json">Importar JSON</button>
            <button class="btn btn--ghost" data-action="reset-demo">Restablecer datos</button>
          ` : ""}
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
  return "Inicio";
}

function viewSubtitle(view, user, course, visible) {
  if (view === "users") return "Crea y administra usuarios del sistema.";
  if (view === "courses") return "Agrega cursos, temas, brigadas y asignaciones.";
  if (view === "grades") return "Carga varias notas por práctica o por clase y guarda el promedio.";
  if (view === "notes") return "Consulta tus cursos, promedios y nota final calculada.";
  return `Accesos rápidos, cursos activos y acciones principales. ${visible.length} cursos disponibles.`;
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
  return `
    <section class="card card--soft">
      <div class="card__body">
        <div class="toolbar overview-hero">
          <div class="overview-brand">
            <div class="brand-mark brand-mark--beveled brand-mark--png"><img src="jessika-ruiz-logo.png" alt="Logo Jessika Ruiz" /></div>
            <div>
              <div class="section-title">${roleLabel(user.role)}</div>
              <h2 class="card__title">${BRAND_NAME}</h2>
              <p class="card__subtitle">${BRAND_TAGLINE}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Acciones rápidas</h2>
          <p class="card__subtitle">Empieza desde aquí sin navegar pantallas innecesarias.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="grid grid--cards">
          <div class="list__item">
            <div class="list__title">${lucideIcon("users")} Personas</div>
            <div class="list__meta">Gestiona estudiantes, docentes y administradores.</div>
            ${user.role === "admin" ? '<button class="btn btn--gold" data-view="users" type="button">Abrir usuarios</button>' : ''}
          </div>
          <div class="list__item">
            <div class="list__title">${lucideIcon("book-open")} Cursos</div>
            <div class="list__meta">Crear cursos, asignar docente y ordenar temario.</div>
            ${(user.role === "admin" || user.role === "teacher") ? '<button class="btn btn--gold" data-view="courses" type="button">Abrir cursos</button>' : ''}
          </div>
          <div class="list__item">
            <div class="list__title">${lucideIcon("clipboard-list")} Notas</div>
            <div class="list__meta">Registrar, revisar y completar calificaciones.</div>
            ${(user.role === "admin" || user.role === "teacher") ? '<button class="btn btn--gold" data-view="grades" type="button">Abrir calificaciones</button>' : '<button class="btn btn--gold" data-view="notes" type="button">Ver mis notas</button>'}
          </div>
        </div>
        <div class="course-tabs">
          ${visible.map((course) => `<button class="${selectedCourse?.id === course.id ? "is-active" : ""}" data-course="${course.id}">${lucideIcon(normalizeCourseIcon(course.icon, course.id, course.name))} ${course.name}</button>`).join("")}
        </div>
        ${selectedCourse ? courseSnapshot(selectedCourse, user) : '<p class="muted" style="margin-top: 16px;">No hay cursos asignados a este usuario.</p>'}
      </div>
    </section>

    <section class="grid grid--split" style="margin-top: 18px;">
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Cambiar mi contraseña</h2>
            <p class="card__subtitle">Actualiza la clave de tu cuenta @${escapeHtml(user.username)}.</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="change-password">
            <div class="field"><label>Contraseña actual</label><input name="currentPassword" type="password" required autocomplete="current-password" /></div>
            <div class="field"><label>Nueva contraseña</label><input name="newPassword" type="password" required minlength="6" autocomplete="new-password" /></div>
            <div class="field"><label>Confirmar nueva contraseña</label><input name="confirmPassword" type="password" required minlength="6" autocomplete="new-password" /></div>
            <button class="btn btn--gold" type="submit">Guardar contraseña</button>
          </form>
        </div>
      </article>
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Accesos rápidos</h2>
            <p class="card__subtitle">Entrar como otro usuario de prueba (demo).</p>
          </div>
        </div>
        <div class="card__body">
          <div class="list">
            ${db.users.slice(0, 12).map((entry) => `
              <div class="list__item">
                <div class="row" style="justify-content: space-between;">
                  <div>
                    <div class="list__title">${escapeHtml(entry.fullName)}</div>
                    <div class="list__meta">@${escapeHtml(entry.username)} · ${roleLabel(entry.role)}</div>
                  </div>
                  <button class="btn btn--ghost" type="button" data-action="quick-login" data-user-id="${entry.id}">Entrar</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </article>
    </section>
  `;
}

function courseSnapshot(course, user) {
  const summary = user.role === "student" ? courseSummary(course, user.id) : null;
  const teacherNames = course.teacherIds.map((id) => db.users.find((userEntry) => userEntry.id === id)?.fullName).filter(Boolean);
  return `
    <div class="grid" style="margin-top: 16px;">
      <div class="list__item">
        <div class="list__title">${lucideIcon(normalizeCourseIcon(course.icon, course.id, course.name))} ${course.name}</div>
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
  const initialRole = selectedUser?.role || "student";
  const assignedCourse = selectedUser
    ? db.courses.find((course) => course.studentIds.includes(selectedUser.id) || course.teacherIds.includes(selectedUser.id))
    : null;
  return `
    <section class="card">
      <div class="card__header">
        <div>
          <h2 class="card__title">${selectedUser ? "Editar usuario" : "Crear usuario"}</h2>
          <p class="card__subtitle">Elige primero el rol; luego se habilita matrícula o asignación de curso.</p>
        </div>
      </div>
      <div class="card__body">
        <form class="form" data-form="save-user">
          <input type="hidden" name="userId" value="${selectedUser?.id || ""}" />
          <input type="hidden" name="photoData" value="${escapeAttr(selectedUser?.photo || "")}" data-photo-data />
          <div class="field">
            <label>Rol</label>
            <select name="role" data-user-role-select>
              <option value="student" ${initialRole === "student" ? "selected" : ""}>Estudiante</option>
              <option value="teacher" ${initialRole === "teacher" ? "selected" : ""}>Docente</option>
              <option value="admin" ${initialRole === "admin" ? "selected" : ""}>Administrador</option>
            </select>
          </div>
          <div class="field" data-role-field="document">
            <label>Documento de identidad</label>
            <input name="documentId" value="${escapeHtml(selectedUser?.documentId || "")}" inputmode="numeric" data-document-id />
            <div class="helper">Se formatea con puntos (1.234.567). Usuario y contraseña por defecto = documento sin puntos.</div>
          </div>
          <div class="split">
            <div class="field">
              <label>Foto del estudiante</label>
              <input type="file" accept="image/*" data-photo-file />
              <div class="helper">Puedes subir una imagen o usar la cámara.</div>
            </div>
            <div class="field">
              <label>Vista previa</label>
              <div class="student-photo-preview" data-photo-preview>
                ${selectedUser?.photo ? `<img src="${escapeAttr(selectedUser.photo)}" alt="Foto del estudiante" />` : '<span class="muted">Sin foto</span>'}
              </div>
            </div>
          </div>
          <div class="field camera-field">
            <label>Webcam</label>
            <div class="camera-controls row">
              <button class="btn btn--ghost" type="button" data-photo-camera-start>Activar cámara</button>
              <button class="btn btn--ghost" type="button" data-photo-camera-capture>Tomar foto</button>
              <button class="btn btn--ghost" type="button" data-photo-camera-stop>Apagar cámara</button>
            </div>
            <video class="camera-preview" data-photo-camera autoplay playsinline muted hidden></video>
          </div>
          <div class="field"><label>Nombre completo</label><input name="fullName" value="${escapeHtml(selectedUser?.fullName || "")}" required /></div>
          <div class="field"><label>Usuario</label><input name="username" value="${escapeHtml(selectedUser?.username || "")}" required autocomplete="off" /></div>
          <div class="field"><label>Contraseña</label><input name="password" type="text" value="${escapeHtml(selectedUser?.password || "")}" required minlength="4" autocomplete="off" /></div>
          <div class="split">
            <div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(selectedUser?.email || "")}" /></div>
            <div class="field"><label>Teléfono</label><input name="phone" value="${escapeHtml(selectedUser?.phone || "")}" /></div>
          </div>
          <div class="split">
            <div class="field"><label>Fecha de nacimiento</label><input name="birthDate" type="date" value="${escapeHtml(selectedUser?.birthDate || "")}" /></div>
            <div class="field"><label>Dirección</label><input name="address" value="${escapeHtml(selectedUser?.address || "")}" /></div>
          </div>
          <div class="split">
            <div class="field"><label>Acudiente</label><input name="guardianName" value="${escapeHtml(selectedUser?.guardianName || "")}" /></div>
            <div class="field"><label>Contacto de emergencia</label><input name="emergencyContact" value="${escapeHtml(selectedUser?.emergencyContact || "")}" /></div>
          </div>
          <div class="split">
            <div class="field"><label>Teléfono de emergencia</label><input name="emergencyPhone" value="${escapeHtml(selectedUser?.emergencyPhone || "")}" /></div>
            <div class="field"><label>Observaciones de salud</label><input name="healthInfo" value="${escapeHtml(selectedUser?.healthInfo || "")}" /></div>
          </div>
          <div class="field" data-role-field="course" style="${initialRole === "admin" ? "display:none;" : ""}">
            <label data-course-label>${initialRole === "teacher" ? "Curso a asignar (un docente por curso)" : "Curso a matricular"}</label>
            ${autocompleteMarkup({
              key: "user-linked-course",
              label: "",
              placeholder: "Escribe o elige el curso",
              options: db.courses.map((item) => ({ id: item.id, label: item.name })),
              selectedId: assignedCourse?.id || "",
              name: "linkedCourse",
            })}
            <div class="helper" data-course-helper>
              ${initialRole === "teacher"
                ? "Al asignar, este docente quedará como el único del curso."
                : selectedUser
                  ? "Si eliges un curso, se reasignará la matrícula principal. Puedes matricular más cursos desde Cursos."
                  : "Obligatorio al crear un estudiante."}
            </div>
          </div>
          <div class="toolbar">
            <button class="btn btn--gold" type="submit">${selectedUser ? "Guardar cambios" : "Crear usuario"}</button>
            <button class="btn btn--ghost" type="button" data-clear-user-form>+ Nuevo</button>
          </div>
        </form>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Administración en tabla</h2>
          <p class="card__subtitle">Edita nombre, contacto y contraseña por categoría. Guarda cada bloque de una vez.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${[
            { id: "students", label: "Estudiantes" },
            { id: "teachers", label: "Docentes" },
            { id: "admins", label: "Administradores" },
            { id: "enroll", label: "Matricular" },
            { id: "by-course", label: "Por curso" },
          ].map((tab) => `<button class="${ui.usersTab === tab.id ? "is-active" : ""}" data-user-tab="${tab.id}" type="button">${tab.label}</button>`).join("")}
        </div>
      </div>
    </section>

    ${ui.usersTab === "students" ? renderUsersBulkTable("student", "Estudiantes", "Nombre, documento, contacto y contraseña editables en bloque.") : ""}
    ${ui.usersTab === "teachers" ? renderUsersBulkTable("teacher", "Docentes", "Información base y contraseña editables en una sola tabla.") : ""}
    ${ui.usersTab === "admins" ? renderUsersBulkTable("admin", "Administradores", "Puedes cambiar la contraseña de cada administrador desde esta tabla.") : ""}
    ${ui.usersTab === "enroll" ? renderEnrollExtraCourses() : ""}
    ${ui.usersTab === "by-course" ? renderCourseRosterByCourse() : ""}
  `;
}

function renderEnrollExtraCourses() {
  const students = db.users.filter((user) => user.role === "student");
  return `
    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Matricular en otros cursos</h2>
          <p class="card__subtitle">Lista de estudiantes existentes. Solo se ofrecen cursos en los que aún no están matriculados.</p>
        </div>
      </div>
      <div class="card__body">
        ${students.length ? `
          <table class="table table--tight table-editor">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Cursos actuales</th>
                <th>Matricular en</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${students.map((student) => {
                const enrolled = enrolledCoursesForStudent(student.id);
                const available = availableCoursesForStudent(student.id);
                return `
                  <tr>
                    <td>
                      <div class="row" style="align-items: center;">
                        <div class="student-mini-photo">${student.photo ? `<img src="${escapeAttr(student.photo)}" alt="Foto de ${escapeHtml(student.fullName)}" />` : ""}</div>
                        <div>
                      <div class="list__title">${escapeHtml(student.fullName)}</div>
                      <div class="list__meta">@${escapeHtml(student.username)}</div>
                        </div>
                      </div>
                    </td>
                    <td>${escapeHtml(student.documentId || "Sin documento")}</td>
                    <td>
                      ${enrolled.length
                        ? enrolled.map((course) => `<span class="badge badge--muted" style="margin: 2px;">${escapeHtml(course.name)}</span>`).join(" ")
                        : '<span class="muted">Sin cursos</span>'}
                    </td>
                    <td>
                      ${available.length ? `
                        <form class="form form--compact" data-form="enroll-existing" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                          <input type="hidden" name="studentId" value="${escapeHtml(student.id)}" />
                          <select name="courseId" required style="min-width: 160px; flex: 1 1 160px;">
                            <option value="">Elegir curso…</option>
                            ${available.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.name)}</option>`).join("")}
                          </select>
                          <button class="btn btn--gold" type="submit">Matricular</button>
                        </form>
                      ` : '<span class="badge">Ya está en todos los cursos</span>'}
                    </td>
                    <td></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : '<p class="muted">No hay estudiantes registrados.</p>'}
      </div>
    </section>
  `;
}

function coursesView(user, selectedCourse, visible) {
  const teachers = db.users.filter((item) => item.role === "teacher");
  const course = selectedCourse || visible[0] || db.courses[0] || null;
  const editingCourse = ui.editCourseId ? db.courses.find((item) => item.id === ui.editCourseId) || null : null;
  const currentTeacherId = editingCourse?.teacherIds?.[0] || "";
  const courseList = user.role === "admin" ? db.courses : visible;
  return `
    <section class="grid grid--split split--top">
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">${editingCourse ? "Editar curso" : "Crear curso"}</h2>
            <p class="card__subtitle">Define el curso y asigna su docente (uno por curso).</p>
          </div>
        </div>
        <div class="card__body">
          <form class="form" data-form="save-course">
            <input type="hidden" name="courseId" value="${editingCourse?.id || ""}" />
            <div class="split">
              <div class="field"><label>Icono del curso</label>
                <select name="icon">
                  ${COURSE_ICON_NAMES.map((icon) => `<option value="${icon}" ${normalizeCourseIcon(editingCourse?.icon, editingCourse?.id, editingCourse?.name) === icon ? "selected" : ""}>${COURSE_ICON_MAP[icon].label}</option>`).join("")}
                </select>
              </div>
              <div class="field"><label>Nombre del curso</label><input name="name" value="${escapeHtml(editingCourse?.name || "")}" required /></div>
            </div>
            <div class="field"><label>Descripción</label><textarea name="description">${escapeHtml(editingCourse?.description || "")}</textarea></div>
            <div class="field">
              <label>Docente a cargo</label>
              <select name="teacherId">
                <option value="">Sin docente asignado</option>
                ${teachers.map((teacher) => `
                  <option value="${teacher.id}" ${currentTeacherId === teacher.id ? "selected" : ""}>${escapeHtml(teacher.fullName)} @${escapeHtml(teacher.username)}</option>
                `).join("")}
              </select>
              <div class="helper">Solo puede haber un docente por curso. Los estudiantes se matriculan al crear el usuario.</div>
            </div>
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
            <h2 class="card__title">Cursos registrados</h2>
            <p class="card__subtitle">Abrir, editar o eliminar cursos.</p>
          </div>
        </div>
        <div class="card__body">
          <table class="table table--tight">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Docente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${courseList.map((entry) => {
                const teacherName = entry.teacherIds
                  .map((id) => db.users.find((u) => u.id === id)?.fullName)
                  .filter(Boolean)
                  .join(", ") || "Sin asignar";
                return `
                <tr>
                  <td>
                    <div class="list__title">${lucideIcon(normalizeCourseIcon(entry.icon, entry.id, entry.name))} ${escapeHtml(entry.name)}</div>
                    <div class="list__meta">${entry.items.length} clases · ${entry.studentIds.length} estudiantes</div>
                  </td>
                  <td>${escapeHtml(teacherName)}</td>
                  <td>
                    <div class="row">
                      <button class="btn btn--ghost icon-btn" data-course="${entry.id}" type="button" aria-label="Abrir curso">↗</button>
                      <button class="btn btn--ghost icon-btn" data-edit-course="${entry.id}" type="button" aria-label="Editar curso">✎</button>
                      ${user.role === "admin" ? `<button class="btn btn--ghost icon-btn" data-remove-course="${entry.id}" type="button" aria-label="Eliminar curso">−</button>` : ""}
                    </div>
                  </td>
                </tr>
              `;
              }).join("") || `<tr><td colspan="3" class="muted">No hay cursos.</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card__header">
        <div>
          <h2 class="card__title">Temario editable</h2>
          <p class="card__subtitle">Edita clases y prácticas como tabla. Guarda todo de una sola vez.</p>
        </div>
      </div>
      <div class="card__body">
        <div class="course-tabs">
          ${visible.map((entry) => `<button class="${course?.id === entry.id ? "is-active" : ""}" data-course="${entry.id}">${lucideIcon(normalizeCourseIcon(entry.icon, entry.id, entry.name))} ${entry.name}</button>`).join("")}
        </div>
        ${course ? `
          <div class="grid" style="margin-top: 16px;">
            <div class="split">
              <div class="list__item">
                <div class="list__title">${lucideIcon(normalizeCourseIcon(course.icon, course.id, course.name))} ${course.name}</div>
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
                        <input name="itemTitle[]" value="${escapeHtml(item.title)}" aria-label="Título de clase" />
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
  if (course && ui.courseId !== course.id) ui.courseId = course.id;
  const studentOptions = course ? course.studentIds.map((id) => db.users.find((item) => item.id === id)).filter(Boolean) : [];
  let currentStudent = studentOptions.find((item) => item.id === ui.gradeStudentId) || studentOptions[0] || null;
  if (currentStudent) ui.gradeStudentId = currentStudent.id;
  else ui.gradeStudentId = null;
  const studentGrades = currentStudent && course ? course.items.map((item) => ({ item, grade: gradeFor(currentStudent.id, course.id, item.id) })) : [];

  return `
    <section class="grid grid--split">
      <article class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Registro rápido de notas</h2>
            <p class="card__subtitle">Busca al estudiante y captura una nota por clase (escala 1.0 a 5.0).</p>
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
                    <th>Nota (1.0 – 5.0)</th>
                  </tr>
                </thead>
                <tbody data-note-rows>
                  ${course ? course.items.map((item, index) => {
                    const grade = currentStudent ? gradeFor(currentStudent.id, course.id, item.id) : null;
                    const hasGrade = Boolean(grade?.notes?.length);
                    const scoreValue = hasGrade ? formatScore(gradeAverage(grade)) : "";
                    const pending = !hasGrade;
                    const pendingStyle = pending
                      ? ' style="background: rgba(255, 123, 123, 0.14); outline: 1px solid rgba(255, 123, 123, 0.35);"'
                      : "";
                    return `
                      <tr class="${pending ? "table-editor__row--pending" : ""}"${pendingStyle}>
                        <td data-note-order>${index + 1}</td>
                        <td>
                          <input type="hidden" name="itemId[]" value="${item.id}" />
                          ${String(item.order).padStart(2, "0")} · ${escapeHtml(item.title)}
                          ${pending ? ' <span class="badge" style="border-color: rgba(255,123,123,0.4); background: rgba(255,123,123,0.12); color: #ffb4b4;">Sin nota</span>' : ""}
                        </td>
                        <td>${item.kind === "practice" ? "Práctica / brigada" : "Tema / clase"}</td>
                        <td><input name="notesText[]" inputmode="decimal" value="${scoreValue === "--" ? "" : escapeHtml(scoreValue)}" aria-label="Nota" /></td>
                      </tr>
                    `;
                  }).join("") : `<tr><td colspan="4" class="muted">Selecciona un curso para ver su temario.</td></tr>`}
                </tbody>
              </table>
              <div class="helper" style="margin-top: 8px;">Una sola nota por clase (0.0 a 5.0). Filas en rojo = sin calificar. Al guardar, los campos vacíos se registran como <strong>0.0</strong> para completar el promedio.</div>
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
          ${teacherCourses.map((entry) => `<button class="${course?.id === entry.id ? "is-active" : ""}" data-course="${entry.id}">${lucideIcon(normalizeCourseIcon(entry.icon, entry.id, entry.name))} ${entry.name}</button>`).join("")}
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
        <thead><tr><th>Clase</th><th>Tipo</th><th>Nota</th></tr></thead>
        <tbody>
          ${studentGrades
            .map(
              ({ item, grade }) => `
                <tr>
                  <td>${String(item.order).padStart(2, "0")} · ${item.title}</td>
                  <td>${item.kind === "practice" ? "Práctica" : "Tema"}</td>
                  <td>${grade ? formatScore(gradeAverage(grade)) : "Sin nota"}</td>
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
                  <div class="list__title">${lucideIcon(normalizeCourseIcon(course.icon, course.id, course.name))} ${course.name}</div>
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
          ${visible.map((course) => `<button class="${ui.courseId === course.id ? "is-active" : ""}" data-course="${course.id}">${lucideIcon(normalizeCourseIcon(course.icon, course.id, course.name))} ${course.name}</button>`).join("")}
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
            <div class="list__title">${lucideIcon(normalizeCourseIcon(course.icon, course.id, course.name))} ${course.name}</div>
            <div class="list__meta">${course.description || "Sin descripción."}</div>
          </div>
          <span class="badge">Nota final ${formatScore(summary.finalAverage)}</span>
        </div>
      </div>
      <table class="table table--tight">
        <thead><tr><th>Clase</th><th>Tipo</th><th>Nota</th></tr></thead>
        <tbody>
          ${summary.items.map((item) => `
            <tr>
              <td>${String(item.order).padStart(2, "0")} · ${item.title}</td>
              <td>${item.kind === "practice" ? "Práctica / brigada" : "Tema / clase"}</td>
              <td>${formatScore(item.avg)}</td>
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
          <p class="card__subtitle">Matrícula y promedios (temas, prácticas y nota final) por estudiante.</p>
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
                    <div class="list__title">${escapeHtml(course.name)}</div>
                    <div class="list__meta">${students.length} estudiante(s) matriculado(s)</div>
                  </div>
                  <span class="badge badge--muted">${course.teacherIds.length} docente(s)</span>
                </div>
                <table class="table table--tight" style="margin-top: 12px;">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Documento</th>
                      <th>Temas</th>
                      <th>Prácticas</th>
                      <th>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${students.map((student) => {
                      const summary = courseSummary(course, student.id);
                      return `
                      <tr>
                        <td>${escapeHtml(student.fullName)}</td>
                        <td>${escapeHtml(student.documentId || "Sin documento")}</td>
                        <td>${formatScore(summary.topicAverage)}</td>
                        <td>${formatScore(summary.practiceAverage)}</td>
                        <td><strong>${formatScore(summary.finalAverage)}</strong></td>
                      </tr>
                    `;
                    }).join("") || '<tr><td colspan="5" class="muted">Sin estudiantes matriculados.</td></tr>'}
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
        <input name="itemTitle[]" value="${escapeHtml(item.title || "")}" aria-label="Título de clase ${index + 1}" />
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

  app.querySelectorAll("[data-action='toggle-theme']").forEach((button) => button.addEventListener("click", toggleTheme));
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

  app.querySelectorAll("[data-form='enroll-existing']").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    enrollExistingStudent(form);
  }));

  app.querySelectorAll("[data-autocomplete-key]").forEach((input) => {
    bindAutocompleteInput(input);
  });

  app.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.dataset.autocompleteKey) return;
    field.addEventListener("input", () => setDirty());
    field.addEventListener("change", () => setDirty());
  });

  app.querySelectorAll("[data-action='export-json']").forEach((button) => {
    button.addEventListener("click", exportDbJson);
  });
  app.querySelectorAll("[data-action='export-excel']").forEach((button) => {
    button.addEventListener("click", exportDbExcel);
  });
  app.querySelectorAll("[data-action='import-json']").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) importDbJson(file);
      });
      input.click();
    });
  });

  app.querySelectorAll("[data-form='change-password']").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      changeOwnPassword(form);
    });
  });

  app.querySelectorAll("[data-user-role-select]").forEach((select) => {
    select.addEventListener("change", () => {
      const role = select.value;
      const courseField = app.querySelector("[data-role-field='course']");
      const documentField = app.querySelector("[data-role-field='document']");
      const courseLabel = app.querySelector("[data-course-label]");
      const courseHelper = app.querySelector("[data-course-helper]");
      if (courseField) courseField.style.display = role === "admin" ? "none" : "";
      if (documentField) {
        const docInput = documentField.querySelector("input");
        if (docInput) docInput.required = role === "student";
      }
      if (courseLabel) {
        courseLabel.textContent = role === "teacher"
          ? "Curso a asignar (un docente por curso)"
          : "Curso a matricular";
      }
      if (courseHelper) {
        courseHelper.textContent = role === "teacher"
          ? "Al asignar, este docente quedará como el único del curso."
          : "Obligatorio al crear un estudiante. Puedes matricular más cursos después desde Cursos.";
      }
      setDirty();
    });
  });

  bindScoreInputs();

  app.querySelectorAll("[data-document-id]").forEach((input) => {
    bindDocumentIdField(input);
  });

  app.querySelectorAll("[data-form='save-user']").forEach((form) => {
    bindPhotoField(form);
  });
}

function render() {
  applyTheme();
  const user = currentUser();
  if (!user) {
    app.innerHTML = loginView();
  } else {
    app.innerHTML = shellView(user);
  }
  bindEvents();
}

window.addEventListener("beforeunload", persistDb);
window.addEventListener("pagehide", persistDb);

applyTheme();
render();
