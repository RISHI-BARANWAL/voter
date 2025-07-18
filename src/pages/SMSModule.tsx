import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

interface SMSLog {
  id: number;
  message: string;
  total_count: number;
  success_count: number;
  failure_count: number;
  sent_at: string;
  sent_by_name?: string;
  type: string;
}

interface SMSStats {
  total_campaigns: number;
  total_sent: number;
  total_success: number;
  total_failure: number;
  today_campaigns: number;
  today_sent: number;
}

export default function SMSModule() {
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [customNumbers, setCustomNumbers] = useState('');
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats>({
    total_campaigns: 0,
    total_sent: 0,
    total_success: 0,
    total_failure: 0,
    today_campaigns: 0,
    today_sent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchSMSLogs();
    fetchSMSStats();
  }, []);

  const fetchSMSLogs = async () => {
    try {
      const response = await axios.get('/sms/logs');
      setSmsLogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch SMS logs');
    }
  };

  const fetchSMSStats = async () => {
    try {
      const response = await axios.get('/sms/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching SMS stats:', error);
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    
    try {
      let recipients: string[] = [];
      
      if (recipientType === 'custom') {
        recipients = customNumbers.split(',').map(num => num.trim()).filter(Boolean);
        if (recipients.length === 0) {
          toast.error('Please enter at least one phone number');
          setSending(false);
          return;
        }
      } else {
        // Fetch recipients based on type (all voters, specific roles, etc.)
        // For demo purposes, using placeholder numbers
        recipients = ['1234567890', '0987654321'];
      }

      await axios.post('/sms/send', {
        message,
        recipients,
        type: 'manual'
      });

      toast.success('SMS sent successfully!');
      setMessage('');
      setCustomNumbers('');
      fetchSMSLogs();
      fetchSMSStats();
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const birthdayTemplate = "🎉 Happy Birthday! Wishing you a wonderful year ahead. Best regards from your local representative.";
  const reminderTemplate = "📢 Important Reminder: Please don't forget to exercise your voting rights in the upcoming election.";
  const announceTemplate = "📣 Community Announcement: We are organizing a local meeting on [DATE] at [TIME]. Your participation is valuable.";

  const templates = [
    { name: 'Birthday Wishes', content: birthdayTemplate },
    { name: 'Voting Reminder', content: reminderTemplate },
    { name: 'Announcement', content: announceTemplate },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">SMS Module</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SMS Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_campaigns}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total SMS Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_sent}</p>
            </div>
            <Send className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_sent > 0 ? Math.round((stats.total_success / stats.total_sent) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's SMS</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today_sent}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose SMS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose SMS</h2>
            
            <form onSubmit={handleSendSMS} className="space-y-4">
              {/* Message Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setMessage(template.content)}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={160}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Character count: {message.length}/160</span>
                  <span>Estimated parts: {Math.ceil(message.length / 160)}</span>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Send to
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="all"
                        checked={recipientType === 'all'}
                        onChange={(e) => setRecipientType(e.target.value)}
                        className="mr-2"
                      />
                      All Voters with Mobile
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="karyakarta"
                        checked={recipientType === 'karyakarta'}
                        onChange={(e) => setRecipientType(e.target.value)}
                        className="mr-2"
                      />
                      Karyakartas
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="custom"
                        checked={recipientType === 'custom'}
                        onChange={(e) => setRecipientType(e.target.value)}
                        className="mr-2"
                      />
                      Custom Numbers
                    </label>
                  </div>
                  
                  {recipientType === 'custom' && (
                    <textarea
                      rows={2}
                      value={customNumbers}
                      onChange={(e) => setCustomNumbers(e.target.value)}
                      placeholder="Enter phone numbers separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send SMS</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* SMS History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent SMS</h2>
          <div className="space-y-4">
            {smsLogs.length > 0 ? (
              smsLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="text-sm text-gray-900 font-medium mb-1">
                    {log.message.substring(0, 50)}{log.message.length > 50 ? '...' : ''}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {log.success_count}/{log.total_count} sent
                    </span>
                    <span>{new Date(log.sent_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">{log.success_count} delivered</span>
                    {log.failure_count > 0 && (
                      <>
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">{log.failure_count} failed</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No SMS history yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}