import { useEffect, useState } from "react";
import { teamApi, TeamMember } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Users2, Plus, X, Check, RefreshCw, Trash2 } from "lucide-react";

const ROLES = ["admin", "operator", "viewer"] as const;
const roleColor: Record<string, string> = {
  admin: "text-red-400 bg-red-900/20 border-red-800/40",
  operator: "text-yellow-400 bg-yellow-900/20 border-yellow-800/40",
  viewer: "text-gray-400 bg-gray-800 border-gray-700",
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    role: "operator" as TeamMember["role"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await teamApi.list();
    if (res.data) setMembers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await teamApi.invite(form.email, form.role);
    if (res.success) {
      setShowForm(false);
      setForm({ email: "", role: "operator" });
      await load();
    } else setError(res.message);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await teamApi.remove(id);
    setDeleteId(null);
    await load();
  };

  const handleRoleChange = async (id: string, role: string) => {
    await teamApi.updateRole(id, role);
    await load();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-brand-400" />
            Team
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage team members and roles
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="card p-4 flex gap-6">
        {ROLES.map((role) => (
          <div key={role} className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded border font-medium ${roleColor[role]}`}
            >
              {role}
            </span>
            <span className="text-xs text-gray-500">
              {role === "admin"
                ? "Full access"
                : role === "operator"
                  ? "Send messages"
                  : "View only"}
            </span>
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Invite Team Member
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={(e) => void handleInvite(e)} className="space-y-3">
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="member@example.com"
                />
                <p className="text-xs text-gray-600 mt-1">
                  User must already have an account
                </p>
              </div>
              <div>
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as TeamMember["role"],
                    })
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? "Inviting…" : "Invite"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Remove Member?</p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No team members"
            description="Invite team members to collaborate."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Invite Member
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Member
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Invited
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-200">
                      {m.memberName ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">{m.memberEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        void handleRoleChange(m.id, e.target.value)
                      }
                      className={`text-xs px-2 py-1 rounded border font-medium bg-transparent cursor-pointer ${roleColor[m.role]}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {new Date(m.invitedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(m.id)}
                      className="btn-danger text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
