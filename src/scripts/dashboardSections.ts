// Single source of truth for the dashboard nav, the auth guards and the
// active-section detection. A new dashboard section should only ever need a
// new entry here plus a new page file — never an edit to GNavbar.astro.
export type DashboardRole = "TEACHER" | "COUNSELOR" | "ADMIN";

export type DashboardGroupKey = "docentes" | "administracion" | "informacion";

export interface DashboardGroup {
  key: DashboardGroupKey;
  label: string;
}

export interface DashboardSection {
  key: string;
  label: string;
  group: DashboardGroupKey;
  // Path relative to the site root, without a leading slash (e.g.
  // "dashboard/notas"). Callers prefix it with import.meta.env.BASE_URL,
  // which already ends in "/", so this avoids double slashes and keeps the
  // "/tic-campus/" base out of every call site.
  path: string;
  roles: DashboardRole[];
}

// Order here is display order: top-row groups left to right, and within a
// group, items left to right.
export const DASHBOARD_GROUPS: DashboardGroup[] = [
  { key: "docentes", label: "Docentes" },
  { key: "administracion", label: "Administración" },
  { key: "informacion", label: "Información" },
];

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    key: "notas",
    label: "Notas",
    group: "docentes",
    path: "dashboard/notas",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    key: "revisiones",
    label: "Revisiones",
    group: "docentes",
    path: "dashboard/revisiones",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    key: "estudiantes",
    label: "Estudiantes",
    group: "administracion",
    path: "dashboard/estudiantes",
    roles: ["ADMIN"],
  },
  {
    key: "materias",
    label: "Materias",
    group: "administracion",
    path: "dashboard/materias",
    roles: ["ADMIN"],
  },
  {
    key: "avanzados",
    label: "Avanzados",
    group: "administracion",
    path: "dashboard/avanzados",
    roles: ["ADMIN"],
  },
  {
    key: "horarios-materias",
    label: "Horarios",
    group: "administracion",
    path: "dashboard/horarios-materias",
    roles: ["ADMIN"],
  },
  {
    key: "grillas-estudiantes",
    label: "Grillas Estudiantes",
    group: "informacion",
    path: "dashboard/grillas-estudiantes",
    roles: ["TEACHER", "COUNSELOR", "ADMIN"],
  },
  {
    key: "listados",
    label: "Listados",
    group: "informacion",
    path: "dashboard/listados",
    roles: ["TEACHER", "COUNSELOR", "ADMIN"],
  },
];

export function sectionByKey(key: string): DashboardSection {
  const section = DASHBOARD_SECTIONS.find((s) => s.key === key);
  if (!section) throw new Error(`Unknown dashboard section: ${key}`);
  return section;
}

export function rolesFor(key: string): DashboardRole[] {
  return sectionByKey(key).roles;
}

export function sectionsInGroup(group: DashboardGroupKey): DashboardSection[] {
  return DASHBOARD_SECTIONS.filter((s) => s.group === group);
}

// Union of the roles of every section in a group — used to decide whether
// the group header itself should render for the current user.
export function groupRoles(group: DashboardGroupKey): DashboardRole[] {
  const roles = new Set<DashboardRole>();
  sectionsInGroup(group).forEach((s) => s.roles.forEach((r) => roles.add(r)));
  return Array.from(roles);
}

// First section in a group a given role can access, in group display order.
// Used both for the top-row "click a group" href (client-side, per actual
// role) and for the dashboard index router (build-time, per role).
export function firstAccessibleSection(
  group: DashboardGroupKey,
  role: DashboardRole | null,
): DashboardSection | undefined {
  if (!role) return undefined;
  return sectionsInGroup(group).find((s) => s.roles.includes(role));
}

export function firstAccessibleSectionForRole(
  role: DashboardRole | null,
): DashboardSection | undefined {
  if (!role) return undefined;
  for (const group of DASHBOARD_GROUPS) {
    const section = firstAccessibleSection(group.key, role);
    if (section) return section;
  }
  return undefined;
}

// Matches a URL pathname (e.g. Astro.url.pathname, which includes the site
// base) against a section, tolerant of a missing/extra leading or trailing
// slash so it works the same in dev and in the trailing-slash-normalized
// static build.
export function sectionByPath(pathname: string): DashboardSection | undefined {
  const normalized = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return DASHBOARD_SECTIONS.find((s) => normalized.endsWith(s.path));
}
