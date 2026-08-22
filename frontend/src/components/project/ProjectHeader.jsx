import { Search, Bell, Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function ProjectHeader() {
  const { projectId } = useParams();

  const projectName = projectId || "P1";

  return (
    <header className="h-16 border-b border-[#222] bg-[#161616] flex items-center justify-between px-6">
      {/* Breadcrumb / Left Side */}
      <div className="flex items-center text-sm">
        <span className="text-zinc-400">Collab</span>
        <span className="mx-3 text-zinc-600">/</span>
        <span className="text-zinc-200 font-medium">{projectName}</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-5">
        {/* Search Shortcut */}
        <button className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#333] hover:bg-[#222] transition-colors text-zinc-400 text-xs">
          <Search className="w-3.5 h-3.5" />
          <span className="font-medium tracking-widest text-[10px]">⌘K</span>
        </button>

        {/* Action Icons */}
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#161616]"></span>
        </button>
      </div>
    </header>
  );
}
