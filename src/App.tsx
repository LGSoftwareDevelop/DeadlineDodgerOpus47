import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { BottomNav } from "./components/BottomNav";
import { InstallPrompt } from "./components/InstallPrompt";
import { TodayPage } from "./pages/Today";
import { AssignmentsPage } from "./pages/Assignments";
import { ClassesPage } from "./pages/Classes";
import { SchedulePage } from "./pages/Schedule";
import { TodosPage } from "./pages/Todos";
import { SettingsPage } from "./pages/Settings";
import { useStore } from "./store/useStore";

function AppShell() {
  const ready = useStore((s) => s.ready);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-xl mx-auto px-4 pt-5 pb-safe">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  );
}
