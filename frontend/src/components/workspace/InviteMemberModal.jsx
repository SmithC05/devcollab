import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { invitationApi } from '../../api/invitationApi';
import { getAvailableRolesToInvite } from '../../utils/permissions';

export default function InviteMemberModal({ isOpen, onClose, onInviteSuccess, currentUserRole }) {
  const { activeWorkspace } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const ALL_ROLE_OPTIONS = [
    { value: 'ADMIN', label: 'Admin', description: 'Workspace administration' },
    { value: 'LEAD', label: 'Lead', description: 'Team/project leadership' },
    { value: 'DEVELOPER', label: 'Developer', description: 'Development and collaboration access' }
  ];

  const availableRoles = getAvailableRolesToInvite(currentUserRole);
  const ROLE_OPTIONS = ALL_ROLE_OPTIONS.filter(r => availableRoles.includes(r.value));

  // Reset role to first available if current role is not in the list
  useEffect(() => {
    if (ROLE_OPTIONS.length > 0 && !ROLE_OPTIONS.find(r => r.value === role)) {
      setRole(ROLE_OPTIONS[0].value);
    }
  }, [currentUserRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    
    try {
      await invitationApi.createInvitation(activeWorkspace.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role
      });
      
      // Reset form
      setName('');
      setEmail('');
      setRole('DEVELOPER');
      
      if (onInviteSuccess) onInviteSuccess();
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to send invitation' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full pointer-events-auto shadow-2xl overflow-hidden"
              style={{
                maxWidth: 480,
                background: '#171717',
                borderRadius: 18,
                border: '1px solid #292929'
              }}
            >
              <div style={{ padding: '24px' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-[18px] sm:text-[20px] font-bold text-white tracking-tight leading-tight">
                    Invite Team Member
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="p-1 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[var(--border-default)] transition-colors focus-visible:outline-none"
                    aria-label="Close modal"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <p className="text-[13px] sm:text-[14px] leading-[1.5] text-[#A3A3A3] mb-6">
                  Invite a colleague to collaborate in {activeWorkspace?.name || 'this workspace'}.
                  They will receive an email invitation.
                </p>

                {errors.form && (
                  <p role="alert" className="text-[12px] text-[#f87171] bg-[#2a1111] border border-[#3a1a1a] rounded-xl px-4 py-3 mb-6">
                    {errors.form}
                  </p>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Name Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="invite-name" className="text-[13px] sm:text-[14px] font-semibold text-white">
                      Full Name (Optional)
                    </label>
                    <input
                      id="invite-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      disabled={isLoading}
                      className="
                        w-full h-[52px] px-4 rounded-[14px] text-[14px] sm:text-[15px]
                        bg-[#0F0F0F] text-white placeholder:text-[var(--text-muted)]
                        border border-[#292929] transition-colors outline-none
                        focus:border-[var(--text-muted)]
                      "
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="invite-email" className="text-[13px] sm:text-[14px] font-semibold text-white">
                      Email Address *
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        setErrors(p => ({ ...p, email: undefined }));
                      }}
                      placeholder="sarah@acmecorp.com"
                      disabled={isLoading}
                      className={`
                        w-full h-[52px] px-4 rounded-[14px] text-[14px] sm:text-[15px]
                        bg-[#0F0F0F] text-white placeholder:text-[var(--text-muted)]
                        border transition-colors outline-none
                        focus:border-[var(--text-muted)]
                        ${errors.email ? 'border-[#f87171]' : 'border-[#292929]'}
                      `}
                    />
                    {errors.email && <p className="text-[12px] text-[#f87171]">{errors.email}</p>}
                  </div>

                  {/* Role Select */}
                  <div className="flex flex-col gap-2 relative">
                    <label htmlFor="invite-role" className="text-[13px] sm:text-[14px] font-semibold text-white">
                      Workspace Role
                    </label>
                    <div className="relative">
                      <select
                        id="invite-role"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        disabled={isLoading}
                        className="
                          appearance-none w-full h-[52px] px-4 rounded-[14px] text-[14px] sm:text-[15px]
                          bg-[#0F0F0F] text-white border border-[#292929] transition-colors outline-none
                          focus:border-[var(--text-muted)] cursor-pointer disabled:cursor-not-allowed
                        "
                      >
                        {ROLE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    {/* Role description */}
                    <p className="text-[12px] text-[#A3A3A3]">
                      {ROLE_OPTIONS.find(r => r.value === role)?.description}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="
                        h-[44px] px-5 rounded-[12px] text-[13px] sm:text-[14px] font-semibold text-white
                        bg-transparent border border-[#292929]
                        hover:bg-[var(--border-default)] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        h-[44px] px-5 rounded-[12px] text-[13px] sm:text-[14px] font-semibold text-black
                        bg-white border border-white
                        hover:bg-[#f0f0f0] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                      "
                    >
                      {isLoading && <Loader2 size={16} className="animate-spin" />}
                      {isLoading ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
