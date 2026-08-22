import { useState, useEffect } from 'react';
import { Copy, UserPlus, MoreHorizontal, Shield, Users, Search } from 'lucide-react';
import { Button } from '../ui/index';
import InviteMemberModal from './InviteMemberModal';
import { useAuthStore } from '../../stores/authStore';

export default function WorkspaceMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  
  const { user, activeWorkspace } = useAuthStore();

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

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInviteSuccess = () => {
    setInviteSuccessMsg('Invitation sent successfully! Pending invitations will appear soon.');
    setTimeout(() => setInviteSuccessMsg(''), 5000);
    fetchMembers();
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    // Format to "13 Jul 2026"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  return (
    <div className="w-full max-w-[1180px] mx-auto px-[48px] pt-[48px] pb-[80px]">
      
      {/* Top Header & Actions */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-1px] text-white">
            Team Members
          </h1>
          <p className="text-[14px] text-[#737373] mt-2">
            {members.length} member{members.length !== 1 && 's'} in <span className="font-medium">{activeWorkspace?.name || 'Workspace'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-[42px] px-[16px] rounded-[10px] bg-[#111111] border border-[#242424] text-white font-medium text-[14px] hover:bg-[#1a1a1a] transition-colors">
            <Copy size={15} className="text-[#A3A3A3]" />
            Copy Invite Link
          </button>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 h-[42px] px-[18px] rounded-[10px] bg-white text-black font-semibold text-[14px] hover:bg-[#f0f0f0] transition-colors"
          >
            <UserPlus size={15} />
            Invite Member
          </button>
        </div>
      </div>

      {inviteSuccessMsg && (
        <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[14px]">
          {inviteSuccessMsg}
        </div>
      )}

      {/* Search Field */}
      <div className="mt-10 mb-10 relative w-full max-w-[400px]">
        <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#737373]" size={16} />
        <input 
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-[44px] bg-[#111111] border border-[#242424] rounded-[12px] pl-[42px] pr-4 text-[14px] text-white placeholder-[#737373] focus:outline-none focus:border-[#404040] transition-colors"
        />
      </div>

      {/* Table / Member List */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#737373]">Loading members...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 text-sm">{error}</div>
      ) : (
        <div className="w-full">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-[#1F1F1F] rounded-2xl bg-[#0B0B0B]">
              <Users size={32} className="text-[#404040] mb-4" />
              <p className="text-white text-[16px] font-medium mb-1">No members found</p>
              <p className="text-[#737373] text-[14px]">Try adjusting your search or invite a new member.</p>
            </div>
          ) : (
            <div className="w-full">
              {/* Header Row */}
              <div className="flex items-center pb-4 text-[11px] font-semibold tracking-[0.08em] text-[#737373] uppercase border-b border-[#1F1F1F]">
                <div className="w-[45%] lg:w-[50%]">USER</div>
                <div className="w-[20%] lg:w-[18%]">ROLE</div>
                <div className="w-[20%] lg:w-[18%]">JOINED</div>
                <div className="flex-1 text-right">ACTIONS</div>
              </div>
              
              {/* Member Rows */}
              <div className="flex flex-col">
                {filteredMembers.map((member) => {
                  const isPending = member.status === 'Pending';
                  const isYou = user?.email?.toLowerCase() === member.email?.toLowerCase();
                  
                  // Extract initials for avatar if no image (using green/brown based on initials or role)
                  const initials = member.name ? member.name.substring(0, 1).toUpperCase() : '?';
                  const avatarColor = member.role === 'OWNER' ? 'bg-[#5e4933] text-[#ebd2ba]' : 
                                      isPending ? 'bg-[#292929] text-[#a3a3a3]' : 
                                      'bg-[#2A4B29] text-[#A6CCA4]'; // matching the green in screenshot

                  return (
                    <div key={member.id} className="flex items-center py-[14px] border-b border-[#1F1F1F] hover:bg-[#0f0f0f] transition-colors -mx-4 px-4 rounded-lg">
                      
                      {/* USER Column */}
                      <div className="w-[45%] lg:w-[50%] flex items-center gap-4">
                        <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[15px] font-medium ${avatarColor}`}>
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-white">{member.name}</span>
                            {isYou && (
                              <span className="px-1.5 py-[2px] rounded bg-[#242424] text-[10px] font-bold text-[#A3A3A3]">YOU</span>
                            )}
                            {isPending && (
                              <span className="px-1.5 py-[2px] rounded bg-[#4a3f12] text-[10px] font-bold text-[#e6c735]">PENDING</span>
                            )}
                          </div>
                          <span className="text-[13px] text-[#737373] mt-[2px]">{member.email}</span>
                        </div>
                      </div>

                      {/* ROLE Column */}
                      <div className="w-[20%] lg:w-[18%] flex items-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#161616] border border-[#242424] text-[11px] font-semibold text-[#D4D4D4] uppercase">
                          {member.role === 'OWNER' && <Shield size={10} className="text-[#e8b56f]" />}
                          {member.role}
                        </div>
                      </div>

                      {/* JOINED Column */}
                      <div className="w-[20%] lg:w-[18%] text-[13px] text-[#737373]">
                        {isPending ? '—' : formatDate(member.joined_at || member.created_at)}
                      </div>

                      {/* ACTIONS Column */}
                      <div className="flex-1 flex justify-end">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#242424] transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onInviteSuccess={handleInviteSuccess} 
      />
    </div>
  );
}
