import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  // UserPlus,
  Database,
  CheckSquare,
  BarChart3,
  Search,
  Settings,
  MessageSquare,
  Upload,
  // Download,
  // Shield,
  // FileText,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  InfoIcon,
  HomeIcon,
  ClockIcon,
} from "lucide-react";
import axios from "axios";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      roles: ["Super Admin", "Admin"],
    },
    { name: "Voter Data Entry", href: "/voters?tab=entry", icon: Database },
    { name: "Task Management", href: "/tasks", icon: CheckSquare },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Search & Filter", href: "/voters?tab=search", icon: Search },
    {
      name: "Notification Module",
      href: "/notifications",
      icon: MessageSquare,
    },
    {
      name: "Import/Export",
      href: "/voters?tab=import",
      icon: Upload,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["Super Admin", "Admin"],
    },
    { name: 'Vilage Program', href: '/village', icon: HomeIcon, roles: ['Super Admin', 'Admin'], }, ///....new added 
    { name: 'Appointment', href: '/appointment', icon: ClockIcon, roles: ['Super Admin', 'Admin'], }, ///....new added 
    { name: 'Service/Complaint', href: '/service', icon: InfoIcon, roles: ['Super Admin', 'Admin'], } ///....new added 
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "")
  );

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Calculate unread count based on readBy array including current user id
  const unreadCount = notifications.filter(
    (n) => !n.readBy?.includes(user?._id)  //....new added id or _id
  ).length;

  const toggleNotif = () => {
    setIsNotifOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("/notifications/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  const markAsRead = async (id: string) => {
    try {
      await axios.post(
        `/notifications/read/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id && user ? { ...n, readBy: [...(n.readBy || []), user._id] } : n    //....new added && user ? or user._id
        )
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard";
    }

    if (query) {
      return currentPath === path && currentSearch === `?${query}`;
    }

    return currentPath === path && !currentSearch;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:inset-y-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">VoterAdmin</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive(item.href)
                        ? "text-blue-700"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <hr></hr>
          <div className="mt-2 text-xs text-center text-gray-500">
            Developed By:- @SBS Tech Solution
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 pr-12">  {/* ....new added pr-12 for padding */}
                Welcome back, {user?.full_name}
              </div>

              <div className="fixed top-4 right-4 z-50 text-right" ref={notifRef}>    {/* ....new added fixed in Notification Bell */}
                <button
                  onClick={toggleNotif}
                  className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Notifications"
                  aria-haspopup="true"
                  aria-expanded={isNotifOpen}
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="px-4 py-2 text-sm text-gray-500">
                          No notifications
                        </p>
                      )}
                      {notifications.map((notif) => (
                        <button
                          key={notif._id}
                          onClick={() => {
                            if (!notif.readBy?.includes(user?._id))  //....new added id or _id
                              markAsRead(notif._id);
                          }}
                          type="button"
                          className={`flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            !notif.readBy?.includes(user?._id)   //....new added id or _id
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          {!notif.readBy?.includes(user?._id) && (    //....new added id or _id
                            <span className="inline-block w-2 h-2 mr-2 bg-red-600 rounded-full flex-shrink-0" />
                          )}
                          <span className="flex-1">{notif.message}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
