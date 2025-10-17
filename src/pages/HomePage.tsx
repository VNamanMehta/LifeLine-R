import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export const HomePage = () => {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-900 text-white flex flex-col">
      {/* Header Section */}
      <header className="w-full max-w-7xl mx-auto px-4 py-6 flex justify-center">
        <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-2">
          <span className="text-red-400">🩸</span> LifeLine
        </h1>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Save Lives Through Blood Donation
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            LifeLine connects blood donors with blood banks to streamline donations and meet urgent needs. Find nearby blood drives, manage your donor profile, and respond to critical shortages in your community.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {isSignedIn ? (
              <Link
                to="/dashboard"
                className="inline-block bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-100 transition duration-300"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-up"
                  className="inline-block bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-100 transition duration-300"
                >
                  Get Started
                </Link>
                <Link
                  to="/sign-in"
                  className="inline-block bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-indigo-600 transition duration-300"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white text-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">
            Why Choose LifeLine?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">Find Blood Drives</h3>
              <p className="text-gray-600">
                Discover nearby blood donation camps with real-time urgency indicators to prioritize critical needs.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🩺</div>
              <h3 className="text-xl font-semibold mb-2">Manage Your Profile</h3>
              <p className="text-gray-600">
                Easily register and update your donor profile with your blood type, location, and donation history.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-xl font-semibold mb-2">Urgent Alerts</h3>
              <p className="text-gray-600">
                Receive notifications for urgent blood needs in your area and RSVP to help save lives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Join Our Community of Lifesavers
          </h2>
          <p className="text-lg opacity-90 mb-6">
            Your donation can make a difference. Sign up today to connect with blood banks and respond to urgent needs in your area.
          </p>
          {isSignedIn ? (
            <Link
              to="/dashboard/donor"
              className="inline-block bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-100 transition duration-300"
            >
              Find Blood Drives
            </Link>
          ) : (
            <Link
              to="/sign-up"
              className="inline-block bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-100 transition duration-300"
            >
              Become a Donor
            </Link>
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-900 py-6 px-4 text-center">
        <p className="text-sm opacity-80">
          &copy; 2025 LifeLine. All rights reserved.
        </p>
      </footer>
    </div>
  );
};