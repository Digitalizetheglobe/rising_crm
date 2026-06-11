import React from 'react';

export interface LeadDetail {
  id: string;
  name: string;
  source: string;
  phone: string;
  status: string;
  lastContacted: string;
  email?: string;
  budgetRange?: string;
  propertyType?: string;
  preferredLocation?: string;
  notes?: string;
  createdAt?: string;
  assignEmployee?: string;
}

interface LeadDetailModuleProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadDetail | null;
  onSave?: (updated: LeadDetail) => void;
}

// Rising Spaces — Light Excel palette
// #ffffff  — modal body / cell background
// #f5f5f5  — alternate row shade
// #efefef  — label cell background
// #e4e4e4  — alternate label cell
// #C0272D  — brand red (headers, accents, status bar)
// #8a1a1e  — dark red (red area borders)
// #1a1a1a  — primary text
// #555555  — label text
// #d0d0d0  — grid line borders
// #f9f9f9  — chrome bars (title, ribbon, formula)

function Row({
  label, value, shade, isEditing, onChange, type = 'text', options
}: {
  label: string; value?: string | React.ReactNode; shade: boolean;
  isEditing?: boolean; onChange?: (val: string) => void;
  type?: string; options?: string[];
}) {
  return (
    <tr style={{ background: shade ? '#f5f5f5' : '#ffffff' }}>
      <td
        style={{
          fontFamily: 'Calibri, "Segoe UI", sans-serif',
          fontSize: '12px',
          color: '#555',
          fontWeight: 600,
          padding: '5px 10px',
          border: '1px solid #d0d0d0',
          width: '38%',
          whiteSpace: 'nowrap',
          background: shade ? '#e4e4e4' : '#efefef',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </td>
      <td
        style={{
          fontFamily: 'Calibri, "Segoe UI", sans-serif',
          fontSize: '12px',
          color: '#1a1a1a',
          padding: isEditing ? '2px 5px' : '5px 10px',
          border: '1px solid #d0d0d0',
        }}
      >
        {isEditing && typeof value === 'string' ? (
          options ? (
            <select
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              style={{
                width: '100%', padding: '3px', border: '1px solid #ccc',
                fontFamily: 'Calibri, "Segoe UI", sans-serif', fontSize: '12px'
              }}
            >
              <option value="">Select...</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              style={{
                width: '100%', padding: '3px', border: '1px solid #ccc',
                fontFamily: 'Calibri, "Segoe UI", sans-serif', fontSize: '12px'
              }}
            />
          )
        ) : (
          value || '—'
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
          fontSize: '11px',
          fontWeight: 700,
          color: '#ffffff',
          background: '#C0272D',
          padding: '5px 10px',
          border: '1px solid #8a1a1e',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {icon}&nbsp;&nbsp;{title}
      </td>
    </tr>
  );
}

export default function LeadDetailModule({ isOpen, onClose, lead, onSave }: LeadDetailModuleProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<LeadDetail | null>(null);

  React.useEffect(() => {
    if (lead) setFormData(lead);
    setIsEditing(false);
  }, [lead, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof LeadDetail, val: string) => {
    setFormData(prev => prev ? { ...prev, [field]: val } : prev);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (onSave) onSave(formData);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const statusCell = (() => {
    const base: React.CSSProperties = {
      display: 'inline-block',
      fontFamily: 'Calibri, "Segoe UI", sans-serif',
      fontSize: '11px',
      fontWeight: 700,
      padding: '1px 8px',
      letterSpacing: '0.04em',
    };
    if (formData.status === 'Hot Lead') return (
      <span style={{ ...base, background: '#fde8e9', color: '#C0272D', border: '1px solid #C0272D' }}>
        Hot Lead
      </span>
    );
    if (formData.status === 'Closed') return (
      <span style={{ ...base, background: '#edfaf2', color: '#15803d', border: '1px solid #86efac' }}>
        Closed
      </span>
    );
    return (
      <span style={{ ...base, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
        {formData.status ? formData.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : 'New Lead'}
      </span>
    );
  })();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.38)',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 0 1px #d0d0d0, 4px 4px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            background: '#f9f9f9',
            borderBottom: '2px solid #C0272D',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                background: '#C0272D',
                color: '#fff',
                fontFamily: 'Calibri, sans-serif',
                fontSize: '9px',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-0.5px',
              }}
            >
              RS
            </div>
            <span
              style={{
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
                fontSize: '12px',
                color: '#666',
                letterSpacing: '0.02em',
              }}
            >
              LeadDetail_{formData.id}.xlsx —&nbsp;
              <span style={{ color: '#C0272D' }}>{isEditing ? 'Editing' : 'Read-Only'}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEditToggle}
              style={{
                background: isEditing ? '#C0272D' : 'transparent',
                border: '1px solid #C0272D',
                color: isEditing ? '#fff' : '#C0272D',
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => !isEditing && (e.currentTarget.style.background = '#fde8e9')}
              onMouseLeave={e => !isEditing && (e.currentTarget.style.background = 'transparent')}
            >
              {isEditing ? 'Save Lead' : 'Edit Lead'}
            </button>
            <button
              onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: '15px',
              lineHeight: 1,
              padding: '0 4px',
              fontFamily: 'Calibri, sans-serif',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C0272D')}
            onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
          >
            ✕
          </button>
          </div>
        </div>

        {/* Ribbon */}
        {/* <div
          style={{
            background: '#f2f2f2',
            borderBottom: '1px solid #e0e0e0',
            padding: '4px 10px',
            display: 'flex',
            gap: '2px',
            flexShrink: 0,
          }}
        >
          {['File', 'Home', 'Insert', 'View'].map((tab, i) => (
            <span
              key={tab}
              style={{
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
                fontSize: '11px',
                color: i === 1 ? '#fff' : '#777',
                cursor: 'default',
                padding: '2px 8px',
                background: i === 1 ? '#C0272D' : 'transparent',
                userSelect: 'none',
              }}
            >
              {tab}
            </span>
          ))}
        </div> */}

        {/* Formula bar */}
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Calibri, monospace',
              fontSize: '11px',
              color: '#333',
              background: '#f2f2f2',
              border: '1px solid #d0d0d0',
              padding: '1px 8px',
              minWidth: '52px',
              textAlign: 'center',
            }}
          >
            A1
          </span>
          <span style={{ color: '#C0272D', fontSize: '13px' }}>ƒx</span>
          <span
            style={{
              fontFamily: 'Calibri, monospace',
              fontSize: '11px',
              color: '#666',
              flex: 1,
            }}
          >
            =LEAD("{formData.name}", "{formData.id}")
          </span>
        </div>

        {/* Column letters header */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #d0d0d0',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '32px', borderRight: '1px solid #d0d0d0', flexShrink: 0, background: '#f2f2f2' }} />
          <div
            style={{
              flex: '0 0 38%',
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: '11px',
              color: '#888',
              textAlign: 'center',
              padding: '2px 0',
              borderRight: '1px solid #d0d0d0',
              background: '#e8e8e8',
            }}
          >
            A
          </div>
          <div
            style={{
              flex: 1,
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: '11px',
              color: '#888',
              textAlign: 'center',
              padding: '2px 0',
              background: '#e8e8e8',
            }}
          >
            B
          </div>
        </div>

        {/* Spreadsheet body */}
        <div style={{ overflowY: 'auto', flex: 1, background: '#ffffff' }}>
          <div style={{ display: 'flex' }}>
            {/* Row numbers */}
            <div
              style={{
                width: '32px',
                flexShrink: 0,
                background: '#f2f2f2',
                borderRight: '1px solid #d0d0d0',
              }}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'Calibri, monospace',
                    fontSize: '10px',
                    color: '#aaa',
                    textAlign: 'center',
                    padding: '5px 0',
                    borderBottom: '1px solid #e4e4e4',
                    minHeight: '27px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                width: '100%',
              }}
            >
              <tbody>
                <SectionHeader title="Client Information" icon="👤" />
                <Row label="Full Name" value={formData.name} shade={false} isEditing={isEditing} onChange={v => handleChange('name', v)} />
                <Row label="Contact Number" value={formData.phone} shade={true} isEditing={isEditing} onChange={v => handleChange('phone', v)} />
                <Row label="Email Address" value={formData.email} shade={false} isEditing={isEditing} onChange={v => handleChange('email', v)} type="email" />

                <SectionHeader title="Preferences & Budget" icon="🏠" />
                <Row label="Property Type" value={formData.propertyType} shade={false} isEditing={isEditing} onChange={v => handleChange('propertyType', v)} options={['1BHK', '2BHK', '3BHK', '4+BHK', 'Villa', 'Banglow', 'Plot', 'Residential', 'Commercial', 'Apartment', 'Shop', 'Office']} />
                <Row label="Budget Range" value={formData.budgetRange} shade={true} isEditing={isEditing} onChange={v => handleChange('budgetRange', v)} options={['Under 25L', '25L-50L', '50L-1Cr', '1Cr-2Cr', 'Above 2Cr']} />
                <Row label="Preferred Location" value={formData.preferredLocation} shade={false} isEditing={isEditing} onChange={v => handleChange('preferredLocation', v)} />

                <SectionHeader title="Tracking Information" icon="📋" />
                <Row label="Assign Employee" value={formData.assignEmployee} shade={true} isEditing={isEditing} onChange={v => handleChange('assignEmployee', v)} />
                {/* Status changes go through PATCH /:id/status with pipeline
                    transition rules — use the "Move Pipeline" action instead. */}
                <Row label="Status" value={statusCell} shade={false} />
                <Row label="Source" value={formData.source} shade={true} isEditing={isEditing} onChange={v => handleChange('source', v)} options={['Website', 'Advertisement', 'Referral', 'Walk-In', 'Phone', 'WhatsApp', 'Email', 'Social Media', 'Other']} />
                <Row label="Created Date" value={formData.createdAt} shade={false} />
                <Row label="Last Contacted" value={formData.lastContacted} shade={true} isEditing={isEditing} onChange={v => handleChange('lastContacted', v)} type="date" />

                {(isEditing || formData.notes) && (
                  <>
                    <SectionHeader title="Internal Notes" icon="📝" />
                    <tr style={{ background: '#fff8f8' }}>
                      <td
                        colSpan={2}
                        style={{
                          fontFamily: 'Calibri, "Segoe UI", sans-serif',
                          fontSize: '12px',
                          color: '#333',
                          padding: '8px 10px',
                          border: '1px solid #f0d0d0',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                        }}
                      >
                        {isEditing ? (
                          <textarea
                            value={formData.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            style={{
                              width: '100%', minHeight: '60px', padding: '5px', border: '1px solid #ccc',
                              fontFamily: 'Calibri, "Segoe UI", sans-serif', fontSize: '12px'
                            }}
                          />
                        ) : (
                          formData.notes
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            background: '#f9f9f9',
            borderTop: '2px solid #C0272D',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: '11px',
              color: '#aaa',
              letterSpacing: '0.03em',
            }}
          >
            Ready &nbsp;|&nbsp; <span style={{ color: '#C0272D' }}>Sheet1</span>
          </span>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontSize: '11px',
              color: '#fff',
              background: '#C0272D',
              border: 'none',
              padding: '3px 16px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#a01f24')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C0272D')}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}