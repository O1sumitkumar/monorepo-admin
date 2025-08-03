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
        console.log("=== RAW API RESPONSE ===");
        console.log("Response:", response);
        console.log("Response.data:", response.data);

        // Handle new API response format: { success: true, data: [...], message: "..." }
        const accountsData = response.data.success
          ? response.data.data
          : response.data;

        console.log("Accounts data:", accountsData);

        // Map to expected format
        const mappedAccounts = (
          Array.isArray(accountsData) ? accountsData : []
        ).map(
          (account: {
            id: string;
            name: string;
            accountId: string;
            email?: string;
            description?: string;
            accountType?: string;
            status?: string;
            sharedAccounts?: string[];
            createdAt: string;
            updatedAt: string;
          }) => {
            console.log(
              "Processing account:",
              account.name,
              "sharedAccounts:",
              account.sharedAccounts
            );
            return {
              id: account.id,
              name: account.name,
              accountId: account.accountId,
              email: account.email,
              description: account.description,
              accountType:
                (account.accountType as
                  | "Personal"
                  | "Temporary"
                  | "Business") || "Personal",
              status: (account.status as "active" | "inactive") || "active",
              sharedAccounts: account.sharedAccounts || [],
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            };
          }
        );

        console.log("Final mapped accounts:", mappedAccounts);
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
    console.log("=== OPENING SHARE MODAL ===");
    console.log("Account:", account);
    console.log("Account sharedAccounts:", account.sharedAccounts);
    console.log("Available users:", availableUsers);

    // Verify the account has sharedAccounts field
    if (!account.sharedAccounts) {
      console.warn("⚠️ Account missing sharedAccounts field:", account);
    }

    setSelectedAccount(account);
    setSharingData({
      sharedAccounts: account.sharedAccounts || [],
    });
    setShowSharingModal(true);
  };

  // Reset sharing data when modal opens
  useEffect(() => {
    if (showSharingModal && selectedAccount) {
      console.log("=== MODAL OPENED ===");
      console.log("Selected account:", selectedAccount);
      console.log(
        "Selected account sharedAccounts:",
        selectedAccount.sharedAccounts
      );
      console.log("Current sharingData:", sharingData);

      const initialSharedAccounts = selectedAccount.sharedAccounts || [];
      console.log("Setting initial sharedAccounts:", initialSharedAccounts);

      setSharingData({
        sharedAccounts: initialSharedAccounts,
      });
    }
  }, [showSharingModal, selectedAccount]);

  const handleShareAccount = async () => {
    if (!selectedAccount) return;

    console.log("=== SHARING ACCOUNT ===");
    console.log("Selected account:", selectedAccount);
    console.log("Sharing data:", sharingData);
    console.log("API call payload:", {
      sharedAccounts: sharingData.sharedAccounts,
    });

    try {
      // Call the API to update account sharing
      const response = await accountsAPI.update(selectedAccount.id, {
        sharedAccounts: sharingData.sharedAccounts,
      });

      console.log("API response:", response);
      console.log("Response data:", response.data);

      if (response.data.success) {
        // Update local state with the response from API
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
      } else {
        console.error("API returned success: false");
        console.error("API error:", response.data);
        toast.error("Failed to update account sharing");
      }
    } catch (error) {
      console.error("=== SHARING ERROR ===");
      console.error("Error object:", error);
      const axiosError = error as {
        response?: { data?: unknown; status?: number };
      };
      console.error("Error response:", axiosError.response);
      console.error("Error data:", axiosError.response?.data);
      console.error("Error status:", axiosError.response?.status);
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
        const getTypeClass = (type: string) => {
          switch (type.toLowerCase()) {
            case "business":
              return "chip-badge chip-type-business";
            case "personal":
              return "chip-badge chip-type-personal";
            case "temporary":
              return "chip-badge chip-type-temporary";
            default:
              return "chip-badge chip-type-personal";
          }
        };
        return <span className={getTypeClass(type)}>{type}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "active";
        const getStatusClass = (status: string) => {
          switch (status.toLowerCase()) {
            case "active":
              return "chip-badge chip-status-active";
            case "inactive":
              return "chip-badge chip-status-inactive";
            case "pending":
              return "chip-badge chip-status-pending";
            default:
              return "chip-badge chip-status-active";
          }
        };
        return <span className={getStatusClass(status)}>{status}</span>;
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
              <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded">
                {sharedWith.length} user{sharedWith.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 rounded">
                Not shared
              </span>
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
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={() => {
              console.log("Current accounts state:", accounts);
              console.log("Available users:", availableUsers);
            }}
            style={{ marginRight: "10px" }}
          >
            Debug Info
          </button>
          <button
            className="refresh-btn"
            onClick={() => {
              // Test with the first account that has sharing data
              const testAccount = accounts.find(
                (acc) => acc.sharedAccounts && acc.sharedAccounts.length > 0
              );
              if (testAccount) {
                console.log("Testing share modal with:", testAccount);
                handleViewAccount(testAccount);
              } else {
                console.log("No accounts with sharing data found");
              }
            }}
            style={{ marginRight: "10px" }}
          >
            Test Share Modal
          </button>
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
          <div className="modal" key={`share-modal-${selectedAccount.id}`}>
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
                  {availableUsers.map((user) => {
                    const isShared = sharingData.sharedAccounts.includes(
                      user.id
                    );
                    console.log(`🔍 Checkbox for ${user.name} (${user.id}):`);
                    console.log(
                      `  - sharingData.sharedAccounts:`,
                      sharingData.sharedAccounts
                    );
                    console.log(`  - user.id: ${user.id}`);
                    console.log(
                      `  - includes check: ${sharingData.sharedAccounts.includes(
                        user.id
                      )}`
                    );
                    console.log(`  - isShared: ${isShared}`);
                    return (
                      <label key={user.id} className="user-checkbox">
                        <input
                          type="checkbox"
                          checked={isShared}
                          onChange={() => handleUserToggle(user.id)}
                        />
                        <span style={{ marginLeft: "8px" }}>
                          {user.name}{" "}
                          {isShared && (
                            <span
                              style={{ color: "green", fontWeight: "bold" }}
                            >
                              ✓
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div
                  style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}
                >
                  Currently shared with: {sharingData.sharedAccounts.length}{" "}
                  user(s)
                </div>
                {selectedAccount && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px",
                      backgroundColor: "#f0f8ff",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <strong>Summary:</strong> This account will be shared with{" "}
                    {sharingData.sharedAccounts.length} user(s)
                    {sharingData.sharedAccounts.length > 0 && (
                      <div style={{ marginTop: "4px" }}>
                        Users:{" "}
                        {sharingData.sharedAccounts
                          .map((userId) => {
                            const user = availableUsers.find(
                              (u) => u.id === userId
                            );
                            return user ? user.name : userId;
                          })
                          .join(", ")}
                      </div>
                    )}
                  </div>
                )}
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
