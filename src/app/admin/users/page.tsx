"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const [changePasswordId, setChangePasswordId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin-users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreatingUser(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: createEmail, password: createPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      setCreateEmail("");
      setCreatePassword("");
      setSuccessMessage("User created successfully");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;

    setError("");
    try {
      const res = await fetch(`/api/admin-users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      setSuccessMessage("User deleted successfully");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/admin-users/${changePasswordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }

      setChangePasswordId("");
      setNewPassword("");
      setSuccessMessage("Password updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return <div className="text-neutral-600">Loading users...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide">Admin Users</h1>
        <p className="mt-2 text-neutral-600">Manage admin accounts</p>
      </div>

      {error && (
        <div className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {successMessage && (
        <div className="rounded bg-green-50 px-4 py-3 text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {/* Create User Form */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-serif text-xl font-light">Add New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              required
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              required
              className="input-base"
            />
          </div>
          <button type="submit" disabled={creatingUser} className="btn-primary">
            {creatingUser ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-serif text-xl font-light">Current Users</h2>
        {users.length === 0 ? (
          <p className="text-neutral-600">No users found</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded border border-neutral-100 bg-neutral-50 p-4"
              >
                <div>
                  <p className="font-medium text-neutral-900">{user.email}</p>
                  <p className="text-sm text-neutral-500">
                    Created {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChangePasswordId(user.id)}
                    className="btn-secondary text-sm"
                  >
                    Change Password
                  </button>
                  {session?.user?.id !== user.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="rounded bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {changePasswordId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-serif text-lg font-light">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium">
                  New Password (min 8 characters)
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input-base"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={changingPassword} className="btn-primary flex-1">
                  {changingPassword ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordId("");
                    setNewPassword("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
