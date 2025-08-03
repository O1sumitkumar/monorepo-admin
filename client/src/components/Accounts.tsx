import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./DataTable";
import { accountsAPI } from "../services/api";
import type { Account } from "../services/api";

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    accountId: "",
    email: "",
    description: "",
    accountType: "Personal" as Account["accountType"],
    status: "active" as Account["status"],
  });

  const [sharingData, setSharingData] = useState({
    sharedAccounts: [] as string[],
  });

  const availableUsers = [
    { id: "user-001", name: "John Doe" },
    { id: "user-002", name: "Jane Smith" },
    { id: "user-003", name: "Bob Johnson" },
  ];

  // Load accounts from API
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        const response = await accountsAPI.getAll();
        // Handle new API response format: { success: true, data: [...], message: "..." }
        const accountsData = response.data.success
          ? response.data.data
          : response.data;

        // Map to expected format
        const mappedAccounts = (
          Array.isArray(accountsData) ? accountsData : []
        ).map((account: any) => ({
          id: account.id,
          name: account.name,
          accountId: account.accountId,
          email: account.email,
          description: account.description,
          accountType: account.accountType || "Personal",
          status: account.status || "active",
          sharedAccounts: account.sharedAccounts || [],
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        }));

        setAccounts(mappedAccounts);
      } catch (error) {
        console.error("Failed to load accounts:", error);
        toast.error("Failed to load accounts");
        // Fallback to mock data if API fails
        const mockAccounts: Account[] = [
          {
            id: "acc-001",
            name: "John Doe",
            accountId: "john-doe-001",
            email: "john@example.com",
            description: "Personal account for John Doe",
            accountType: "Personal",
            status: "active",
            sharedAccounts: ["user-002"],
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
          },
          {
            id: "acc-002",
            name: "Jane Smith",
            accountId: "jane-smith-001",
            email: "jane@example.com",
            description: "Personal account for Jane Smith",
            accountType: "Personal",
            status: "active",
            sharedAccounts: [],
            createdAt: "2024-01-16T10:00:00Z",
            updatedAt: "2024-01-16T10:00:00Z",
          },
          {
            id: "acc-003",
            name: "Acme Corp",
            accountId: "acme-corp-001",
            email: "admin@acme.com",
            description: "Business account for Acme Corporation",
            accountType: "Business",
            status: "active",
            sharedAccounts: ["user-001", "user-002"],
            createdAt: "2024-01-17T10:00:00Z",
            updatedAt: "2024-01-17T10:00:00Z",
          },
        ];
        setAccounts(mockAccounts);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const handleAddAccount = async () => {
    try {
      const response = await accountsAPI.create(formData);
      const newAccount = response.data?.data;
      if (newAccount) {
        setAccounts((prev) => [newAccount, ...prev]);
        toast.success("Account created successfully");
        setShowAddModal(false);
        setFormData({
          name: "",
          accountId: "",
          email: "",
          description: "",
          accountType: "Personal",
          status: "active",
        });
      }
    } catch (error) {
      console.error("Failed to create account:", error);
      toast.error("Failed to create account");
    }
  };

  const handleEditAccount = async (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      accountId: account.accountId,
      email: account.email || "",
      description: account.description || "",
      accountType: account.accountType,
      status: account.status,
    });
    setShowAddModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    try {
      const response = await accountsAPI.update(editingAccount.id, formData);
      const updatedAccount = response.data?.data;
      if (updatedAccount) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === editingAccount.id ? updatedAccount : acc
          )
        );
        toast.success("Account updated successfully");
        setShowAddModal(false);
        setEditingAccount(null);
        setFormData({
          name: "",
          accountId: "",
          email: "",
          description: "",
          accountType: "Personal",
          status: "active",
        });
      }
    } catch (error) {
      console.error("Failed to update account:", error);
      toast.error("Failed to update account");
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete ${account.name}?`)) {
      try {
        await accountsAPI.delete(account.id);
        setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
        toast.success("Account deleted successfully");
      } catch (error) {
        console.error("Failed to delete account:", error);
        toast.error("Failed to delete account");
      }
    }
  };

  const handleViewAccount = (account: Account) => {
    setSelectedAccount(account);
    setSharingData({
      sharedAccounts: account.sharedAccounts,
    });
    setShowSharingModal(true);
  };

  const handleShareAccount = async () => {
    if (!selectedAccount) return;

    try {
      // For now, just update the local state
      // In a real implementation, you would call the API
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === selectedAccount.id
            ? { ...acc, sharedAccounts: sharingData.sharedAccounts }
            : acc
        )
      );
      toast.success("Account sharing updated successfully");
      setShowSharingModal(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error("Failed to update account sharing:", error);
      toast.error("Failed to update account sharing");
    }
  };

  const handleUserToggle = (userId: string) => {
    setSharingData((prev) => ({
      ...prev,
      sharedAccounts: prev.sharedAccounts.includes(userId)
        ? prev.sharedAccounts.filter((id) => id !== userId)
        : [...prev.sharedAccounts, userId],
    }));
  };

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "accountId",
      header: "Account ID",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">{row.getValue("accountId")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return (
          <div className="text-sm text-gray-500">{email || "No email"}</div>
        );
      },
    },
    {
      accessorKey: "accountType",
      header: "Type",
      cell: ({ row }) => {
        const type = (row.getValue("accountType") as string) || "Personal";
        return (
          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
            {type}
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
            className={`inline-block px-2 py-1 text-xs rounded ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "sharedAccounts",
      header: "Shared With",
      cell: ({ row }) => {
        const sharedWith = row.getValue("sharedAccounts") as string[];
        return (
          <div className="text-sm text-gray-500">
            {sharedWith.length > 0 ? (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {sharedWith.length} user{sharedWith.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-gray-400">Not shared</span>
            )}
          </div>
        );
      },
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
          <h1>Accounts</h1>
          <p>Manage user accounts and sharing permissions</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEditAccount}
        onDelete={handleDeleteAccount}
        onView={handleViewAccount}
        addButtonText="Add Account"
        searchPlaceholder="Search accounts..."
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingAccount ? "Edit Account" : "Add New Account"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAccount(null);
                  setFormData({
                    name: "",
                    accountId: "",
                    email: "",
                    description: "",
                    accountType: "Personal",
                    status: "active",
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter account name"
                />
              </div>
              <div className="form-group">
                <label>Account ID</label>
                <input
                  type="text"
                  value={formData.accountId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })
                  }
                  placeholder="Enter account ID"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter account email"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter account description"
                />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountType: e.target.value as Account["accountType"],
                    })
                  }
                >
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Account["status"],
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
                  setEditingAccount(null);
                  setFormData({
                    name: "",
                    accountId: "",
                    email: "",
                    description: "",
                    accountType: "Personal",
                    status: "active",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={
                  editingAccount ? handleUpdateAccount : handleAddAccount
                }
              >
                {editingAccount ? "Update" : "Add"} Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sharing Modal */}
      {showSharingModal && selectedAccount && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Share Account: {selectedAccount.name}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowSharingModal(false);
                  setSelectedAccount(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Share with Users</label>
                <div className="users-list">
                  {availableUsers.map((user) => (
                    <label key={user.id} className="user-checkbox">
                      <input
                        type="checkbox"
                        checked={sharingData.sharedAccounts.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                      />
                      {user.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowSharingModal(false);
                  setSelectedAccount(null);
                }}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleShareAccount}>
                Update Sharing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
