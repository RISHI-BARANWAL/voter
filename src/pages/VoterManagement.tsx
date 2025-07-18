import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Users,
  Phone,
  PhoneOff,
  FileText,
  Database
} from 'lucide-react';

interface Voter {
  _id: string; // id: number; // 
  full_name: string;
  age?: number;
  gender?: string;
  mobile_number?: string;
  ward_area?: string;
  booth?: string;
  political_preference?: string;
  voter_id?: string;
  is_dead: boolean;
  created_at: string;
}

export default function VoterManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get current tab from URL
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'entry';

  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');

  // Import state
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    father_husband_name: '',
    house_no: '',
    category: '',
    caste: '',
    sub_caste: '',
    sub_sub_caste: '',
    ward_area: '',
    district: '',
    taluka: '',
    village: '',
    city: '',
    mobile_number: '',
    whatsapp_number: '',
    head_of_house: 0,
    political_preference: '',
    party_designation: '',
    occupation: '',
    occupation_subcategory: '',
    voter_id: '',
    present_in_city: true,
    present_city_name: '',
    date_of_birth: '',
    booth: '',
  });

  useEffect(() => {
    if (currentTab === 'entry' || currentTab === 'search') {
      fetchVoters();
    }
  }, [currentTab, currentPage, searchTerm, genderFilter, areaFilter, mobileFilter, ageMin, ageMax]);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(genderFilter && { gender: genderFilter }),
        ...(areaFilter && { area: areaFilter }),
        ...(mobileFilter && { mobile_filter: mobileFilter }),
        ...(ageMin && { age_min: ageMin }),
        ...(ageMax && { age_max: ageMax }),
      });

      const response = await axios.get(`/voters?${params}`);
      setVoters(response.data.voters || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalVoters(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching voters:', error);
      toast.error('Failed to fetch voters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVoter) {
        const response = await axios.put(`/voters/${editingVoter._id}`, formData);
        console.log('Update response:', response.data);
        toast.success('Voter updated successfully');
      } else {
        const response = await axios.post('/voters', formData);
        console.log('Create response:', response.data);
        toast.success('Voter created successfully');
      }
      
      fetchVoters();
      resetForm();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (voterId: string) => {
    if (!confirm('Are you sure you want to delete this voter?')) return;
    
    try {
      await axios.delete(`/voters/${voterId}`);
      toast.success('Voter deleted successfully');
      fetchVoters();
    } catch (error) {
      toast.error('Failed to delete voter');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      age: '',
      gender: '',
      father_husband_name: '',
      house_no: '',
      category: '',
      caste: '',
      sub_caste: '',
      sub_sub_caste: '',
      ward_area: '',
      district: '',
      taluka: '',
      village: '',
      city: '',
      mobile_number: '',
      whatsapp_number: '',
      head_of_house: 0,
      political_preference: '',
      party_designation: '',
      occupation: '',
      occupation_subcategory: '',
      voter_id: '',
      present_in_city: true,
      present_city_name: '',
      date_of_birth: '',
      booth: '',
    });
    setShowAddModal(false);
    setEditingVoter(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      const response = await axios.post('/voters/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`Import completed! ${response.data.imported} voters imported, ${response.data.errors} errors`);
      if (response.data.errorDetails && response.data.errorDetails.length > 0) {
        console.log('Import errors:', response.data.errorDetails);
      }
      fetchVoters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get('/voters/export/excel', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `voters_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const startEdit = async (voter: Voter) => {
    try {
      console.log('Starting edit for voter:', voter._id);
      setEditingVoter(voter);
      
      // Fetch full voter details for editing
      const response = await axios.get(`/voters/${voter._id}`);
      const fullVoter = response.data;
      console.log('Full voter data:', fullVoter);
      
      setFormData({
        full_name: fullVoter.full_name || '',
        age: fullVoter.age?.toString() || '',
        gender: fullVoter.gender || '',
        father_husband_name: fullVoter.father_husband_name || '',
        house_no: fullVoter.house_no || '',
        category: fullVoter.category || '',
        caste: fullVoter.caste || '',
        sub_caste: fullVoter.sub_caste || '',
        sub_sub_caste: fullVoter.sub_sub_caste || '',
        ward_area: fullVoter.ward_area || '',
        district: fullVoter.district || '',
        taluka: fullVoter.taluka || '',
        village: fullVoter.village || '',
        city: fullVoter.city || '',
        mobile_number: fullVoter.mobile_number || '',
        whatsapp_number: fullVoter.whatsapp_number || '',
        head_of_house: fullVoter.head_of_house || 0,
        political_preference: fullVoter.political_preference || '',
        party_designation: fullVoter.party_designation || '',
        occupation: fullVoter.occupation || '',
        occupation_subcategory: fullVoter.occupation_subcategory || '',
        voter_id: fullVoter.voter_id || '',
        present_in_city: fullVoter.present_in_city !== false,
        present_city_name: fullVoter.present_city_name || '',
        date_of_birth: fullVoter.date_of_birth ? fullVoter.date_of_birth.split('T')[0] : '',
        booth: fullVoter.booth || '',
      });
      setShowAddModal(true);
    } catch (error) {
      console.error('Error fetching voter details:', error);
      toast.error('Failed to fetch voter details');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('');
    setAreaFilter('');
    setMobileFilter('');
    setAgeMin('');
    setAgeMax('');
    setCurrentPage(1);
  };

  const renderDataEntry = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Data Entry</h2>
          <p className="text-sm text-gray-600">Add and manage voter information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Voter</span>
        </button>
      </div>

      {/* Basic Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Quick search voters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => navigate('/voters?tab=search')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2 transition-colors duration-200"
          >
            <Filter className="h-4 w-4" />
            <span>Advanced Search</span>
          </button>
        </div>
      </div>

      {renderVotersTable()}
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Search & Filter</h2>
        <p className="text-sm text-gray-600">Advanced search and filtering options</p>
      </div>

      {/* Advanced Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, mobile, voter ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Area/Ward"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <select
            value={mobileFilter}
            onChange={(e) => setMobileFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Mobile Status</option>
            <option value="with_mobile">With Mobile</option>
            <option value="without_mobile">Without Mobile</option>
          </select>

          <input
            type="number"
            placeholder="Min Age"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            type="number"
            placeholder="Max Age"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Clear all filters
          </button>
          <div className="text-sm text-gray-600">
            Found {totalVoters} voters
          </div>
        </div>
      </div>

      {renderVotersTable()}
    </div>
  );

  const renderImportExport = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Import/Export</h2>
        <p className="text-sm text-gray-600">Import voter data from Excel/CSV or export existing data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Import Data</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Upload Excel (.xlsx, .xls) or CSV files with voter data
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="import-file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
                <button 
                  onClick={() => document.getElementById('import-file')?.click()}
                  disabled={importing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto transition-colors duration-200"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Choose File</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Supported columns:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Full Name, Age, Gender</li>
                <li>Father/Husband Name, Mobile Number</li>
                <li>Ward/Area, Booth, District</li>
                <li>Political Preference, Occupation</li>
                <li>Voter ID, House Number</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Download all voter data as an Excel file
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">All Voters Data</p>
                  <p className="text-xs text-gray-500">Excel format (.xlsx)</p>
                </div>
                <button 
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors duration-200"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Export includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All voter personal information</li>
                <li>Contact details and addresses</li>
                <li>Political preferences and booth info</li>
                <li>Creation date and user info</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVotersTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voter Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demographics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Political
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {voters.map((voter) => (
                <tr key={voter._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {voter.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {voter.voter_id || voter._id.slice(-6)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {voter.gender || 'N/A'}, {voter.age || 'N/A'} years
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {voter.mobile_number ? (
                        <>
                          <Phone className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-gray-900">{voter.mobile_number}</span>
                        </>
                      ) : (
                        <>
                          <PhoneOff className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-gray-500">No mobile</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{voter.ward_area || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Booth: {voter.booth || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      voter.political_preference === 'BJP' ? 'bg-orange-100 text-orange-800' :
                      voter.political_preference === 'Congress' ? 'bg-blue-100 text-blue-800' :
                      voter.political_preference === 'AAP' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {voter.political_preference || 'Neutral'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(voter)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit voter"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(voter._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete voter"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {voters.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No voters found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentTab === 'search' ? 'Try adjusting your search filters.' : 'Get started by adding a new voter.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> ({totalVoters} total voters)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Voter Management</h1>
        <div className="text-sm text-gray-500">
          Current tab: {currentTab}
        </div>
      </div>

      {/* Tab Content */}
      {currentTab === 'entry' && renderDataEntry()}
      {currentTab === 'search' && renderSearch()}
      {currentTab === 'import' && renderImportExport()}

      {/* Add/Edit Voter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-auto w-full z-50">. {/* h-full ....new added */}
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingVoter ? 'Edit Voter' : 'Add New Voter'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father/Husband Name
                    </label>
                    <input
                      type="text"
                      value={formData.father_husband_name}
                      onChange={(e) => setFormData({...formData, father_husband_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voter ID
                    </label>
                    <input
                      type="text"
                      value={formData.voter_id}
                      onChange={(e) => setFormData({...formData, voter_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      House Number
                    </label>
                    <input
                      type="text"
                      value={formData.house_no}
                      onChange={(e) => setFormData({...formData, house_no: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ward/Area
                    </label>
                    <input
                      type="text"
                      value={formData.ward_area}
                      onChange={(e) => setFormData({...formData, ward_area: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booth
                    </label>
                    <input
                      type="text"
                      value={formData.booth}
                      onChange={(e) => setFormData({...formData, booth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taluka /Tahsil
                    </label>
                    <input
                      type="text"
                      value={formData.taluka}
                      onChange={(e) => setFormData({...formData, taluka: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Political & Other Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Political & Other Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Political Preference
                    </label>
                    <select
                      value={formData.political_preference}
                      onChange={(e) => setFormData({...formData, political_preference: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Party</option>
                      <option value="BJP">BJP</option>
                      <option value="Congress">Congress</option>
                      <option value="AAP">AAP</option>
                      <option value="Neutral">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caste
                    </label>
                    <input
                      type="text"
                      value={formData.caste}
                      onChange={(e) => setFormData({...formData, caste: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.full_name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingVoter ? 'Update Voter' : 'Create Voter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}