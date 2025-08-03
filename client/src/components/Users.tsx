import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./DataTable";
import { usersAPI } from "../services/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user" | "manager";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
  });

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getAll();
        // Handle new API response format: { success: true, data: [...], message: "..." }
        const usersData = response.data.success
          ? response.data.data
          : response.data;

        // Map to expected format
        const mappedUsers = (usersData || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

        setUsers(mappedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load users");
        // Fallback to mock data if API fails
        const mockUsers: User[] = [
          {
            id: "user-001",
            username: "admin",
            email: "admin@app-admin.com",
            role: "admin",
            status: "active",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
          },
          {
            id: "user-002",
            username: "john_doe",
            email: "john@example.com",
            role: "user",
            status: "active",
            createdAt: "2024-01-16T10:00:00Z",
            updatedAt: "2024-01-16T10:00:00Z",
          },
          {
            id: "user-003",
            username: "jane_smith",
            email: "jane@example.com",
            role: "manager",
            status: "active",
            createdAt: "2024-01-17T10:00:00Z",
            updatedAt: "2024-01-17T10:00:00Z",
          },
        ];
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleAddUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Username, email, and password are required!");
      return;
    }

    try {
      const response = await usersAPI.create(formData);
      const newUser = response.data.success
        ? response.data.data
        : response.data;
      setUsers([...users, newUser]);
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        status: "active",
      });
      setShowAddModal(false);
      toast.success("User added successfully!");
    } catch (error) {
      console.error("Failed to add user:", error);
      toast.error("Failed to add user");
    }
  };

  const handleEditUser = async (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setShowAddModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !formData.username || !formData.email) {
      toast.error("Username and email are required!");
      return;
    }

    try {
      const response = await usersAPI.update(editingUser.id, formData);
      const updatedUser = response.data.success
        ? response.data.data
        : response.data;
      setUsers(
        users.map((user) => (user.id === editingUser.id ? updatedUser : user))
      );
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        status: "active",
      });
      setEditingUser(null);
      setShowAddModal(false);
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.username}?`)) {
      return;
    }

    try {
      await usersAPI.delete(user.id);
      setUsers(users.filter((u) => u.id !== user.id));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      const response = await usersAPI.update(user.id, {
        ...user,
        status: newStatus,
      });
      const updatedUser = response.data.success
        ? response.data.data
        : response.data;
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      toast.success(`User ${newStatus} successfully!`);
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`status-badge ${status}`}
            onClick={() => handleStatusToggle(row.original)}
            style={{ cursor: "pointer" }}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-header">
        <div className="header-left">
          <h1>Users</h1>
          <p>Manage system users and their roles</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        addButtonText="Add User"
        searchPlaceholder="Search users..."
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    role: "user",
                    status: "active",
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>
              <div className="form-group">
                <label>
                  {editingUser
                    ? "Password (leave blank to keep current)"
                    : "Password *"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    editingUser ? "Enter new password" : "Enter password"
                  }
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "user" | "manager",
                    })
                  }
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    role: "user",
                    status: "active",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={editingUser ? handleUpdateUser : handleAddUser}
              >
                {editingUser ? "Update" : "Add"} User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
