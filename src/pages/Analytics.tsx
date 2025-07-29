import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  gender: Array<{ gender: string; count: number }>;
  ageGroups: Array<{ age_group: string; count: number }>;
  areas: Array<{ ward_area: string; voter_count: number }>;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    gender: [],
    ageGroups: [],
    areas: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState('gender');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [genderRes, ageRes, areaRes] = await Promise.all([
        axios.get('/analytics/gender'),
        axios.get('/analytics/age-groups'),
        axios.get('/analytics/areas')
      ]);

      setAnalyticsData({
        gender: genderRes.data,
        ageGroups: ageRes.data,
        areas: areaRes.data
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const genderChartData = {
    labels: analyticsData.gender.map(item => item.gender || 'Unknown'),
    datasets: [
      {
        label: 'Number of Voters',
        data: analyticsData.gender.map(item => item.count),
        backgroundColor: [
          '#3B82F6', // Blue
          '#EF4444', // Red
          '#10B981', // Green
          '#F59E0B', // Amber
        ],
        borderWidth: 2,
      },
    ],
  };

  const ageGroupChartData = {
    labels: analyticsData.ageGroups.map(item => item.age_group),
    datasets: [
      {
        label: 'Number of Voters',
        data: analyticsData.ageGroups.map(item => item.count),
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1,
      },
    ],
  };

  const areaChartData = {
    labels: analyticsData.areas.map(item => item.ward_area),
    datasets: [
      {
        label: 'Number of Voters',
        data: analyticsData.areas.map(item => item.voter_count),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Voter Analytics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Gender Distribution',
      },
    },
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex flex-wrap m-2 space-x-2">   {/* ///....new added */}
            {[
              { key: 'gender', label: 'Gender Distribution', icon: PieChart },
              { key: 'age', label: 'Age Groups', icon: BarChart3 },
              { key: 'area', label: 'Area-wise', icon: TrendingUp },
            ].map((chart) => {
              const Icon = chart.icon;
              return (
                <button
                  key={chart.key}
                  onClick={() => setSelectedChart(chart.key)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    selectedChart === chart.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{chart.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-96">
              {selectedChart === 'gender' && analyticsData.gender.length > 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="w-80 h-80">
                    <Doughnut data={genderChartData} options={doughnutOptions} />
                  </div>
                </div>
              )}
              
              {selectedChart === 'age' && analyticsData.ageGroups.length > 0 && (
                <Bar data={ageGroupChartData} options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Age Group Distribution'
                    }
                  }
                }} />
              )}
              
              {selectedChart === 'area' && analyticsData.areas.length > 0 && (
                <Bar data={areaChartData} options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Top Areas by Voter Count'
                    }
                  }
                }} />
              )}

              {((selectedChart === 'gender' && analyticsData.gender.length === 0) ||
                (selectedChart === 'age' && analyticsData.ageGroups.length === 0) ||
                (selectedChart === 'area' && analyticsData.areas.length === 0)) && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add some voters to see analytics data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Voters</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.gender.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Areas Covered</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.areas.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Age Groups</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.ageGroups.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Breakdown</h3>
          <div className="space-y-2">
            {analyticsData.gender.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-700">
                  {item.gender || 'Unknown'}
                </span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Areas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Areas</h3>
          <div className="space-y-2">
            {analyticsData.areas.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-700">
                  {item.ward_area}
                </span>
                <span className="text-sm font-bold text-gray-900">{item.voter_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}