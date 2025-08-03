import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./DataTable";
import { rightsAPI, applicationsAPI, accountsAPI } from "../services/api";
import type { RootState } from "../store";

interface Right {
  id: string;
  applicationId: string;
  applicationName: string;
  accountId: string;
  accountName: string;
  permissions: string[];
  expiresAt: string | null;
  status: "active" | "inactive" | "expired";
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

interface Account {
  id: string;
  name: string;
  email?: string;
  status: "active" | "inactive";
}

const Rights = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [rights, setRights] = useState<Right[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRight, setEditingRight] = useState<Right | null>(null);
  const [availableApplications, setAvailableApplications] = useState<
    Application[]
  >([]);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [formData, setFormData] = useState({
    applicationId: "",
    accountId: "",
    permissions: [] as string[],
    expiresAt: "",
  });

  // Load applications from API
  useEffect(() => {
    const loadApplications = async () => {
      // Only load if authenticated
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping applications load");
        return;
      }

      try {
        setLoadingApplications(true);
        console.log("Loading applications from API...");
        const response = await applicationsAPI.getAll();
        console.log("Applications API response:", response);
        // Handle new API response format: { success: true, data: [...], message: "..." }
        const applicationsData = response.data.success
          ? response.data.data
          : response.data;
        setAvailableApplications(applicationsData || []);
        console.log("Applications loaded:", applicationsData);
      } catch (error: any) {
        console.error("Failed to load applications:", error);
        console.error("Error details:", error.response?.data);
        toast.error("Failed to load applications");
        // Fallback to mock data if API fails
        setAvailableApplications([
          { id: "app-001", name: "APP-X", status: "active" },
          { id: "app-002", name: "APP-Y", status: "active" },
          { id: "app-003", name: "APP-Z", status: "active" },
        ]);
      } finally {
        setLoadingApplications(false);
      }
    };

    loadApplications();
  }, [isAuthenticated]);

  // Load accounts from API
  useEffect(() => {
    const loadAccounts = async () => {
      // Only load if authenticated
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping accounts load");
        return;
      }

      try {
        setLoadingAccounts(true);
        const response = await accountsAPI.getAll();
        // Handle new API response format: { success: true, data: [...], message: "..." }
        const accountsData = response.data.success
          ? response.data.data
          : response.data;
        setAvailableAccounts(accountsData || []);
      } catch (error: any) {
        console.error("Failed to load accounts:", error);
        toast.error("Failed to load accounts");
        // Fallback to mock data if API fails
        setAvailableAccounts([
          { id: "acc-001", name: "John Doe", status: "active" },
          { id: "acc-002", name: "Jane Smith", status: "active" },
          { id: "acc-003", name: "Bob Johnson", status: "active" },
        ]);
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [isAuthenticated]);

  // Load rights from API
  useEffect(() => {
    const loadRights = async () => {
      // Only load if authenticated
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping rights load");
        return;
      }

      try {
        setLoading(true);
        const response = await rightsAPI.getAll();
        // Handle new API response format: { success: true, data: [...], message: "..." }
        const rightsData = response.data.success
          ? response.data.data
          : response.data;

        // Parse permissions JSON string and map to expected format
        const mappedRights = (rightsData || []).map((right: any) => ({
          id: right.id,
          applicationId: right.applicationId,
          applicationName: right.applicationName,
          accountId: right.accountId,
          accountName: right.accountName,
          permissions:
            typeof right.permissions === "string"
              ? JSON.parse(right.permissions)
              : right.permissions,
          expiresAt: right.expiresAt,
          status: right.status,
          createdAt: right.createdAt,
          updatedAt: right.updatedAt,
        }));

        setRights(mappedRights);
      } catch (error: any) {
        console.error("Failed to load rights:", error);
        toast.error("Failed to load rights");
        // Fallback to mock data if API fails
        const mockRights: Right[] = [
          {
            id: "right-001",
            applicationId: "app-001",
            applicationName: "APP-X",
            accountId: "acc-001",
            accountName: "John Doe",
            permissions: ["read", "write"],
            expiresAt: "2024-12-31T23:59:59Z",
            status: "active",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
          },
          {
            id: "right-002",
            applicationId: "app-002",
            applicationName: "APP-Y",
            accountId: "acc-002",
            accountName: "Jane Smith",
            permissions: ["read", "write", "delete"],
            expiresAt: "2024-06-30T23:59:59Z",
            status: "active",
            createdAt: "2024-01-16T10:00:00Z",
            updatedAt: "2024-01-16T10:00:00Z",
          },
          {
            id: "right-003",
            applicationId: "app-003",
            applicationName: "APP-Z",
            accountId: "acc-003",
            accountName: "Bob Johnson",
            permissions: ["read"],
            expiresAt: null,
            status: "active",
            createdAt: "2024-01-17T10:00:00Z",
            updatedAt: "2024-01-17T10:00:00Z",
          },
        ];
        setRights(mockRights);
      } finally {
        setLoading(false);
      }
    };

    loadRights();
  }, [isAuthenticated]);

  const handleAddRight = async () => {
    if (
      !formData.applicationId ||
      !formData.accountId ||
      formData.permissions.length === 0
    ) {
      toast.error(
        "Application, Account, and at least one permission are required!"
      );
      return;
    }

    try {
      const response = await rightsAPI.create(formData);
      const newRight = response.data.success
        ? response.data.data
        : response.data;
      // Parse permissions if it's a JSON string
      if (typeof newRight.permissions === "string") {
        newRight.permissions = JSON.parse(newRight.permissions);
      }
      setRights([...rights, newRight]);
      setFormData({
        applicationId: "",
        accountId: "",
        permissions: [],
        expiresAt: "",
      });
      setShowAddModal(false);
      toast.success("Right added successfully!");
    } catch (error) {
      console.error("Failed to add right:", error);
      toast.error("Failed to add right");
    }
  };

  const handleEditRight = async (right: Right) => {
    setEditingRight(right);
    setFormData({
      applicationId: right.applicationId,
      accountId: right.accountId,
      permissions: right.permissions,
      expiresAt: right.expiresAt ? right.expiresAt.split("T")[0] : "",
    });
    setShowAddModal(true);
  };

  const handleUpdateRight = async () => {
    if (
      !editingRight ||
      !formData.applicationId ||
      !formData.accountId ||
      formData.permissions.length === 0
    ) {
      toast.error(
        "Application, Account, and at least one permission are required!"
      );
      return;
    }

    try {
      const response = await rightsAPI.update(editingRight.id, formData);
      const updatedRight = response.data.success
        ? response.data.data
        : response.data;
      // Parse permissions if it's a JSON string
      if (typeof updatedRight.permissions === "string") {
        updatedRight.permissions = JSON.parse(updatedRight.permissions);
      }
      setRights(
        rights.map((right) =>
          right.id === editingRight.id ? updatedRight : right
        )
      );
      setFormData({
        applicationId: "",
        accountId: "",
        permissions: [],
        expiresAt: "",
      });
      setEditingRight(null);
      setShowAddModal(false);
      toast.success("Right updated successfully!");
    } catch (error) {
      console.error("Failed to update right:", error);
      toast.error("Failed to update right");
    }
  };

  const handleDeleteRight = async (right: Right) => {
    if (
      !confirm(
        `Are you sure you want to delete this right for ${right.applicationName}?`
      )
    ) {
      return;
    }

    try {
      await rightsAPI.delete(right.id);
      setRights(rights.filter((r) => r.id !== right.id));
      toast.success("Right deleted successfully!");
    } catch (error) {
      console.error("Failed to delete right:", error);
      toast.error("Failed to delete right");
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleRefreshData = async () => {
    try {
      toast.loading("Refreshing data...");

      // Refresh applications
      const applicationsResponse = await applicationsAPI.getAll();
      const applicationsData = applicationsResponse.data.success
        ? applicationsResponse.data.data
        : applicationsResponse.data;
      setAvailableApplications(applicationsData || []);

      // Refresh accounts
      const accountsResponse = await accountsAPI.getAll();
      const accountsData = accountsResponse.data.success
        ? accountsResponse.data.data
        : accountsResponse.data;
      setAvailableAccounts(accountsData || []);

      // Refresh rights
      const rightsResponse = await rightsAPI.getAll();
      const rightsData = rightsResponse.data.success
        ? rightsResponse.data.data
        : rightsResponse.data;
      const mappedRights = (rightsData || []).map((right: any) => ({
        id: right.id,
        applicationId: right.applicationId,
        applicationName: right.applicationName,
        accountId: right.accountId,
        accountName: right.accountName,
        permissions:
          typeof right.permissions === "string"
            ? JSON.parse(right.permissions)
            : right.permissions,
        expiresAt: right.expiresAt,
        status: right.status,
        createdAt: right.createdAt,
        updatedAt: right.updatedAt,
      }));
      setRights(mappedRights);

      toast.dismiss();
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.dismiss();
      toast.error("Failed to refresh data");
    }
  };

  const columns: ColumnDef<Right>[] = [
    {
      accessorKey: "applicationName",
      header: "Application",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("applicationName")}</div>
      ),
    },
    {
      accessorKey: "accountName",
      header: "Account",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("accountName")}</div>
      ),
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const permissions = row.getValue("permissions") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {permission}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => {
        const expiresAt = row.getValue("expiresAt") as string | null;
        return (
          <div className="text-sm text-gray-500">
            {expiresAt ? new Date(expiresAt).toLocaleDateString() : "Never"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <span className={`status-badge ${status}`}>{status}</span>;
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
          <h1>Rights Management</h1>
          <p>Manage user permissions and access rights</p>
        </div>
        <div className="header-right">
          <button className="refresh-btn" onClick={handleRefreshData}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rights}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEditRight}
        onDelete={handleDeleteRight}
        addButtonText="Add Right"
        searchPlaceholder="Search rights..."
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingRight ? "Edit Right" : "Add New Right"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRight(null);
                  setFormData({
                    applicationId: "",
                    accountId: "",
                    permissions: [],
                    expiresAt: "",
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Application *</label>
                <select
                  value={formData.applicationId}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationId: e.target.value })
                  }
                  disabled={loadingApplications}
                >
                  <option value="">
                    {loadingApplications
                      ? "Loading applications..."
                      : "Select Application"}
                  </option>
                  {availableApplications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
                {loadingApplications && (
                  <div className="text-sm text-gray-500 mt-1">
                    Loading applications from database...
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Account *</label>
                <select
                  value={formData.accountId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })
                  }
                  disabled={loadingAccounts}
                >
                  <option value="">
                    {loadingAccounts ? "Loading accounts..." : "Select Account"}
                  </option>
                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {loadingAccounts && (
                  <div className="text-sm text-gray-500 mt-1">
                    Loading accounts from database...
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Permissions *</label>
                <div className="permissions-grid">
                  {["read", "write", "delete", "admin"].map((permission) => (
                    <label key={permission} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                      {permission.charAt(0).toUpperCase() + permission.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Expires At</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRight(null);
                  setFormData({
                    applicationId: "",
                    accountId: "",
                    permissions: [],
                    expiresAt: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={editingRight ? handleUpdateRight : handleAddRight}
              >
                {editingRight ? "Update" : "Add"} Right
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rights;
