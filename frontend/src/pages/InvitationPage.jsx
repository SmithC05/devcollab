import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { invitationApi } from '../api/invitationApi';
import { useAuthStore } from '../stores/authStore';

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    // If not authenticated, redirect to login, preserving the return URL
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    
    // Check if there is an action parameter (e.g., action=reject)
    const searchParams = new URLSearchParams(location.search);
    const action = searchParams.get('action');

    const fetchInvitation = async () => {
      try {
        const data = await invitationApi.getInvitation(token);
        setInvitation(data);
        
        // Auto-reject if action=reject is in URL and status is still PENDING
        if (action === 'reject' && data.status === 'PENDING') {
          handleReject();
        }
      } catch (err) {
        setError(err.message || 'Invalid or expired invitation.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, navigate, location]);

  const handleAccept = async () => {
    setActionLoading(true);
    setError('');
    try {
      const result = await invitationApi.acceptInvitation(token);
      
      // Fetch latest workspaces so the app knows the user is now in a workspace
      await useAuthStore.getState().refreshWorkspaces();
      
      // Set the newly joined workspace as the active workspace
      const { workspaces, setActiveWorkspace } = useAuthStore.getState();
      const joinedWorkspace = workspaces.find(w => w.id === result.workspace.id);
      if (joinedWorkspace) {
        setActiveWorkspace(joinedWorkspace.id);
      } else if (workspaces.length > 0) {
        setActiveWorkspace(workspaces[0].id);
      }
      
      setActionSuccess(`Successfully joined ${result.workspace.name}! Redirecting...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    setError('');
    try {
      await invitationApi.rejectInvitation(token);
      setInvitation(prev => ({ ...prev, status: 'REJECTED' }));
    } catch (err) {
      setError(err.message || 'Failed to reject invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--text-muted)]" />
          <p className="text-[14px] text-[var(--text-muted)]">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface-card)] rounded-[20px] border border-[var(--border-subtle)] overflow-hidden shadow-2xl p-8">
        
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">DevCollab</h1>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            {actionSuccess}
          </div>
        )}

        {invitation && !error && !actionSuccess && (
          <div className="text-center">
            {invitation.status === 'PENDING' ? (
              <>
                <p className="text-[15px] text-[var(--text-secondary)] mb-2">
                  <strong className="text-[var(--text-primary)]">{invitation.invitedBy}</strong> invited you to join
                </p>
                <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-4">
                  {invitation.workspace.name}
                </h2>
                
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl py-3 mb-8 inline-block px-6 mx-auto">
                  <p className="text-[13px] text-[var(--text-secondary)]">Role</p>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">{invitation.role}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="w-full h-[48px] rounded-[14px] bg-white text-black font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 size={16} className="animate-spin" />}
                    Accept Invitation
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-full h-[48px] rounded-[14px] bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] font-semibold text-[15px] hover:bg-[var(--border-default)] transition-colors disabled:opacity-50"
                  >
                    Reject Invitation
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <p className="text-[16px] text-[var(--text-primary)]">
                  Invitation {invitation.status.toLowerCase()}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 h-[44px] px-6 rounded-[12px] bg-white text-black font-semibold text-[14px] hover:bg-[#f0f0f0]"
                >
                  Return Home
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
