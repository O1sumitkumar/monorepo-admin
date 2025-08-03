import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./DataTable";
import { applicationsAPI } from "../services/api";

interface Application {
  id: string;
  name: string;
  applicationId: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    applicationId: "",
    description: "",
    status: "active",
  });

  // Load applications from API
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationsAPI.getAll();
        // Handle new API response format: { success: true, data: [...], message: "..." }
        const applicationsData = response.data.success
          ? response.data.data
          : response.data;

        // Map to expected format
        const mappedApplications = (applicationsData || []).map((app: any) => ({
          id: app.id,
          name: app.name,
          applicationId: app.applicationId,
          description: app.description,
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        }));

        setApplications(mappedApplications);
      } catch (error) {
        console.error("Failed to load applications:", error);
        toast.error("Failed to load applications");
        // Fallback to mock data if API fails
        const mockApplications: Application[] = [
          {
            id: "app-001",
            name: "APP-X",
            applicationId: "app-x",
            description: "User Management System",
            status: "active",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
          },
          {
            id: "app-002",
            name: "APP-Y",
            applicationId: "app-y",
            description: "Analytics Platform",
            status: "active",
            createdAt: "2024-01-16T10:00:00Z",
            updatedAt: "2024-01-16T10:00:00Z",
          },
          {
            id: "app-003",
            name: "APP-Z",
            applicationId: "app-z",
            description: "Communication System",
            status: "active",
            createdAt: "2024-01-17T10:00:00Z",
            updatedAt: "2024-01-17T10:00:00Z",
          },
        ];
        setApplications(mockApplications);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const handleAddApplication = async () => {
    if (!formData.name || !formData.applicationId) {
      toast.error("Name and Application ID are required!");
      return;
    }

    try {
      const response = await applicationsAPI.create(formData);
      const newApp = response.data.success ? response.data.data : response.data;
      setApplications([...applications, newApp]);
      setFormData({
        name: "",
        applicationId: "",
        description: "",
        status: "active",
      });
      setShowAddModal(false);
      toast.success("Application added successfully!");
    } catch (error) {
      console.error("Failed to add application:", error);
      toast.error("Failed to add application");
    }
  };

  const handleEditApplication = async (application: Application) => {
    setEditingApp(application);
    setFormData({
      name: application.name,
      applicationId: application.applicationId,
      description: application.description,
      status: application.status,
    });
    setShowAddModal(true);
  };

  const handleUpdateApplication = async () => {
    if (!editingApp || !formData.name || !formData.applicationId) {
      toast.error("Name and Application ID are required!");
      return;
    }

    try {
      const response = await applicationsAPI.update(editingApp.id, formData);
      const updatedApp = response.data.success
        ? response.data.data
        : response.data;
      setApplications(
        applications.map((app) => (app.id === editingApp.id ? updatedApp : app))
      );
      setFormData({
        name: "",
        applicationId: "",
        description: "",
        status: "active",
      });
      setEditingApp(null);
      setShowAddModal(false);
      toast.success("Application updated successfully!");
    } catch (error) {
      console.error("Failed to update application:", error);
      toast.error("Failed to update application");
    }
  };

  const handleDeleteApplication = async (application: Application) => {
    if (!confirm(`Are you sure you want to delete ${application.name}?`)) {
      return;
    }

    try {
      await applicationsAPI.delete(application.id);
      setApplications(applications.filter((app) => app.id !== application.id));
      toast.success("Application deleted successfully!");
    } catch (error) {
      console.error("Failed to delete application:", error);
      toast.error("Failed to delete application");
    }
  };

  const handleStatusToggle = async (application: Application) => {
    try {
      const response = await applicationsAPI.toggleStatus(application.id);
      const updatedApp = response.data.success
        ? response.data.data
        : response.data;
      setApplications(
        applications.map((app) =>
          app.id === application.id ? updatedApp : app
        )
      );
      toast.success(
        `Application ${
          updatedApp.status === "active" ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      console.error("Failed to toggle application status:", error);
      toast.error("Failed to toggle application status");
    }
  };

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {row.getValue("description")}
        </div>
      ),
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
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.getValue("updatedAt")).toLocaleDateString()}
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
          <h1>Applications</h1>
          <p>Manage your application integrations and permissions</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEditApplication}
        onDelete={handleDeleteApplication}
        addButtonText="Add Application"
        searchPlaceholder="Search applications..."
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingApp ? "Edit Application" : "Add New Application"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingApp(null);
                  setFormData({
                    name: "",
                    applicationId: "",
                    description: "",
                    status: "active",
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Application Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter application name"
                />
              </div>
              <div className="form-group">
                <label>Application ID *</label>
                <input
                  type="text"
                  value={formData.applicationId}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationId: e.target.value })
                  }
                  placeholder="Enter application ID"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description"
                  rows={3}
                />
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
                  setEditingApp(null);
                  setFormData({
                    name: "",
                    applicationId: "",
                    description: "",
                    status: "active",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={
                  editingApp ? handleUpdateApplication : handleAddApplication
                }
              >
                {editingApp ? "Update" : "Add"} Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
