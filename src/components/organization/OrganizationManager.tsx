import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Organization, Profile } from '../../lib/supabase';
import { Users, Mail, Copy, Plus, Trash2, UserPlus } from 'lucide-react';

interface OrganizationManagerProps {
  onBack: () => void;
}

const OrganizationManager: React.FC<OrganizationManagerProps> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'coach' | 'student'>('student');

  useEffect(() => {
    if (user && profile?.organization_id) {
      fetchOrganizationData();
    }
  }, [user, profile]);

  const fetchOrganizationData = async () => {
    try {
      // Fetch organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile!.organization_id)
        .single();

      if (orgData) {
        setOrganization(orgData);
      }

      // Fetch organization members
      const { data: membersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile!.organization_id);

      if (membersData) {
        setMembers(membersData);
      }

      // Fetch pending invites
      const { data: invitesData } = await supabase
        .from('invites')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .gt('expires_at', new Date().toISOString());

      if (invitesData) {
        setInvites(invitesData);
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { data, error } = await supabase
        .from('invites')
        .insert({
          organization_id: profile!.organization_id!,
          email: inviteEmail,
          role: inviteRole,
          code,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invite:', error);
        return;
      }

      setInvites(prev => [...prev, data]);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Error in createInvite:', error);
    }
  };

  const copyInviteLink = (code: string) => {
    const inviteLink = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteLink);
    // You could add a toast notification here
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600">{organization?.name}</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Organization Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Invites</p>
                <p className="text-2xl font-bold text-gray-900">{invites.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coaches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.user_type === 'coach').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Management */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Invite Management</h2>
              <button
                onClick={() => setShowInviteForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Send Invite</span>
              </button>
            </div>
          </div>

          {/* Invite Form */}
          {showInviteForm && (
            <div className="px-6 py-4 border-b border-gray-200">
              <form onSubmit={createInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'coach' | 'student')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="student">Student</option>
                      <option value="coach">Coach</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Invites */}
          <div className="divide-y divide-gray-200">
            {invites.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Mail className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active invites</h3>
                <p className="text-gray-600">Send invites to add coaches and students to your organization</p>
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-sm text-gray-600">
                        Role: {invite.role} • Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyInviteLink(invite.code)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => deleteInvite(invite.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Organization Members</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {members.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                <p className="text-gray-600">Members will appear here once they accept invites</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-600">
                        Role: {member.user_type} • Joined: {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.user_type === 'business_admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : member.user_type === 'coach'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {member.user_type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationManager; 