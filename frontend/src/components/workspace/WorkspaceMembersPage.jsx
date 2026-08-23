import { useState, useEffect } from 'react';
import { Copy, UserPlus, MoreHorizontal, Shield, Users } from 'lucide-react';
import PageContainer from '../layout/PageContainer';
import { Button, Spinner, Badge, Avatar, SearchInput, EmptyState, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, IconButton } from '../ui/index';

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
    <PageContainer className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 pt-12 md:pt-14">
      <div className="flex items-start justify-between flex-wrap gap-5 mb-6">
        <div>
          <h1 className="text-[38px] md:text-[42px] font-semibold text-[var(--text-primary)] mb-3 leading-tight">
            Team Members
          </h1>
          <p className="text-[16px] text-[var(--text-secondary)] max-w-2xl">
            Manage members and roles for your workspace.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size={22} /></div>
      ) : error ? (
        <div className="text-center py-20"><p className="text-red-400 text-sm">{error}</p></div>
      ) : (
        <>
          {filteredMembers.length === 0 ? (
            <div className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <SearchInput 
                  placeholder="Search members by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  wrapperClassName="max-w-xl"
                  className="h-11 text-[14px] pl-10"
                />
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="secondary" icon={Copy} iconSize={15} className="h-11 px-4 text-[14px]">
                    Copy Invite Link
                  </Button>
                  <Button variant="primary" icon={UserPlus} iconSize={15} className="h-11 px-5 text-[14px]">
                    Invite Member
                  </Button>
                </div>
              </div>
              <EmptyState 
                icon={Users}
                title="No members found"
                description="Try adjusting your search or invite a new member."
              />
            </div>
          ) : (
            <div className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-lg p-6 min-h-[320px]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <SearchInput 
                  placeholder="Search members by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  wrapperClassName="max-w-xl"
                  className="h-11 text-[14px] pl-10"
                />
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="secondary" icon={Copy} iconSize={15} className="h-11 px-4 text-[14px]">
                    Copy Invite Link
                  </Button>
                  <Button variant="primary" icon={UserPlus} iconSize={15} className="h-11 px-5 text-[14px]">
                    Invite Member
                  </Button>
                </div>
              </div>

              <Table className="rounded-lg border-[var(--border-strong)]">
                <TableHeader>
                  <TableHead className="text-[12px] px-6 py-4">User</TableHead>
                  <TableHead className="text-[12px] px-6 py-4">Role</TableHead>
                  <TableHead className="text-[12px] px-6 py-4">Status</TableHead>
                  <TableHead className="hidden md:table-cell text-[12px] px-6 py-4">Activity</TableHead>
                  <TableHead className="px-6 py-4"></TableHead>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map(member => (
                    <TableRow key={member.id} className="h-[72px]">
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar name={member.name} size={40} />
                          <div>
                            <p className="text-[15px] font-semibold text-[var(--fg)] leading-tight">{member.name}</p>
                            <p className="text-[13px] text-[var(--text-muted)] mt-1">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)]">
                          {member.role === 'Owner'
                            ? <Shield size={15} className="text-blue-400" />
                            : <Users size={15} className="text-[var(--text-muted)]" />
                          }
                          {member.role}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Badge variant="green" className="text-[12px] px-2.5 py-1">{member.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-6 py-5">
                        <span className="text-[14px] text-[var(--text-muted)]">Last active: {member.last_active}</span>
                      </TableCell>
                      <TableCell className="text-right px-6 py-5">
                        <IconButton 
                          icon={MoreHorizontal} 
                          className="opacity-0 group-hover:opacity-100 ml-auto" 
                          size={16}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
