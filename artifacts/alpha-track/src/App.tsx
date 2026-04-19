import { Switch, Route, Router as WouterRouter } from "wouter";
import { ToastProvider } from "@/context/ToastContext";
import Dashboard from "@/pages/Dashboard";
import AddProject from "@/pages/AddProject";
import DetailProject from "@/pages/DetailProject";
import EditProject from "@/pages/EditProject";

function NotFound() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--text-muted)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
        404 — halaman tidak ditemukan
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/add" component={AddProject} />
      <Route path="/project/:id/edit">
        {(params) => <EditProject id={params.id} />}
      </Route>
      <Route path="/project/:id">
        {(params) => <DetailProject id={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </ToastProvider>
  );
}
