import type { AlpineComponent } from "alpinejs";
import type { CurrentUserStore } from "../stores/currentUser";
import {
  firstAccessibleSection,
  type DashboardGroupKey,
  type DashboardRole,
} from "../../dashboardSections";

// Backs GNavbar.astro. The nav's markup is built at compile time from
// dashboardSections.ts (every group, every item, in order) — this component
// only decides, client-side, which of that markup is visible for the
// logged-in user's role, since role is only known after the /user/info
// fetch that requireAuth() performs.
const dashboardNavData = () =>
  ({
    canSee(roles: DashboardRole[]): boolean {
      const role = (Alpine.store("currentUser") as CurrentUserStore)
        .role as DashboardRole | null;
      return role !== null && roles.includes(role);
    },
    // Href for a top-row group link: the first item in that group the
    // current role can actually reach. Computed client-side (not baked in
    // at build time) so a group whose sections have different role lists
    // still resolves correctly per-role — a build-time "first item" href
    // would silently point the wrong role at a page they can't see.
    groupHref(group: DashboardGroupKey): string {
      const role = (Alpine.store("currentUser") as CurrentUserStore)
        .role as DashboardRole | null;
      const section = firstAccessibleSection(group, role);
      return section ? `${import.meta.env.BASE_URL}${section.path}` : "#";
    },
  }) as AlpineComponent<{
    canSee: (roles: DashboardRole[]) => boolean;
    groupHref: (group: DashboardGroupKey) => string;
  }>;

export default dashboardNavData;
