import { Search, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function Topbar({ workspaceName }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-10
                 h-[44px] shrink-0
                 border-b border-[#1F1F1F]
                 bg-[#0D0D0D]"
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1 text-[12px] shrink-0">
        <span className="text-[#777777]">
          {workspaceName || 'Team Thunder'}
        </span>
        <span className="text-[#444444] mx-1">/</span>
        <span className="text-gray-100 font-medium">Overview</span>
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center px-8">
        <div className="relative w-full max-w-[310px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search size={12} className="text-[#555555]" />
          </div>
          <input
            type="text"
            className="block w-full pl-7 pr-9 h-[26px]
                       border border-[#2A2A2A] rounded-md text-[11px]
                       bg-[#161616] text-gray-100
                       placeholder-[#555555]
                       focus:outline-none focus:border-[#444]
                       transition-colors"
            placeholder="Search or jump to..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <span className="text-[9px] text-[#555555] border border-[#333] rounded px-1">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Right: icons */}
      <div className="flex items-center gap-3.5 shrink-0">
        <button
          onClick={toggleTheme}
          className="text-[#666666] hover:text-gray-300 transition-colors"
        >
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <button className="text-[#666666] hover:text-gray-300 transition-colors">
          <Bell size={14} />
        </button>

        <div className="w-6 h-6 rounded-full bg-[#2A2A2A] text-[#999] flex items-center justify-center font-medium text-[10px] cursor-pointer hover:opacity-80 transition-opacity">
          d
        </div>
      </div>
    </header>
  );
}
