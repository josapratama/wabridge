import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/public/Landing";
import PublicDocs from "./pages/public/PublicDocs";
import Pricing from "./pages/public/Pricing";
import Dashboard from "./pages/dashboard/Dashboard";
import ProviderConfigs from "./pages/dashboard/ProviderConfigs";
import Sessions from "./pages/dashboard/Sessions";
import Messages from "./pages/dashboard/Messages";
import Events from "./pages/dashboard/Events";
import ApiKeys from "./pages/dashboard/ApiKeys";
import Webhooks from "./pages/dashboard/Webhooks";
import Templates from "./pages/dashboard/Templates";
import ScheduledMessages from "./pages/dashboard/ScheduledMessages";
import AutoReply from "./pages/dashboard/AutoReply";
import Analytics from "./pages/dashboard/Analytics";
import Contacts from "./pages/dashboard/Contacts";
import Broadcast from "./pages/dashboard/Broadcast";
import Team from "./pages/dashboard/Team";
import SessionHealth from "./pages/dashboard/SessionHealth";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

export default function App() {
  return (
    <Routes>
      {/* Public — redirect to /dashboard if already logged in */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/public-docs" element={<PublicDocs />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="provider-configs" element={<ProviderConfigs />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="session-health" element={<SessionHealth />} />
          <Route path="messages" element={<Messages />} />
          <Route path="events" element={<Events />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="templates" element={<Templates />} />
          <Route path="scheduled" element={<ScheduledMessages />} />
          <Route path="auto-reply" element={<AutoReply />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="team" element={<Team />} />
        </Route>
      </Route>
    </Routes>
  );
}
