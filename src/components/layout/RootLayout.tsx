import { Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';

export const RootLayout = () => {
  const { user } = useUser();
  const userName =
    (user?.publicMetadata?.name as string) ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Guest";
  const userRole = (user?.publicMetadata?.role as string) || "User";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          🩸 LifeLine
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>

          <SignedOut>
            <div className="flex items-center gap-3">
              <Link
                to="/sign-in"
                className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: { margin: 0 } },
              }}
            />
          </SignedIn>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
