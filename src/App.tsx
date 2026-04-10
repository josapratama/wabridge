import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProviderConfigs from "./pages/ProviderConfigs";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Events from "./pages/Events";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="provider-configs" element={<ProviderConfigs />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="messages" element={<Messages />} />
        <Route path="events" element={<Events />} />
      </Route>
    </Routes>
  );
}
