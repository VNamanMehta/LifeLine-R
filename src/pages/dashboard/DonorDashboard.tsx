import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@apollo/client/react';
import { UserCircle, ShieldCheck, Clock, Activity, Calendar, MapPin } from 'lucide-react';
import { GET_DONOR_DASHBOARD_DATA } from '../../graphql/queries';

interface DashboardQueryData {
  users_by_pk: {
    id: string;
    name: string;
    blood_group: string;
    last_donation_date: string | null;
  };
}

// EligibilityCard component
const EligibilityCard: React.FC<{ lastDonationDate?: string | null }> = ({ lastDonationDate }) => {
  if (!lastDonationDate) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 text-green-900 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          <div>
            <p className="font-bold text-green-800">You are eligible to donate!</p>
            <p className="text-sm text-green-700">Thank you for being a potential lifesaver.</p>
          </div>
        </div>
      </div>
    );
  }

  const lastDonation = new Date(lastDonationDate);
  const nextEligibleDate = new Date(lastDonation);
  nextEligibleDate.setDate(lastDonation.getDate() + 56);
  const isEligible = new Date() >= nextEligibleDate;

  const formatDate = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

  if (isEligible) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 text-green-900 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          <div>
            <p className="font-bold text-green-800">You are eligible to donate again!</p>
            <p className="text-sm text-green-700">It's been long enough since your last donation.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6" />
        <div>
          <p className="font-bold text-yellow-800">Next Eligible Donation</p>
          <p className="text-sm text-yellow-700">
            You can donate again on or after: {formatDate(nextEligibleDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const DonorDashboard: React.FC = () => {
  const { user } = useUser();
  const dbUserId = user?.publicMetadata.db_id as string;

  const { loading, error, data } = useQuery<DashboardQueryData, { userId: string }>(
    GET_DONOR_DASHBOARD_DATA,
    {
      variables: { userId: dbUserId },
      skip: !dbUserId,
    }
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-gray-500 text-lg font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
        <p className="text-red-500 text-lg font-semibold">Error loading your profile: {error.message}</p>
        <p className="text-gray-500 text-sm">Check the browser console for your JWT token and verify it at jwt.io</p>
      </div>
    );
  }

  const userProfile = data?.users_by_pk;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 bg-gradient-to-b from-indigo-50 via-white to-indigo-50 min-h-screen">
      {/* Personalized Welcome Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-6 hover:shadow-lg transition-shadow">
        <UserCircle className="w-16 h-16 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {userProfile?.name || 'Donor'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Blood Group: <span className="font-semibold text-red-600">{userProfile?.blood_group || 'N/A'}</span>
          </p>
        </div>
      </div>

      {/* Donation Eligibility Card */}
      <EligibilityCard lastDonationDate={userProfile?.last_donation_date} />

      {/* Dynamic Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <Activity className="w-7 h-7 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-500">Ongoing Now</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <Calendar className="w-7 h-7 text-green-600" />
          <div>
            <p className="text-sm font-medium text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <MapPin className="w-7 h-7 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-gray-500">Total Nearby</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>

      {/* Placeholder for Map and List Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nearby Blood Donation Camps</h2>
          <p className="text-sm text-gray-500 italic">
            Dashboard features like the map and camp lists will be built here.
          </p>
        </div>
      </div>
    </div>
  );
};
