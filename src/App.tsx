import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProviderConfigs from "./pages/ProviderConfigs";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Events from "./pages/Events";
import Docs from "./pages/Docs";
import ApiKeys from "./pages/ApiKeys";
import Webhooks from "./pages/Webhooks";
import Templates from "./pages/Templates";
import ScheduledMessages from "./pages/ScheduledMessages";
import AutoReply from "./pages/AutoReply";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="provider-configs" element={<ProviderConfigs />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="messages" element={<Messages />} />
          <Route path="events" element={<Events />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="templates" element={<Templates />} />
          <Route path="scheduled" element={<ScheduledMessages />} />
          <Route path="auto-reply" element={<AutoReply />} />
          <Route path="docs" element={<Docs />} />
        </Route>
      </Route>
    </Routes>
  );
}
