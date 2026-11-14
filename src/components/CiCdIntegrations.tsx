import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  GitCommit,
  GitBranch,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { CiRunRecord, PresetRepository } from '../types/agent';

interface CiCdIntegrationsProps {
  currentRepo: PresetRepository;
}

export const CiCdIntegrations: React.FC<CiCdIntegrationsProps> = ({ currentRepo }) => {
  const [runs, setRuns] = useState<CiRunRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedWorkflow, setCopiedWorkflow] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'runs' | 'workflow' | 'webhook'>('runs');

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ci/runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error('Failed to fetch CI runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleTriggerRun = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/ci/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prTitle: `Audit ${currentRepo.name}: Invariant Verification & Patch Generation`,
          targetFile: currentRepo.files[0]?.path,
          author: 'dev-systems',
          branch: 'feature/closed-loop-audit',
        }),
      });

      if (res.ok) {
        await fetchRuns();
      }
    } catch (err) {
      console.error('Trigger run error:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const workflowYml = `name: Qwen Agent Autonomous Code Reasoning Audit
on:
  pull_request:
    branches: [ main, master, develop ]
    paths:
      - '**/*.rs'
      - '**/*.c'
      - '**/*.cpp'
      - '**/*.py'
      - '**/*.java'
      - '**/*.js'

jobs:
  qwen-invariant-audit:
    name: Autonomous Invariant & Memory Safety Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Qwen Agent Studio CLI Runner
        run: |
          curl -sSL https://get.qwenagent.studio/install.sh | bash
          echo "$HOME/.qwen/bin" >> $GITHUB_PATH

      - name: Run Autonomous Multi-Language Audit
        env:
          QWEN_STUDIO_API_KEY: \${{ secrets.QWEN_STUDIO_API_KEY }}
          QWEN_STUDIO_ENDPOINT: \${{ secrets.QWEN_STUDIO_ENDPOINT || 'https://studio.qwenagent.com' }}
        run: |
          qwen-audit scan \\
            --repo-root . \\
            --fail-on-critical \\
            --synthesize-diffs \\
            --output pr-audit-report.json

      - name: Post Verifiable Patch Comments to PR
        if: failure() || success()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('pr-audit-report.json')) {
              const report = JSON.parse(fs.readFileSync('pr-audit-report.json', 'utf8'));
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: \`### 🛡️ Qwen Autonomous Invariant Audit\\n\\n**Status:** \${report.summary}\\n\\n<details><summary>Inspect Patches (\${report.patchedFiles?.length || 0})</summary>\\n\\n\\\`\\\`\\\`diff\\n\${report.unifiedDiff || 'No changes required'}\\n\\\`\\\`\\\`\\n</details>\`
              });
            }
`;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(workflowYml);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6 bg-slate-950">
      {/* Overview Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
            <h1 className="text-base font-bold text-slate-100">
              CI/CD Automation & GitHub Action Integrations
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automate code invariant audits, memory safety verification, and PR review comments directly in your CI pipeline
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerRun}
            disabled={isTriggering}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 rounded-lg transition-colors shadow-sm"
          >
            {isTriggering ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Simulate PR Audit Run</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('runs')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'runs'
              ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Automated PR Runs ({runs.length})
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'workflow'
              ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          GitHub Action Workflow (.yml)
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'webhook'
              ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Webhook Configuration
        </button>
      </div>

      {/* Tab 1: Runs Table */}
      {activeTab === 'runs' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Pull Request CI Pipeline Executions</span>
            <button
              onClick={fetchRuns}
              className="hover:text-slate-200 flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading automated CI runs...
              </div>
            ) : runs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No CI audit runs recorded yet. Click "Simulate PR Audit Run" to create one.
              </div>
            ) : (
              runs.map((run) => (
                <div key={run.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        #{run.prNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-100">
                        {run.prTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-slate-500" />
                        {run.branch}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-slate-500" />
                        {run.commitSha}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {run.durationSec}s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-[11px] font-mono">
                      {run.criticalBugs > 0 ? (
                        <span className="text-rose-400 font-bold block">{run.criticalBugs} Critical</span>
                      ) : (
                        <span className="text-emerald-400 font-bold block">0 Invariant Defects</span>
                      )}
                      <span className="text-slate-500">{run.verifiedPatches} Patches Synthesized</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      {run.status === 'passed' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      ) : run.status === 'action_required' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Action Req.</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Workflow YAML */}
      {activeTab === 'workflow' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                .github/workflows/qwen-agent-audit.yml
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Commit this file to your repository to activate automated pull request reasoning reviews
              </p>
            </div>

            <button
              onClick={handleCopyWorkflow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              {copiedWorkflow ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWorkflow ? 'Copied' : 'Copy YAML'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
            {workflowYml}
          </pre>
        </div>
      )}

      {/* Tab 3: Webhook Configuration */}
      {activeTab === 'webhook' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              GitHub Webhook Endpoint
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure this payload URL in your GitHub repository settings under Webhooks
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payload URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://studio.qwenagent.com/api/webhooks/github"
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-indigo-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">Content Type</span>
                <span className="font-mono text-slate-400">application/json</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">Subscribed Events</span>
                <span className="font-mono text-slate-400">Pull requests (opened, synchronize)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
