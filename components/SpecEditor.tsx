import React, { useState } from 'react';
import { FileNode } from '../types';
import { FileText, Folder, FolderOpen, Save, ChevronRight, ChevronDown } from 'lucide-react';

interface SpecEditorProps {
  files: FileNode[];
  onSave: (fileId: string, content: string) => void;
}

const FileTreeItem: React.FC<{ 
  node: FileNode; 
  level: number; 
  activeFileId: string | null; 
  onSelect: (node: FileNode) => void;
  onToggle: (node: FileNode) => void;
}> = ({ node, level, activeFileId, onSelect, onToggle }) => {
  const isFolder = node.type === 'folder';
  const isActive = node.id === activeFileId;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors ${
          isActive ? 'bg-neutral-800 text-green-500' : 'hover:bg-neutral-900 text-neutral-400'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => isFolder ? onToggle(node) : onSelect(node)}
      >
        <span className="opacity-70">
          {isFolder ? (
            node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
             <span className="w-3.5" /> 
          )}
        </span>
        {isFolder ? (
          node.isOpen ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />
        ) : (
          <FileText size={14} className={node.name.endsWith('.md') ? 'text-yellow-600' : 'text-blue-500'} />
        )}
        <span className="text-xs font-mono">{node.name}</span>
      </div>
      {isFolder && node.isOpen && node.children?.map(child => (
        <FileTreeItem 
          key={child.id} 
          node={child} 
          level={level + 1} 
          activeFileId={activeFileId} 
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

export const SpecEditor: React.FC<SpecEditorProps> = ({ files: initialFiles, onSave }) => {
  const [files, setFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const toggleFolder = (target: FileNode) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === target.id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setFiles(toggleNode(files));
  };

  const selectFile = (node: FileNode) => {
    if (isDirty && activeFile) {
        // Simple auto-save mock or confirm could go here
    }
    setActiveFile(node);
    setEditorContent(node.content || '');
    setIsDirty(false);
  };

  const handleSave = () => {
    if (activeFile) {
      onSave(activeFile.id, editorContent);
      setIsDirty(false);
      
      // Update local state content
      const updateContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            if (node.id === activeFile.id) return { ...node, content: editorContent };
            if (node.children) return { ...node, children: updateContent(node.children) };
            return node;
        });
      };
      setFiles(updateContent(files));
    }
  };

  return (
    <div className="flex h-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      {/* File Explorer */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-3 border-b border-neutral-800 text-xs font-bold text-neutral-500 tracking-wider">
          PROJECT EXPLORER
        </div>
        <div className="flex-grow overflow-y-auto py-2">
           {files.map(node => (
             <FileTreeItem 
               key={node.id} 
               node={node} 
               level={0} 
               activeFileId={activeFile?.id || null} 
               onSelect={selectFile}
               onToggle={toggleFolder}
             />
           ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-grow flex flex-col bg-black">
        {activeFile ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-neutral-400" />
                <span className="text-xs font-mono text-neutral-300">{activeFile.name}</span>
                {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2" />}
              </div>
              <button 
                onClick={handleSave}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-colors ${
                  isDirty 
                    ? 'bg-green-900 text-green-400 hover:bg-green-800' 
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <Save size={14} /> SAVE SPEC
              </button>
            </div>
            <textarea
              className="flex-grow w-full h-full bg-black text-neutral-300 p-4 font-mono text-sm resize-none focus:outline-none custom-scrollbar leading-relaxed"
              value={editorContent}
              onChange={(e) => {
                setEditorContent(e.target.value);
                setIsDirty(true);
              }}
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-neutral-600 flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <FolderOpen size={32} />
            </div>
            <p className="font-mono text-sm">Select a SPEC or SKILL to edit</p>
          </div>
        )}
      </div>
    </div>
  );
};