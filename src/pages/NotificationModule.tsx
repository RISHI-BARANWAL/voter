import React, { useState, useEffect } from "react";     ///....new added
import axios from "axios";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Bell,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface NotificationLog {
  _id: string;
  message: string;
  recipients: string[];
  readBy: string[];
  createdAt: string;
  createdBy: string;
}

interface NotificationStats {
  total_notifications: number;
  total_reads: number;
  unread_notifications: number;
}

interface TokenPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export default function NotificationModule() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [roles] = useState(["Supervisor", "Karyakarta", "Admin", "Voter (For future)"]);  //....new added Admin and Voter (For future)
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(
    []
  );
  const [notificationStats, setNotificationStats] = useState<NotificationStats>(
    {
      total_notifications: 0,
      total_reads: 0,
      unread_notifications: 0,
    }
  );

  const fetchNotificationLogs = async () => {
    try {
      const res = await axios.get("/notifications/logs");
      setNotificationLogs(res.data);
    } catch (err) {
      toast.error("Failed to fetch notification logs");
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const res = await axios.get("/notifications/stats");
      setNotificationStats(res.data);
    } catch (err) {
      toast.error("Failed to fetch notification stats");
    }
  };

  const token = localStorage.getItem("token");
  let currentUserId = "";

  if (token) {
    const decoded = jwtDecode<TokenPayload>(token);
    currentUserId = decoded.userId;
  }

  useEffect(() => {
    fetchNotificationLogs();
    fetchNotificationStats();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      axios
        .get(`/users/by-role?role=${selectedRole}`)
        .then((res) => {
          const fetchedUsers = res.data || [];
          setUsers(fetchedUsers);
          setSelectedUsers([]); // start with no selection when role changes
          setSelectAll(false); // reset selectAll state
        })
        .catch(() => toast.error("Failed to fetch users"));
    } else {
      setUsers([]);
      setSelectedUsers([]);
      setSelectAll(false);
    }
  }, [selectedRole]); // ❗ Removed selectAll from dependencies

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!selectedRole || selectedUsers.length === 0) {
      toast.error("Please select a role and at least one user");
      return;
    }

    setSending(true);

    try {
      const recipients = selectedUsers;

      await axios.post("/notifications/send", {
        message,
        recipients,
        type: "manual",
      });

      toast.success("SMS sent successfully!");
      setMessage("");
      setSelectedUsers([]);
      setSelectedRole("");
      setSearchTerm("");
      setSelectAll(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  const birthdayTemplate =
    "To...🎉 Happy Birthday! Wishing you a wonderful year ahead. Best regards from your local representative. From...";
  const reminderTemplate =
    "To...📢 Important Reminder: Please don't forget to exercise your voting rights in the upcoming election. From...";
  const announceTemplate =
    "To...📣 Community Announcement: We are organizing a local meeting on [DATE] at [TIME]. Your participation is valuable. From...";

  const templates = [
    { name: "Birthday Wishes", content: birthdayTemplate },
    { name: "Voting Reminder", content: reminderTemplate },
    { name: "Announcement", content: announceTemplate },
  ];

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      const otherUsers = users
        .filter((u) => u._id !== currentUserId)
        .map((u) => u._id);
      setSelectedUsers(otherUsers);
    } else {
      setSelectedUsers([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Notification Module
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Notification Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          label="Total Notifications"
          value={notificationStats.total_notifications}
          icon={<MessageSquare className="h-8 w-8 text-blue-500" />}
        />
        <StatCard
          label="Total Reads"
          value={notificationStats.total_reads}
          icon={<CheckCircle className="h-8 w-8 text-green-500" />}
        />
        <StatCard
          label="Unread Notifications"
          value={notificationStats.unread_notifications}
          icon={<Bell className="h-8 w-8 text-red-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Notification */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compose Notification
            </h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
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
                  <span>
                    Estimated parts: {Math.ceil(message.length / 160)}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Role
                  </label>
                  <select
                    className="mt-1 block w-full h-10 rounded-md border border-black px-3 py-2 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setSelectedUsers([]);
                      setSearchTerm("");
                      setSelectAll(false);
                    }}
                  >
                    <option value="">-- Select a Role --</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Users
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2 block w-full h-10 rounded-md border border-black px-3 py-2 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                      placeholder="Search by username"
                    />

                    <label className="inline-flex items-center mb-4">
                      <input
                        type="checkbox"
                        className="form-checkbox mr-2"
                        checked={selectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;

                          const allOtherUsers = users.filter(
                            (u) => u._id !== currentUserId
                          );
                          const idsToSelect = allOtherUsers.map((u) => u._id);

                          if (checked) {
                            setSelectedUsers(idsToSelect);
                          } else {
                            setSelectedUsers([]);
                          }

                          setSelectAll(checked);
                        }}
                      />

                      <span className="text-sm text-gray-700">Select All</span>
                    </label>

                    <div className="max-h-64 overflow-y-auto border rounded-md border-gray-300 p-2">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                          const isCurrentUser = user._id === currentUserId;
                          const isSelected = selectedUsers.includes(user._id);

                          return (
                            <div
                              key={user._id}
                              className={`flex items-center p-2 mb-1 rounded cursor-pointer ${
                                isSelected ? "bg-blue-100" : "hover:bg-gray-100"
                              }`}
                              onClick={() => {
                                if (isCurrentUser) return; // don't allow selecting yourself
                                let newSelectedUsers;
                                if (isSelected) {
                                  newSelectedUsers = selectedUsers.filter(
                                    (id) => id !== user._id
                                  );
                                } else {
                                  newSelectedUsers = [
                                    ...selectedUsers,
                                    user._id,
                                  ];
                                }
                                setSelectedUsers(newSelectedUsers);

                                // Update selectAll checkbox state
                                const allOtherUserIds = users
                                  .filter((u) => u._id !== currentUserId)
                                  .map((u) => u._id);
                                const allSelected = allOtherUserIds.every(
                                  (id) => newSelectedUsers.includes(id)
                                );
                                setSelectAll(allSelected);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isCurrentUser}
                                onChange={() => {
                                  if (isCurrentUser) return;

                                  const updatedSelectedUsers = isSelected
                                    ? selectedUsers.filter(
                                        (id) => id !== user._id
                                      )
                                    : [...selectedUsers, user._id];

                                  setSelectedUsers(updatedSelectedUsers);

                                  const allOtherUserIds = users
                                    .filter((u) => u._id !== currentUserId)
                                    .map((u) => u._id);

                                  const allSelected = allOtherUserIds.every(
                                    (id) => updatedSelectedUsers.includes(id)
                                  );

                                  setSelectAll(allSelected);
                                }}
                                className="mr-2"
                                onClick={(e) => e.stopPropagation()}
                              />

                              <span>
                                {user.username}{" "}
                                {isCurrentUser && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (You)
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No users found</p>
                      )}
                    </div>
                  </div>
                )}
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-h-96 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          {notificationLogs.length === 0 && <p>No notifications found</p>}
          {notificationLogs.map((log) => (
            <div key={log._id} className="border-b py-2 last:border-none">
              <p className="text-sm font-medium">{log.message}</p>
              <p className="text-xs text-gray-500">
                Sent on: {new Date(log.createdAt).toLocaleString()} |
                Recipients: {log.recipients.length} | Read: {log.readBy.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
