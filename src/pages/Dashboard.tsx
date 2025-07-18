import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  UserCheck,
  CheckSquare,
  MessageSquare,
  TrendingUp,
  Calendar,
  Plus,
  Eye,
  Send,
  BarChart3
} from 'lucide-react';

interface DashboardMetrics {
  totalVoters: number;
  activeVoters: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalSmsSent: number;
}

interface Activity {
  id: number;
  action: string;
  user_name: string;
  created_at: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVoters: 0,
    activeVoters: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalSmsSent: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activitiesRes] = await Promise.all([
        axios.get('/analytics/dashboard'),
        axios.get('/analytics/recent-activity'),
      ]);

      setMetrics(metricsRes.data);
      setRecentActivities(activitiesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Voters',
      value: metrics.totalVoters,
      icon: Users,
      color: 'bg-blue-500',
      change: '+2.5%',
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+1.2%',
    },
    {
      title: 'Total Tasks',
      value: metrics.totalTasks,
      icon: CheckSquare,
      color: 'bg-orange-500',
      change: '+5.4%',
    },
    {
      title: 'SMS Sent',
      value: metrics.totalSmsSent,
      icon: MessageSquare,
      color: 'bg-purple-500',
      change: '+12.1%',
    },
  ];

  const quickActions = [
    {
      title: 'Add Voter',
      description: 'Register a new voter',
      icon: Plus,
      href: '/voters?tab=entry',  // tab=add ....new added
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Tasks',
      description: 'Manage pending tasks',
      icon: Eye,
      href: '/tasks',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Send SMS',
      description: 'Compose and send SMS',
      icon: Send,
      href: '/sms',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {card.change}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <a
                    key={index}
                    href={action.href}
                    className={`${action.color} text-white p-4 rounded-lg transition-colors duration-200 block`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6" />
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user_name}
                    </p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}