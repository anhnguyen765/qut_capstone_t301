"use client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active?: number;
};

export default function UsersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // Only fetch users if user is admin
    if (user?.role === 'admin') {
      fetch("/api/users")
        .then(res => res.json())
        .then(data => {
          setUsers(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [user]);

  // If not authenticated or not admin, show loading or redirect
  if (!isAuthenticated) {
    return <div className="p-8">Redirecting to login...</div>;
  }

  if (user?.role !== 'admin') {
    return <div className="p-8">Access denied. Redirecting...</div>;
  }

  const handleAddUser = async () => {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    setShowAddDialog(false);
    setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "user" });
    const updated = await fetch("/api/users").then(res => res.json());
    setUsers(Array.isArray(updated) ? updated : []);
  };

  const handleDisableUser = async (id: number) => {
    await fetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify({ is_active: false }) });
    setUsers(users.map(u => u.id === id ? { ...u, is_active: 0 } : u));
  };

  const handleDeleteUser = async (email: string) => {
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setUsers(users.filter(u => u.email !== email));
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  if (loading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <Button onClick={() => setShowAddDialog(true)}>Add User</Button>
      <table className="w-full mt-6 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Active</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.first_name} {u.last_name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.is_active ? "Yes" : "No"}</td>
              <td className="p-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDisableUser(u.id)} disabled={!u.is_active}>
                  Disable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUserToDelete(u);
                    setShowDeleteDialog(true);
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && userToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete User</h2>
            <p className="mb-6">
              Are you sure you want to delete <span className="font-semibold">{userToDelete.first_name} {userToDelete.last_name}</span> ({userToDelete.email})?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>No</Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(userToDelete.email)}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            <Input placeholder="First Name" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} className="mb-2" />
            <Input placeholder="Last Name" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} className="mb-2" />
            <Input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="mb-2" />
            <Input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="mb-2" />
            <label className="block mb-2 font-medium">Role</label>
            <select
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              className="mb-4 w-full border rounded p-2"
              aria-label="Select user role"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}