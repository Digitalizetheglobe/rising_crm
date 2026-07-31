'use client';

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
    ColDef, 
    GridReadyEvent, 
    GridApi, 
    CellValueChangedEvent,
    SelectionChangedEvent,
    ModuleRegistry
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

// Register all enterprise and community modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Intercept and suppress AG Grid console license/validation warnings in development mode
if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
        try {
            const msg = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');
            if (
                msg.includes('License Key') ||
                msg.includes('ag-Grid') ||
                msg.includes('ag-grid') ||
                msg.includes('ValidationModule') ||
                msg.includes('*****') ||
                msg.includes('watermark')
            ) {
                return;
            }
        } catch (e) {}
        if (typeof originalConsoleError === 'function') {
            originalConsoleError(...args);
        }
    };
}

// AG Grid Core & Theme CSS (Quartz & Alpine)
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { API_URL } from '../config/api.config';
import { getAuthHeaders } from '../lib/auth';

// Status Pill Badge Renderer Component for AG Grid Columns
export const StatusCellRenderer = (params: any) => {
    const value = params.value ? String(params.value).toUpperCase() : '';
    let badgeClass = 'grid-badge-default';

    if (['NEW', 'FRESH'].includes(value)) badgeClass = 'grid-badge-new';
    else if (['CONTACTED', 'WARM', 'FOLLOW_UP'].includes(value)) badgeClass = 'grid-badge-contacted';
    else if (['QUALIFIED', 'HOT'].includes(value)) badgeClass = 'grid-badge-qualified';
    else if (['INTERESTED', 'COLD'].includes(value)) badgeClass = 'grid-badge-interested';
    else if (['SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'SITE_VISIT'].includes(value)) badgeClass = 'grid-badge-sitevisit';
    else if (['CLOSED', 'BOOKED', 'WON', 'COMPLETED'].includes(value)) badgeClass = 'grid-badge-closed';
    else if (['LOST', 'DEAD', 'CANCELLED', 'REJECTED'].includes(value)) badgeClass = 'grid-badge-lost';

    return (
        <span className={`grid-badge ${badgeClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
            {params.value || 'N/A'}
        </span>
    );
};

interface AdvancedDataGridProps {
    rowData: any[];
    columnDefs: ColDef[];
    onCellValueChanged?: (event: CellValueChangedEvent) => void;
    onSelectionChanged?: (selectedRows: any[]) => void;
    onRowClicked?: (event: any) => void;
    gridId?: string;
    loading?: boolean;
}

export default function AdvancedDataGrid({
    rowData,
    columnDefs,
    onCellValueChanged,
    onSelectionChanged,
    onRowClicked,
    gridId = 'default_grid',
    loading = false
}: AdvancedDataGridProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable: true,
            filter: true,
            resizable: true,
            enableRowGroup: true,
            editable: true, // enable inline editing by default
            flex: 1,
            minWidth: 100,
            menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'],
        };
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        setGridApi(params.api);

        // Restore column state if saved in localStorage (for instant load)
        const savedState = localStorage.getItem(`grid-state-${gridId}`);
        if (savedState && savedState !== "undefined") {
            try {
                params.api.applyColumnState({ state: JSON.parse(savedState), applyOrder: true });
            } catch (e) {
                console.error('Failed to restore grid state:', e);
            }
        }

        // Fetch from database to ensure fresh state / cross-device sync
        const fetchDbState = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers.Authorization) return;

                const res = await fetch(`${API_URL}/v1/saved-filters/${gridId}`, {
                    headers
                });
                const json = await res.json();
                if (json.success && json.data?.filterState) {
                    params.api.applyColumnState({ state: json.data.filterState, applyOrder: true });
                    localStorage.setItem(`grid-state-${gridId}`, JSON.stringify(json.data.filterState));
                }
            } catch (e) {
                console.error('Failed to fetch grid state from database:', e);
            }
        };

        fetchDbState();
    }, [gridId]);

    const handleSelectionChanged = useCallback((event: SelectionChangedEvent) => {
        if (onSelectionChanged) {
            const selectedNodes = event.api.getSelectedNodes();
            const selectedData = selectedNodes.map(node => node.data);
            onSelectionChanged(selectedData);
        }
    }, [onSelectionChanged]);

    // Save column state when columns move, resize, hide, or filter changes
    const onColumnMoved = (event: any) => saveGridState(event.api);
    const onColumnResized = (event: any) => saveGridState(event.api);
    const onColumnVisible = (event: any) => saveGridState(event.api);
    const onFilterChanged = (event: any) => saveGridState(event.api);
    const onSortChanged = (event: any) => saveGridState(event.api);

    const saveGridState = (apiInstance?: any) => {
        const api = apiInstance || gridRef.current?.api || gridApi;
        if (!api) return;
        const colState = api.getColumnState();
        if (!colState || colState.length === 0) return;
        
        // LocalStorage instantly
        localStorage.setItem(`grid-state-${gridId}`, JSON.stringify(colState));

        // Debounce database write (2 seconds)
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers.Authorization) return;

                await fetch(`${API_URL}/v1/saved-filters`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        gridId,
                        filterState: colState
                    })
                });
            } catch (err) {
                console.error('Failed to save grid state to database:', err);
            }
        }, 2000);
    };

    return (
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            )}
            
            <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onCellValueChanged={onCellValueChanged}
                onSelectionChanged={handleSelectionChanged}
                onRowClicked={onRowClicked}
                rowSelection="multiple"
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                theme="legacy"
                getRowId={(params: any) => params.data.id || params.data._id || String(params.data.name)}
                
                // Enterprise Features
                enableRangeSelection={true}
                copyHeadersToClipboard={true}
                allowContextMenuWithControlKey={true}
                getContextMenuItems={(params) => [
                    'copy',
                    'copyWithHeaders',
                    'paste',
                    'separator',
                    'export'
                ]}

                // Events for state saving
                onColumnMoved={onColumnMoved}
                onColumnResized={onColumnResized}
                onColumnVisible={onColumnVisible}
                onFilterChanged={onFilterChanged}
                onSortChanged={onSortChanged}
            />
        </div>
    );
}
