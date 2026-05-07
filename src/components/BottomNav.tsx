import { NavLink } from "react-router-dom";
import { Home, BookOpen, GraduationCap, ListChecks, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Today", Icon: Home, end: true },
  { to: "/assignments", label: "Homework", Icon: BookOpen },
  { to: "/classes", label: "Classes", Icon: GraduationCap },
  { to: "/todos", label: "Todos", Icon: ListChecks },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="fixed left-0 right-0 bottom-0 bottom-safe z-30 border-t border-ink-200 dark:border-ink-700 bg-white/90 dark:bg-ink-900/90 backdrop-blur">
      <ul className="grid grid-cols-5 max-w-xl mx-auto">
        {items.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? "text-accent"
                    : "text-ink-500 dark:text-ink-300 hover:text-ink-800 dark:hover:text-ink-100"
                }`
              }
            >
              <Icon size={22} strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
