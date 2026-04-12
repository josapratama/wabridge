import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import PublicDocs from "./pages/PublicDocs";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import ProviderConfigs from "./pages/ProviderConfigs";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Events from "./pages/Events";
import ApiKeys from "./pages/ApiKeys";
import Webhooks from "./pages/Webhooks";
import Templates from "./pages/Templates";
import ScheduledMessages from "./pages/ScheduledMessages";
import AutoReply from "./pages/AutoReply";
import Analytics from "./pages/Analytics";
import Contacts from "./pages/Contacts";
import Broadcast from "./pages/Broadcast";
import Team from "./pages/Team";
import SessionHealth from "./pages/SessionHealth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/public-docs" element={<PublicDocs />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
