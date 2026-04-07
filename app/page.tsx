'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

interface Record {
  id: string;
  fields: {
    'Issue ID': number;
    Issue: string;
    Dimension: string;
    Theme: string;
    Severity: string;
    Decision: string;
    Resolution: string;
    Comments: string;
  };
}

type SortField = 'Issue ID' | 'Issue' | 'Dimension' | 'Theme' | 'Severity' | 'Decision' | 'Resolution' | 'Comments';
type SortDirection = 'asc' | 'desc';

const DECISION_OPTIONS = ['Accepted', 'Rejected'] as const;

const RESOLUTION_OPTIONS = [
  'Deferred',
  'Planned',
  'Redirected',
  'Completed',
] as const;

const REJECTION_REASONS = [
  'Repeated in same DXR report',
  'Customer/partner generated',
  'Against guidelines',
  'Intentional deviation',
  'Other (leave a Comment)',
] as const;

const DIMENSION_ORDER = [
  'Getting Started',
  'Usability',
  'Visuals',
  'Content',
  'Help',
];

function getDecisionClass(decision: string): string {
  if (decision === 'Accepted') return 'bg-green-100 text-green-800';
  if (decision === 'Rejected') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function getResolutionClass(resolution: string): string {
  if (resolution === 'Completed') return 'bg-blue-100 text-blue-800';
  if (resolution === 'Planned') return 'bg-green-100 text-green-800';
  if (resolution === 'Deferred') return 'bg-yellow-100 text-yellow-800';
  if (resolution === 'Redirected') return 'bg-purple-100 text-purple-800';
  // Rejection reasons
  if (resolution === 'Repeated in same DXR report') return 'bg-red-100 text-red-800';
  if (resolution === 'Customer/partner generated') return 'bg-red-100 text-red-800';
  if (resolution === 'Against guidelines') return 'bg-red-100 text-red-800';
  if (resolution === 'Intentional deviation') return 'bg-red-100 text-red-800';
  if (resolution === 'Other (see Comments)') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function getSeverityClass(severity: string): string {
  const s = severity?.toLowerCase();
  if (s === 'high' || s === 'critical') return 'bg-red-100 text-red-800';
  if (s === 'medium') return 'bg-yellow-100 text-yellow-800';
  if (s === 'low') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
}

function SortIcon({ direction, active }: { direction: SortDirection; active: boolean }) {
  return (
    <span className={`ml-1 inline-block ${active ? 'text-gray-700' : 'text-gray-300'}`}>
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function AddCommentIcon() {
  return (
    <svg 
      className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  );
}

function NavArrow({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        disabled 
          ? 'text-gray-200 cursor-not-allowed' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

function DefinitionsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">Issue Routing Definitions</span>
      </button>
      
      {isOpen && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Decision</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">Accepted</span>
                  <p className="text-sm text-gray-600">"Valid finding, we own it" or "Valid finding, but wrong owning team"</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">Rejected</span>
                  <p className="text-sm text-gray-600">"We disagree. True pushback."</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">If Accepted → Resolution</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">Deferred</span>
                  <p>Issue is accepted, but not included in any release plan, not prioritized yet</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">Planned</span>
                  <p>Issue is accepted and part of a release plan</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">Redirected</span>
                  <p>Issue is accepted, but ownership belongs to a different team or results from an integration we don't control (Design System, FE, UI5, Other LOBs, External Dependencies)</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">Completed</span>
                  <p>Issue is accepted and fixed</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">If Rejected → Rejection Reason</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5 whitespace-nowrap">Repeated in same DXR report</span>
                <p>Issue appears more than once in this report</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5 whitespace-nowrap">Customer/partner generated</span>
                <p>Issue was raised by customer or partner, not DXR panel</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5 whitespace-nowrap">Against guidelines</span>
                <p>Recommendation contradicts UA, Accessibility, or other guidelines</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5 whitespace-nowrap">Intentional deviation</span>
                <p>Current behavior is a deliberate design decision</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5 whitespace-nowrap">Other (see Comments)</span>
                <p>Specify the reason in the Comments field</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [records, setRecords] = useState<Record[]>([]);
  const [baseName, setBaseName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortField, setSortField] = useState<SortField>('Issue ID');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [editingComments, setEditingComments] = useState<string>('');
  const [focusComments, setFocusComments] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commentsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchBaseName();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedRecord(null);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      setEditingComments(selectedRecord.fields.Comments || '');
      
      if (panelRef.current) {
        panelRef.current.scrollTop = 0;
      }
      
      if (focusComments) {
        setTimeout(() => {
          if (commentsTextareaRef.current) {
            commentsTextareaRef.current.focus();
            commentsTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setFocusComments(false);
        }, 300);
      }
    }
  }, [selectedRecord]);

  useEffect(() => {
    if (focusComments && selectedRecord) {
      setTimeout(() => {
        if (commentsTextareaRef.current) {
          commentsTextareaRef.current.focus();
          commentsTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setFocusComments(false);
      }, 300);
    }
  }, [focusComments]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aVal = a.fields[sortField] || '';
      const bVal = b.fields[sortField] || '';

      if (sortField === 'Dimension') {
        const aIndex = DIMENSION_ORDER.indexOf(String(aVal));
        const bIndex = DIMENSION_ORDER.indexOf(String(bVal));
        const aOrder = aIndex === -1 ? 999 : aIndex;
        const bOrder = bIndex === -1 ? 999 : bIndex;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }

      if (sortField === 'Issue ID') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (sortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal));
      } else {
        return String(bVal).localeCompare(String(aVal));
      }
    });
  }, [records, sortField, sortDirection]);

  const currentIndex = useMemo(() => {
    if (!selectedRecord) return -1;
    return sortedRecords.findIndex(r => r.id === selectedRecord.id);
  }, [selectedRecord, sortedRecords]);

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < sortedRecords.length - 1 && currentIndex !== -1;

  function goToPrevious() {
    if (canGoPrevious) {
      setFocusComments(false);
      setSelectedRecord(sortedRecords[currentIndex - 1]);
    }
  }

  function goToNext() {
    if (canGoNext) {
      setFocusComments(false);
      setSelectedRecord(sortedRecords[currentIndex + 1]);
    }
  }

  function selectRecord(record: Record, focusOnComments: boolean = false) {
    if (focusOnComments) {
      setFocusComments(true);
    }
    setSelectedRecord(record);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  async function fetchBaseName() {
    try {
      const response = await fetch('/api/base');
      if (!response.ok) return;
      const data = await response.json();
      setBaseName(data.name || '');
    } catch (err) {
      console.error('Failed to fetch base name:', err);
    }
  }

  async function fetchRecords() {
    try {
      setLoading(true);
      const response = await fetch('/api/records');
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      const filtered = data.records.filter(
        (record: Record) => record.fields.Dimension && record.fields.Dimension.trim() !== ''
      );
      setRecords(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function updateRecord(recordId: string, updates: { Decision?: string; Resolution?: string; Comments?: string }) {
    setSavingIds((prev) => new Set(prev).add(recordId));

    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, fields: { ...record.fields, ...updates } }
          : record
      )
    );

    if (selectedRecord && selectedRecord.id === recordId) {
      setSelectedRecord({
        ...selectedRecord,
        fields: { ...selectedRecord.fields, ...updates },
      });
    }

    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update record');

      setToast({ message: 'Saved successfully', type: 'success' });
    } catch (err) {
      fetchRecords();
      setToast({ message: 'Failed to save', type: 'error' });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  }

  function handleDecisionChange(recordId: string, value: string) {
    const fields: Partial<Record['fields']> = { Decision: value };
    // Clear Resolution when changing Decision, as the options differ
    fields.Resolution = '';
    updateRecord(recordId, fields);
  }

  function handleCommentsChange(value: string) {
    setEditingComments(value);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (selectedRecord) {
        updateRecord(selectedRecord.id, { Comments: value });
      }
    }, 1000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg
            className="spinner h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-600">Loading records...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchRecords}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg toast-enter z-50 ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      {selectedRecord && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedRecord(null)}
          />
          <div 
            ref={panelRef}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Issue #{selectedRecord.fields['Issue ID']}
                </h2>
                <div className="flex items-center gap-1">
                  {savingIds.has(selectedRecord.id) && (
                    <span className="text-xs text-gray-400 mr-2">Saving...</span>
                  )}
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${getDecisionClass(selectedRecord.fields.Decision || '')}`}>
                    {selectedRecord.fields.Decision || 'No decision'}
                  </span>
                  {selectedRecord.fields.Resolution && (
                    <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${getResolutionClass(selectedRecord.fields.Resolution)}`}>
                      {selectedRecord.fields.Resolution}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <NavArrow direction="left" disabled={!canGoPrevious} onClick={goToPrevious} />
                  <span className="text-xs text-gray-400 mx-1">
                    {currentIndex + 1} / {sortedRecords.length}
                  </span>
                  <NavArrow direction="right" disabled={!canGoNext} onClick={goToNext} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Issue Title
                </label>
                <p className="text-gray-900 font-medium">
                  {selectedRecord.fields.Issue || 'No title'}
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Dimension
                  </label>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {selectedRecord.fields.Dimension}
                  </span>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Theme
                  </label>
                  <span className="inline-block bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                    {selectedRecord.fields.Theme || 'No theme'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Severity
                </label>
                <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${getSeverityClass(selectedRecord.fields.Severity || '')}`}>
                  {selectedRecord.fields.Severity || 'Not set'}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Decision
                </label>
                <select
                  value={selectedRecord.fields.Decision || ''}
                  onChange={(e) => handleDecisionChange(selectedRecord.id, e.target.value)}
                  disabled={savingIds.has(selectedRecord.id)}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${getDecisionClass(selectedRecord.fields.Decision || '')}`}
                >
                  <option value="">Select decision</option>
                  {DECISION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRecord.fields.Decision === 'Accepted' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Resolution
                  </label>
                  <select
                    value={selectedRecord.fields.Resolution || ''}
                    onChange={(e) => updateRecord(selectedRecord.id, { Resolution: e.target.value })}
                    disabled={savingIds.has(selectedRecord.id)}
                    className={`w-full px-4 py-2 rounded-lg border border-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${getResolutionClass(selectedRecord.fields.Resolution || '')}`}
                  >
                    <option value="">Select resolution</option>
                    {RESOLUTION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRecord.fields.Decision === 'Rejected' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Rejection Reason
                  </label>
                  <select
                    value={selectedRecord.fields.Resolution || ''}
                    onChange={(e) => updateRecord(selectedRecord.id, { Resolution: e.target.value })}
                    disabled={savingIds.has(selectedRecord.id)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 bg-red-50 text-red-800"
                  >
                    <option value="">Select reason</option>
                    {REJECTION_REASONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Comments
                </label>
                <textarea
                  ref={commentsTextareaRef}
                  value={editingComments}
                  onChange={(e) => handleCommentsChange(e.target.value)}
                  placeholder="Add your comments here..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-saves after you stop typing</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto mb-6">
        {baseName && (
          <p className="text-sm font-semibold tracking-wide mb-1" style={{ color: '#0070F2' }}>
            {baseName}
          </p>
        )}
        <h1 className="text-2xl font-semibold text-gray-900">Issue Status Editor</h1>
        <p className="text-gray-500 mt-1">
          {sortedRecords.length} issue{sortedRecords.length !== 1 ? 's' : ''} found. Click a row to see details and edit.
        </p>
      </div>

      <DefinitionsPanel />

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th
                  onClick={() => handleSort('Issue ID')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  ID
                  <SortIcon direction={sortDirection} active={sortField === 'Issue ID'} />
                </th>
                <th
                  onClick={() => handleSort('Issue')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Issue
                  <SortIcon direction={sortDirection} active={sortField === 'Issue'} />
                </th>
                <th
                  onClick={() => handleSort('Dimension')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Dimension
                  <SortIcon direction={sortDirection} active={sortField === 'Dimension'} />
                </th>
                <th
                  onClick={() => handleSort('Theme')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Theme
                  <SortIcon direction={sortDirection} active={sortField === 'Theme'} />
                </th>
                <th
                  onClick={() => handleSort('Severity')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Severity
                  <SortIcon direction={sortDirection} active={sortField === 'Severity'} />
                </th>
                <th
                  onClick={() => handleSort('Decision')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Decision
                  <SortIcon direction={sortDirection} active={sortField === 'Decision'} />
                </th>
                <th
                  onClick={() => handleSort('Resolution')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Resolution
                  <SortIcon direction={sortDirection} active={sortField === 'Resolution'} />
                </th>
                <th
                  onClick={() => handleSort('Comments')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Comments
                  <SortIcon direction={sortDirection} active={sortField === 'Comments'} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => selectRecord(record, false)}
                  className={`transition-colors cursor-pointer ${
                    selectedRecord?.id === record.id
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {record.fields['Issue ID'] || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm line-clamp-2 max-w-xs">
                      {record.fields.Issue || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm">
                      {record.fields.Dimension || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm">
                      {record.fields.Theme || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getSeverityClass(record.fields.Severity || '')}`}>
                      {record.fields.Severity || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getDecisionClass(record.fields.Decision || '')}`}>
                      {record.fields.Decision || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getResolutionClass(record.fields.Resolution || '')}`}>
                      {record.fields.Resolution || '—'}
                    </span>
                  </td>
                  <td 
                    className="px-6 py-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectRecord(record, true);
                    }}
                  >
                    {record.fields.Comments ? (
                      <span className="text-gray-600 text-sm line-clamp-2 max-w-xs">
                        {record.fields.Comments}
                      </span>
                    ) : (
                      <AddCommentIcon />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
