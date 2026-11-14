import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Key,
  ShieldCheck,
  Download,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { TeamWorkspace, ApiKeyRecord, WorkspaceMember } from '../types/agent';

export const TeamWorkspaceSettings: React.FC = () => {
  const [workspace, setWorkspace] = useState<TeamWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isExportingSoc2, setIsExportingSoc2] = useState<boolean>(false);

  const fetchWorkspace = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
      }
    } catch (err) {
      console.error('Failed to fetch workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await fetch('/api/workspaces/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: ['audit:read', 'audit:write', 'verify:write'],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedSecret(data.secretKey);
        setNewKeyName('');
        await fetchWorkspace();
      }
    } catch (err) {
      console.error('API key generation error:', err);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/workspaces/api-keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchWorkspace();
      }
    } catch (err) {
      console.error('Delete key error:', err);
    }
  };

  const handleExportSoc2Report = async () => {
    setIsExportingSoc2(true);
    try {
      const res = await fetch('/api/compliance/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soc2-iso27001-compliance-audit-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Compliance export error:', err);
    } finally {
      setIsExportingSoc2(false);
    }
  };

  const handleCopySecret = () => {
    if (!generatedSecret) return;
    navigator.clipboard.writeText(generatedSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6 bg-slate-950">
      {/* Top Header Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h1 className="text-base font-bold text-slate-100">
              Enterprise Workspace, RBAC & SOC2 Compliance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, fine-grained access control, CI/CD API tokens, and cryptographic compliance exports
          </p>
        </div>

        <button
          onClick={handleExportSoc2Report}
          disabled={isExportingSoc2}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 rounded-lg transition-colors shadow-sm shrink-0"
        >
          {isExportingSoc2 ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Export SOC2 / ISO-27001 Report</span>
        </button>
      </div>

      {/* Grid: Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Organization</span>
          <h3 className="text-sm font-bold text-slate-100 truncate">{workspace?.name || 'Loading...'}</h3>
          <span className="text-[11px] text-indigo-400 font-mono block">Tier: {workspace?.tier?.toUpperCase()}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Security Standard</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold">SOC2 Type II & ISO-27001 Enabled</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">SHA-256 Audit Signing</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">VPC / Deployment Region</span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono">{workspace?.region || 'Private Cluster'}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">License: {workspace?.onPremLicenseKey || 'Active'}</span>
        </div>
      </div>

      {/* Section 1: Team Members & RBAC Roles */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Team Members & Role-Based Access Control
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {workspace?.members?.length || 0} Members
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {(workspace?.members || []).map((m: WorkspaceMember) => (
            <div key={m.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/50">
              <div>
                <span className="font-semibold text-slate-100 block">{m.name}</span>
                <span className="font-mono text-slate-400 text-[11px]">{m.email}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500">Joined {m.joinedAt}</span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                    m.role === 'admin'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                      : m.role === 'security_auditor'
                      ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {m.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: API Keys Management */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                CLI & CI/CD API Keys
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate programmatic API tokens for GitHub Actions, pre-commit git hooks, and headless audits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Key Name (e.g. Gitlab Runner)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
            <button
              onClick={handleCreateApiKey}
              disabled={isCreatingKey || !newKeyName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:text-slate-500 rounded-lg transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Key</span>
            </button>
          </div>
        </div>

        {/* Display Newly Generated Secret */}
        {generatedSecret && (
          <div className="p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">
                New API Key Generated (Copy now; it won't be shown again)
              </span>
              <button
                onClick={handleCopySecret}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-200"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-xs font-mono text-slate-200 bg-slate-950 p-2 rounded block break-all">
              {generatedSecret}
            </code>
          </div>
        )}

        {/* Existing Keys Table */}
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          {(workspace?.apiKeys || []).map((key: ApiKeyRecord) => (
            <div key={key.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 block">{key.name}</span>
                <span className="font-mono text-slate-400 text-[11px]">{key.keyPrefix}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-slate-500">Created: {key.createdAt}</span>
                <span className="text-[11px] font-mono text-emerald-400">Last used: {key.lastUsedAt}</span>
                <button
                  onClick={() => handleDeleteApiKey(key.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  title="Revoke Key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
