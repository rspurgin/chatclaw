import React, { useState, useEffect } from 'react';
import { SERVER_URL } from '../../lib/config';

export const LogViewer: React.FC = () => {
  const [logData, setLogData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/log`);
      if (!response.ok) throw new Error("Failed to fetch logs");

      const json = (await response.json()) as { success: boolean; data?: string; error?: string };
      if (json.success) {
        setLogData(json.data ?? "");
      } else {
        throw new Error(json.error ?? "Server returned an error");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="flex flex-col h-full bg-dark-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      <div className="bg-dark-800 p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          Server Data Log
        </h2>
        <button
          onClick={() => void fetchLogs()}
          disabled={loading}
          className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 px-3 py-1 rounded transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-dark-950">
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded text-sm">
            <span>{error}</span>
          </div>
        )}

        {loading && !logData && (
          <div className="text-gray-500 text-sm animate-pulse">Loading logs...</div>
        )}

        {!loading && !error && !logData && (
          <div className="text-gray-500 text-sm italic">
            Log file is currently empty or does not exist.
          </div>
        )}

        {logData && (
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {logData}
          </pre>
        )}
      </div>
    </div>
  );
}
