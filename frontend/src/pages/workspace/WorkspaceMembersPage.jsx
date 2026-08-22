import { useState, useEffect } from 'react';
import { Search, Copy, UserPlus, MoreHorizontal, Shield, Mail, Loader2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../../components/layout/PageContainer';

export default function WorkspaceMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/workspace/members/');
        if (!response.ok) throw new Error('Failed to load members');
        const data = await response.json();
        setMembers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 mb-1">Team Members</h1>
          <p className="text-[13px] text-[#888888]">Manage members and roles for your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-[36px] px-4 bg-[#161616] border border-[#2A2A2A] text-gray-200 font-medium text-[13px] rounded-md hover:border-[#444] hover:bg-[#1A1A1A] transition-colors flex items-center gap-2">
            <Copy size={14} />
            Copy Invite Link
          </button>
          <button className="h-[36px] px-4 bg-white text-black font-medium text-[13px] rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2">
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      <div className="mb-6 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={14} />
        <input 
          type="text" 
          placeholder="Search members by name or email..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-[36px] bg-[#161616] border border-[#2A2A2A] rounded-md pl-9 pr-4 text-[13px] text-gray-100 focus:outline-none focus:border-[#444] placeholder-[#555]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#666]">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#111] text-[11px] font-medium text-[#777] uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Activity</th>
                <th className="px-6 py-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="group hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-gray-300 font-medium shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-100 leading-tight">{member.name}</p>
                        <p className="text-[12px] text-[#777] mt-0.5">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-300">
                      {member.role === 'Owner' ? <Shield size={14} className="text-blue-500" /> : <Users size={14} className="text-[#666]" />}
                      {member.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#777]">
                    Last active: {member.last_active}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#555] hover:text-white p-1 rounded-md hover:bg-[#2A2A2A] transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Users size={32} className="text-[#444] mb-4" />
              <p className="text-[14px] font-medium text-gray-200">No members found</p>
              <p className="text-[13px] text-[#666] mt-1">Try adjusting your search criteria or invite a new member.</p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
