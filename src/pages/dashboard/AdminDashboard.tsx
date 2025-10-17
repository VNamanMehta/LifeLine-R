import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@apollo/client/react';
import { GET_DONOR_DASHBOARD_DATA } from '../../graphql/queries';
import { type DashboardQueryData } from '../../types';

export const AdminDashboard = () => {
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
      <div className="flex justify-center items-center h-[80vh] text-gray-700 text-lg font-medium">
        Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] gap-4 text-center">
        <p className="text-red-500 text-xl font-semibold">
          Error loading your profile: {error.message}
        </p>
        <p className="text-gray-500 text-sm">
          Check the browser console for your JWT token and verify it at jwt.io
        </p>
      </div>
    );
  }

  const userProfile = data?.users_by_pk;

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-b from-indigo-50 via-white to-indigo-50 min-h-screen">
      <h2 className="text-3xl font-bold text-indigo-600 mb-6">
        Welcome back, {userProfile?.name}!
      </h2>

      <div className="bg-gradient-to-r from-indigo-100 via-white to-indigo-100 shadow-lg rounded-2xl p-6 flex flex-col md:flex-row md:justify-between gap-6 md:gap-12 transform transition-transform hover:-translate-y-1 hover:shadow-2xl">
        <div className="flex flex-col gap-3">
          <p className="text-gray-700 text-lg">
            Your blood group is:{' '}
            <span className="font-semibold text-indigo-700">{userProfile?.blood_group}</span>
          </p>
          <p className="text-gray-700 text-lg">
            Your last donation was on:{' '}
            <span className="font-semibold text-indigo-700">
              {userProfile?.last_donation_date
                ? new Date(userProfile.last_donation_date).toLocaleDateString()
                : 'N/A'}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-8 text-gray-500 italic text-sm md:text-base">
        Dashboard features like the map and camp lists will be built here.
      </p>
    </div>
  );
};
