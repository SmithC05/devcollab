import { useState, useEffect } from 'react';
import { Copy, UserPlus, MoreHorizontal, Shield, Users } from 'lucide-react';
import PageContainer from '../layout/PageContainer';
import { Button, Spinner, Badge, Avatar, SectionHeader, SearchInput, EmptyState, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, IconButton } from '../ui/index';

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
      <SectionHeader 
        title="Team Members"
        description="Manage members and roles for your workspace."
        action={
          <>
            <Button variant="secondary" icon={Copy} iconSize={13}>Copy Invite Link</Button>
            <Button variant="primary" icon={UserPlus} iconSize={14}>Invite Member</Button>
          </>
        }
      />

      <div className="mb-6 max-w-sm">
        <SearchInput 
          placeholder="Search members by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size={22} /></div>
      ) : error ? (
        <div className="text-center py-20"><p className="text-red-400 text-sm">{error}</p></div>
      ) : (
        <>
          {filteredMembers.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="No members found"
              description="Try adjusting your search or invite a new member."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Activity</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {filteredMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size={32} />
                        <div>
                          <p className="text-[13px] font-medium text-[var(--fg)] leading-tight">{member.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
                        {member.role === 'Owner'
                          ? <Shield size={13} className="text-blue-400" />
                          : <Users size={13} className="text-[var(--text-muted)]" />
                        }
                        {member.role}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="green">{member.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-[12px] text-[var(--text-muted)]">Last active: {member.last_active}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <IconButton 
                        icon={MoreHorizontal} 
                        className="opacity-0 group-hover:opacity-100 ml-auto" 
                        size={15}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </PageContainer>
  );
}
