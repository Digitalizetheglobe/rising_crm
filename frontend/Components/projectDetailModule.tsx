import React, { useState, useEffect } from "react";
import Image from "next/image";
import { API_URL } from "../config/api.config";
import { getToken, getAuthHeaders, getStoredUser } from "../lib/auth";

const API_BASE = API_URL.replace(/\/api$/, "");

export interface MetaCampaign {
  campaignName: string;
  campaignId: string;
  adSetName: string;
  adSetId: string;
  adName: string;
  adId: string;
  formName: string;
  formId: string;
  platform: 'facebook' | 'instagram';
  isActive?: boolean;
}

export interface ProjectDetail {
  id: string;
  name: string;
  location: string;
  description: string;
  type: string;
  totalUnits: number;
  status: string;
  launchDate?: string;
  completionDate?: string;
  reraNumber?: string;
  amenities: string[];
  image: string | null;
  metaCampaigns?: MetaCampaign[];
}

interface ProjectDetailModuleProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetail | null;
  onSave?: (updated: ProjectDetail) => void;
  addToast: (message: string, type?: "success" | "info") => void;
}

const PROJECT_TYPES = [
  { value: "RESIDENTIAL", label: "Apartment complex" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed use" },
  { value: "PLOTTED", label: "Plotted development" },
];

const PROJECT_STATUSES = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Under construction" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On hold" },
];

const AMENITY_OPTIONS = [
  "Swimming pool",
  "Gym",
  "Club house",
  "Children play area",
  "Garden",
  "Food store",
  "Parking",
  "Security",
  "Power backup",
];

function Row({
  label,
  value,
  shade,
  isEditing,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  value?: string | number | React.ReactNode;
  shade: boolean;
  isEditing?: boolean;
  onChange?: (val: string) => void;
  type?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <tr style={{ background: shade ? "#f5f5f5" : "#ffffff" }}>
      <td
        style={{
          fontFamily: 'Calibri, "Segoe UI", sans-serif',
          fontSize: "12px",
          color: "#555",
          fontWeight: 600,
          padding: "5px 10px",
          border: "1px solid #d0d0d0",
          width: "38%",
          whiteSpace: "nowrap",
          background: shade ? "#e4e4e4" : "#efefef",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </td>
      <td
        style={{
          fontFamily: 'Calibri, "Segoe UI", sans-serif',
          fontSize: "12px",
          color: "#1a1a1a",
          padding: isEditing ? "2px 5px" : "5px 10px",
          border: "1px solid #d0d0d0",
        }}
      >
        {isEditing ? (
          options ? (
            <select
              value={String(value || "")}
              onChange={(e) => onChange?.(e.target.value)}
              style={{
                width: "100%",
                padding: "3px",
                border: "1px solid #ccc",
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
                fontSize: "12px",
              }}
            >
              <option value="">Select...</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value !== undefined ? String(value) : ""}
              onChange={(e) => onChange?.(e.target.value)}
              style={{
                width: "100%",
                padding: "3px",
                border: "1px solid #ccc",
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
                fontSize: "12px",
              }}
            />
          )
        ) : typeof value === "object" ? (
          value
        ) : (
          value || "—"
        )}
      </td>
    </tr>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <tr>
      <td
        colSpan={2}
        style={{
          fontFamily: 'Calibri, "Segoe UI", sans-serif',
          fontSize: "11px",
          fontWeight: 700,
          color: "#ffffff",
          background: "#C0272D",
          padding: "5px 10px",
          border: "1px solid #8a1a1e",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {icon}&nbsp;&nbsp;{title}
      </td>
    </tr>
  );
}

export default function ProjectDetailModule({
  isOpen,
  onClose,
  project,
  onSave,
  addToast,
}: ProjectDetailModuleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProjectDetail | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<MetaCampaign>>({});
  const [showCampaignForm, setShowCampaignForm] = useState(false);

  const user = getStoredUser();
  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "SALES_MANAGER";

  useEffect(() => {
    if (project) {
      // Format dates to YYYY-MM-DD for input field
      const formattedProject = {
        ...project,
        launchDate: project.launchDate ? project.launchDate.split("T")[0] : "",
        completionDate: project.completionDate ? project.completionDate.split("T")[0] : "",
      };
      setFormData(formattedProject);
      setImagePreview(project.image);
    }
    setIsEditing(false);
  }, [project, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof ProjectDetail, val: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: val } : prev));
  };

  const uploadProjectImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getToken();
    const res = await fetch(`${API_URL}/v1/uploads/single`, {
      method: "POST",
      headers: {
        Authorization: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "",
      },
      body: formData,
    });
    const json = await res.json();
    if (!json.success || !json.data?.path) {
      throw new Error(json.message || "Failed to upload image");
    }
    return `${API_BASE}${json.data.path}`;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file", "info");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);

    try {
      const url = await uploadProjectImage(file);
      handleChange("image", url);
      addToast("Project photo uploaded successfully", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      addToast(message, "info");
      setImagePreview(formData.image);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      if (isUploadingImage) {
        addToast("Please wait for the image upload to finish", "info");
        return;
      }
      if (!formData.name.trim() || !formData.location.trim() || !formData.totalUnits) {
        addToast("Please fill all required fields", "info");
        return;
      }
      if (formData.launchDate && formData.completionDate && formData.completionDate <= formData.launchDate) {
        addToast("Completion date must be after launch date", "info");
        return;
      }

      if (onSave) {
        onSave(formData);
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    handleChange("amenities", updatedAmenities);
  };

  const addCampaign = () => {
    if (!newCampaign.campaignName || !newCampaign.campaignId || !newCampaign.adId || !newCampaign.platform) {
      addToast("Please fill all required campaign fields", "info");
      return;
    }
    const current = formData.metaCampaigns || [];
    handleChange("metaCampaigns", [
      ...current,
      {
        ...newCampaign,
        formId: newCampaign.formId || "N/A",
        isActive: true,
      } as MetaCampaign,
    ]);
    setNewCampaign({});
    setShowCampaignForm(false);
  };

  const removeCampaign = (index: number) => {
    const current = formData.metaCampaigns || [];
    const updated = [...current];
    updated.splice(index, 1);
    handleChange("metaCampaigns", updated);
  };

  const typeLabel = PROJECT_TYPES.find((t) => t.value === formData.type)?.label || formData.type;
  const statusLabel = PROJECT_STATUSES.find((s) => s.value === formData.status)?.label || formData.status;

  const statusCell = (
    <span
      style={{
        display: "inline-block",
        fontFamily: 'Calibri, "Segoe UI", sans-serif',
        fontSize: "11px",
        fontWeight: 700,
        padding: "1px 8px",
        letterSpacing: "0.04em",
        background: formData.status === "COMPLETED" ? "#edfaf2" : "#eff6ff",
        color: formData.status === "COMPLETED" ? "#15803d" : "#1d4ed8",
        border: formData.status === "COMPLETED" ? "1px solid #86efac" : "1px solid #bfdbfe",
      }}
    >
      {statusLabel}
    </span>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.38)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "620px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 0 1px #d0d0d0, 4px 4px 32px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            background: "#f9f9f9",
            borderBottom: "2px solid #C0272D",
            padding: "7px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                background: "#C0272D",
                color: "#fff",
                fontFamily: "Calibri, sans-serif",
                fontSize: "9px",
                fontWeight: 900,
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "-0.5px",
              }}
            >
              RS
            </div>
            <span
              style={{
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
                fontSize: "12px",
                color: "#666",
                letterSpacing: "0.02em",
              }}
            >
              ProjectDetail_{formData.id}.xlsx —&nbsp;
              <span style={{ color: "#C0272D" }}>{isEditing ? "Editing" : "Read-Only"}</span>
            </span>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={handleEditToggle}
                style={{
                  background: isEditing ? "#C0272D" : "transparent",
                  border: "1px solid #C0272D",
                  color: isEditing ? "#fff" : "#C0272D",
                  fontFamily: 'Calibri, "Segoe UI", sans-serif',
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {isEditing ? "Save Project" : "Edit Project"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#aaa",
                cursor: "pointer",
                fontSize: "15px",
                lineHeight: 1,
                padding: "0 4px",
                fontFamily: "Calibri, sans-serif",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C0272D")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Formula bar */}
        <div
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e0e0e0",
            padding: "3px 10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Calibri, monospace",
              fontSize: "11px",
              color: "#333",
              background: "#f2f2f2",
              border: "1px solid #d0d0d0",
              padding: "1px 8px",
              minWidth: "52px",
              textAlign: "center",
            }}
          >
            A1
          </span>
          <span style={{ color: "#C0272D", fontSize: "13px" }}>ƒx</span>
          <span
            style={{
              fontFamily: "Calibri, monospace",
              fontSize: "11px",
              color: "#666",
              flex: 1,
            }}
          >
            =PROJECT("{formData.name}", "{formData.id}")
          </span>
        </div>

        {/* Column letters header */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #d0d0d0",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "32px", borderRight: "1px solid #d0d0d0", flexShrink: 0, background: "#f2f2f2" }} />
          <div
            style={{
              flex: "0 0 38%",
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: "11px",
              color: "#888",
              textAlign: "center",
              padding: "2px 0",
              borderRight: "1px solid #d0d0d0",
              background: "#e8e8e8",
            }}
          >
            A
          </div>
          <div
            style={{
              flex: 1,
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: "11px",
              color: "#888",
              textAlign: "center",
              padding: "2px 0",
              background: "#e8e8e8",
            }}
          >
            B
          </div>
        </div>

        {/* Spreadsheet body */}
        <div style={{ overflowY: "auto", flex: 1, background: "#ffffff" }}>
          <div style={{ display: "flex" }}>
            {/* Row numbers */}
            <div
              style={{
                width: "32px",
                flexShrink: 0,
                background: "#f2f2f2",
                borderRight: "1px solid #d0d0d0",
              }}
            >
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "Calibri, monospace",
                    fontSize: "10px",
                    color: "#aaa",
                    textAlign: "center",
                    padding: "5px 0",
                    borderBottom: "1px solid #e4e4e4",
                    minHeight: "27px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Table */}
            <table
              style={{
                flex: 1,
                borderCollapse: "collapse",
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <tbody>
                <SectionHeader title="Project Photo" icon="🖼️" />
                <tr>
                  <td
                    style={{
                      fontFamily: 'Calibri, "Segoe UI", sans-serif',
                      fontSize: "12px",
                      color: "#555",
                      fontWeight: 600,
                      padding: "5px 10px",
                      border: "1px solid #d0d0d0",
                      width: "38%",
                      background: "#efefef",
                    }}
                  >
                    Photo Thumbnail
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d0d0d0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "#f0f0f0",
                          position: "relative",
                        }}
                      >
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Project Thumbnail"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ccc",
                              fontSize: "20px",
                            }}
                          >
                            🏢
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <label
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #ccc",
                            background: "#f9f9f9",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                        >
                          {isUploadingImage ? "Uploading..." : "Upload Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            style={{ display: "none" }}
                            disabled={isUploadingImage}
                          />
                        </label>
                      )}
                    </div>
                  </td>
                </tr>

                <SectionHeader title="General Information" icon="🏢" />
                <Row
                  label="Project Name *"
                  value={formData.name}
                  shade={false}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("name", v)}
                />
                <Row
                  label="Location *"
                  value={formData.location}
                  shade={true}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("location", v)}
                />
                <Row
                  label="Project Type *"
                  value={formData.type}
                  shade={false}
                  isEditing={isEditing}
                  options={PROJECT_TYPES}
                  onChange={(v) => handleChange("type", v)}
                />
                <Row
                  label="Status"
                  value={isEditing ? formData.status : statusCell}
                  shade={true}
                  isEditing={isEditing}
                  options={PROJECT_STATUSES}
                  onChange={(v) => handleChange("status", v)}
                />
                <Row
                  label="Total Units *"
                  value={formData.totalUnits}
                  shade={false}
                  isEditing={isEditing}
                  type="number"
                  onChange={(v) => handleChange("totalUnits", parseInt(v, 10) || 0)}
                />
                <Row
                  label="RERA Number"
                  value={formData.reraNumber}
                  shade={true}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("reraNumber", v)}
                />

                <SectionHeader title="Timeline & Amenities" icon="📅" />
                <Row
                  label="Launch Date"
                  value={formData.launchDate}
                  shade={false}
                  isEditing={isEditing}
                  type="date"
                  onChange={(v) => handleChange("launchDate", v)}
                />
                <Row
                  label="Completion Date"
                  value={formData.completionDate}
                  shade={true}
                  isEditing={isEditing}
                  type="date"
                  onChange={(v) => handleChange("completionDate", v)}
                />
                <tr>
                  <td
                    style={{
                      fontFamily: 'Calibri, "Segoe UI", sans-serif',
                      fontSize: "12px",
                      color: "#555",
                      fontWeight: 600,
                      padding: "5px 10px",
                      border: "1px solid #d0d0d0",
                      width: "38%",
                      background: "#efefef",
                    }}
                  >
                    Amenities
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d0d0d0",
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {AMENITY_OPTIONS.map((amenity) => {
                          const isSelected = (formData.amenities || []).includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              style={{
                                padding: "3px 6px",
                                fontSize: "11px",
                                borderRadius: "4px",
                                border: isSelected ? "1px solid #C0272D" : "1px solid #ccc",
                                background: isSelected ? "#fde8e9" : "#fff",
                                color: isSelected ? "#C0272D" : "#555",
                                cursor: "pointer",
                              }}
                            >
                              {amenity}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(formData.amenities || []).length > 0 ? (
                          (formData.amenities || []).map((amenity) => (
                            <span
                              key={amenity}
                              style={{
                                padding: "2px 6px",
                                fontSize: "11px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                background: "#f9f9f9",
                                color: "#555",
                              }}
                            >
                              {amenity}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "#aaa" }}>None</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>

                <SectionHeader title="Description" icon="📝" />
                <tr style={{ background: "#fff8f8" }}>
                  <td
                    colSpan={2}
                    style={{
                      fontFamily: 'Calibri, "Segoe UI", sans-serif',
                      fontSize: "12px",
                      color: "#333",
                      padding: "8px 10px",
                      border: "1px solid #f0d0d0",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) => handleChange("description", e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "60px",
                          padding: "5px",
                          border: "1px solid #ccc",
                          fontFamily: 'Calibri, "Segoe UI", sans-serif',
                          fontSize: "12px",
                          resize: "none",
                        }}
                      />
                    ) : (
                      formData.description || "—"
                    )}
                  </td>
                </tr>

                <SectionHeader title="Meta Integration" icon="🌐" />
                <tr>
                  <td
                    style={{
                      fontFamily: 'Calibri, "Segoe UI", sans-serif',
                      fontSize: "12px",
                      color: "#555",
                      fontWeight: 600,
                      padding: "5px 10px",
                      border: "1px solid #d0d0d0",
                      width: "38%",
                      background: "#efefef",
                    }}
                  >
                    Meta Campaigns
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d0d0d0",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(formData.metaCampaigns || []).map((camp, idx) => (
                        <div key={idx} style={{ padding: "6px 8px", border: "1px solid #e0e0e0", borderRadius: "4px", background: "#fcfcfc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#333", marginBottom: "2px" }}>
                              {camp.campaignName} <span style={{ fontSize: "10px", color: "#888", fontWeight: "normal" }}>({camp.platform})</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#666" }}>
                              Ad ID: {camp.adId} {camp.formId && `· Form ID: ${camp.formId}`}
                            </div>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => removeCampaign(idx)}
                              style={{ border: "none", background: "none", color: "#C0272D", cursor: "pointer", fontSize: "14px" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {(formData.metaCampaigns || []).length === 0 && !isEditing && (
                        <span style={{ color: "#aaa", fontSize: "11px" }}>No linked campaigns</span>
                      )}

                      {isEditing && (
                        <>
                          {showCampaignForm ? (
                            <div style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", background: "#f9f9f9", marginTop: "4px" }}>
                              <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "6px", color: "#555" }}>Add New Campaign</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <input
                                    type="text"
                                    placeholder="Campaign Name *"
                                    value={newCampaign.campaignName || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, campaignName: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Campaign ID *"
                                    value={newCampaign.campaignId || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, campaignId: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <input
                                    type="text"
                                    placeholder="Ad Set Name"
                                    value={newCampaign.adSetName || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, adSetName: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Ad Set ID"
                                    value={newCampaign.adSetId || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, adSetId: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <input
                                    type="text"
                                    placeholder="Ad Name"
                                    value={newCampaign.adName || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, adName: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Ad ID *"
                                    value={newCampaign.adId || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, adId: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <input
                                    type="text"
                                    placeholder="Form Name"
                                    value={newCampaign.formName || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, formName: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Form ID"
                                    value={newCampaign.formId || ""}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, formId: e.target.value })}
                                    style={{ flex: 1, padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                  />
                                </div>
                                <select
                                  value={newCampaign.platform || ""}
                                  onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value as any })}
                                  style={{ width: "100%", padding: "4px", fontSize: "11px", border: "1px solid #ccc" }}
                                >
                                  <option value="">Select Platform *</option>
                                  <option value="facebook">Facebook</option>
                                  <option value="instagram">Instagram</option>
                                </select>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "4px" }}>
                                  <button onClick={() => setShowCampaignForm(false)} style={{ fontSize: "11px", padding: "2px 6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>Cancel</button>
                                  <button onClick={addCampaign} style={{ fontSize: "11px", padding: "2px 6px", border: "1px solid #C0272D", background: "#C0272D", color: "#fff", cursor: "pointer" }}>Add</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowCampaignForm(true)}
                              style={{ padding: "4px 8px", fontSize: "11px", border: "1px dashed #ccc", background: "transparent", cursor: "pointer", color: "#555", marginTop: "4px", textAlign: "center" }}
                            >
                              + Add Campaign Mapping
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            background: "#f9f9f9",
            borderTop: "2px solid #C0272D",
            padding: "4px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: "11px",
              color: "#aaa",
              letterSpacing: "0.03em",
            }}
          >
            Ready &nbsp;|&nbsp; <span style={{ color: "#C0272D" }}>Sheet1</span>
          </span>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: "11px",
              color: "#fff",
              background: "#C0272D",
              border: "none",
              padding: "3px 16px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#a01f24")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C0272D")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
