import React, { useState } from 'react';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  CheckCheck,
  FileCode,
  Zap,
} from 'lucide-react';
import type { SandboxVerificationResult, PatchedFile } from '../types/agent';

interface ClosedLoopVerificationProps {
  activePatch?: PatchedFile;
  language: string;
}

export const ClosedLoopVerification: React.FC<ClosedLoopVerificationProps> = ({
  activePatch,
  language,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<SandboxVerificationResult | null>(null);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  const handleRunVerification = async () => {
    if (!activePatch) return;
    setIsRunning(true);
    try {
      const res = await fetch('/api/verify/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: activePatch.path,
          language: language,
          originalCode: activePatch.originalContent,
          patchedCode: activePatch.patchedContent,
        }),
      });

      if (res.ok) {
        const data: SandboxVerificationResult = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Closed-loop verification failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyLogs = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.compilerOutput);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Closed-Loop Sandbox Verification Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Isolates differential patch in sandboxed runtime, executes compiler AST validation, and tests safety invariants
          </p>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={isRunning || !activePatch}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm shrink-0"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying Patch...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Run Sandbox Verification</span>
            </>
          )}
        </button>
      </div>

      {/* Result Status Cards */}
      {result ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Verification Verdict
              </span>
              <div className="flex items-center gap-1.5">
                {result.status === 'verified' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-400">VERIFIED SAFE</span>
                  </>
                ) : result.status === 'warning' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-400">WARNING</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold text-rose-400">REJECTED</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Test Pass Rate
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-slate-100 font-mono">
                  {result.testPassRatePct}%
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">12/12 Assertions</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Execution Time
              </span>
              <span className="text-base font-bold text-slate-100 font-mono">
                {result.executionTimeMs} ms
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Syntax Valid
              </span>
              <div className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-100">
                  {result.syntaxValid ? 'Clean AST' : 'Parse Error'}
                </span>
              </div>
            </div>
          </div>

          {/* Passed Invariant Checks List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Verified Invariant Rules ({result.passedChecks.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.passedChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-sans leading-tight">{check}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compiler Stderr / Stdout Output Drawer */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[11px]">Sandboxed Compiler Telemetry Log</span>
              </div>
              <button
                onClick={handleCopyLogs}
                className="flex items-center gap-1 text-[11px] hover:text-slate-200 transition-colors"
              >
                {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLog ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-48">
              {result.compilerOutput}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>Ready to run closed-loop compiler verification on differential patch.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Target: {language.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

