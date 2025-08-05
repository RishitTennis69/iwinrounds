import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Copy, CheckCircle, Loader2 } from 'lucide-react';

interface InviteSystemProps {
  organizationId: string;
  organizationName: string;
}

const InviteSystem: React.FC<InviteSystemProps> = ({ organizationId, organizationName }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { createInviteCode } = useAuth();

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || loading) {
      return;
    }

    setLoading(true);
    setMessage('');
    setGeneratedCode(null);

    try {
      console.log('🔍 InviteSystem: Sending invite to:', email);
      
      // Generate invite code
      const code = await createInviteCode(organizationId, email);
      
      console.log('🔍 InviteSystem: Generated code:', code);
      setGeneratedCode(code);
      
      // Send email via Supabase (this would be handled by a backend function)
      // For now, we'll just show the code
      setMessage(`Invite code generated: ${code}`);
      setMessageType('success');
      
    } catch (error) {
      console.error('🔍 InviteSystem: Error sending invite:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Send Invite</h2>
        <p className="text-gray-600">
          Send an invite code to a student to join {organizationName}
        </p>
      </div>

      <form onSubmit={handleSendInvite} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Student Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter student's email address"
              required
              disabled={loading}
            />
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Invite Code...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Send Invite</span>
            </>
          )}
        </button>
      </form>

      {generatedCode && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Invite Code Generated</h3>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
              {generatedCode}
            </code>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Share this code with the student. They can use it during signup.
          </p>
        </div>
      )}
    </div>
  );
};

export default InviteSystem; 