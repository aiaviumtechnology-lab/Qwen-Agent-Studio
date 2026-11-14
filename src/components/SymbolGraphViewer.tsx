import React, { useState, useEffect } from 'react';
import {
  Network,
  Layers,
  Search,
  Filter,
  ArrowRight,
  Code2,
  FileCode,
  Box,
  Braces,
  Sparkles,
  RefreshCw,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import type { PresetRepository, RepoSymbolGraph, SymbolNode } from '../types/agent';

interface SymbolGraphViewerProps {
  currentRepo: PresetRepository;
  onSelectFile?: (path: string) => void;
}

export const SymbolGraphViewer: React.FC<SymbolGraphViewerProps> = ({
  currentRepo,
  onSelectFile,
}) => {
  const [graph, setGraph] = useState<RepoSymbolGraph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchGraph = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/repo/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoId: currentRepo.id,
            files: currentRepo.files,
          }),
        });

        if (res.ok && isMounted) {
          const data: RepoSymbolGraph = await res.json();
          setGraph(data);
          if (data.nodes.length > 0) {
            setSelectedNodeId(data.nodes[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to index repository symbol graph:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGraph();
    return () => {
      isMounted = false;
    };
  }, [currentRepo]);

  const filteredNodes = (graph?.nodes || []).filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.file.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKind = kindFilter === 'all' || node.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) || filteredNodes[0];

  const connectedEdges = (graph?.edges || []).filter(
    (e) => e.source === selectedNode?.id || e.target === selectedNode?.id
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Repository AST Symbol Graph & Cross-File Index
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Indexed <span className="text-indigo-400 font-mono">{graph?.totalSymbols || 0}</span> AST symbols with{' '}
            <span className="text-emerald-400 font-mono">{graph?.crossFileReferences || 0}</span> cross-file call edges
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Kinds</option>
            <option value="function">Functions</option>
            <option value="struct">Structs</option>
            <option value="class">Classes</option>
            <option value="file">Files</option>
          </select>
        </div>
      </div>

      {/* Main Split Body: Node List & Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Symbol Grid */}
        <div className="w-full lg:w-2/3 border-r border-slate-800 p-4 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs">Parsing lexical AST & indexing cross-file dependencies...</span>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No matching AST symbols found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredNodes.map((node) => {
                const isSelected = node.id === selectedNode?.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {node.kind === 'function' ? (
                            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                          ) : node.kind === 'struct' || node.kind === 'class' ? (
                            <Box className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className="text-xs font-mono font-semibold text-slate-200">
                            {node.name}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          {node.kind}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {node.file}:{node.line}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                      <span>In: {node.incomingEdges}</span>
                      <span>Out: {node.outgoingEdges}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Symbol Call Hierarchy & Cross-File Impact */}
        <div className="w-full lg:w-1/3 p-5 bg-slate-950 overflow-y-auto space-y-5">
          {selectedNode ? (
            <>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                  Selected AST Symbol
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {selectedNode.name}
                  </h3>
                  <span className="text-xs font-mono text-indigo-400">{selectedNode.kind}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                  <span>{selectedNode.file}:{selectedNode.line}</span>
                  {onSelectFile && (
                    <button
                      onClick={() => onSelectFile(selectedNode.file)}
                      className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Jump</span>
                    </button>
                  )}
                </div>
              </div>

              {selectedNode.signature && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Signature / Declaration</span>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
                    {selectedNode.signature}
                  </pre>
                </div>
              )}

              {/* Connected Dependency Edges */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">
                  Cross-File Dependency Edges ({connectedEdges.length})
                </span>

                {connectedEdges.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No cross-file edges detected for this symbol.</p>
                ) : (
                  <div className="space-y-1.5">
                    {connectedEdges.map((edge) => {
                      const isOutgoing = edge.source === selectedNode.id;
                      const otherId = isOutgoing ? edge.target : edge.source;
                      const otherNode = graph?.nodes.find((n) => n.id === otherId);

                      return (
                        <div
                          key={edge.id}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                              {edge.relation}
                            </span>
                            <span className="font-mono text-slate-200 truncate">
                              {otherNode?.name || otherId}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {isOutgoing ? 'outgoing' : 'caller'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500">
              Select an AST symbol to inspect call hierarchy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

