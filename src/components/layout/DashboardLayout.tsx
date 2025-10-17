import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { Shield, Users, Calendar, BarChart3, Map, Menu, LogOut } from "lucide-react";

export const DashboardLayout: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const userRole = user?.publicMetadata?.role as "donor" | "staff" | "admin";
  const userName = user?.firstName || "User";

  useEffect(() => {
    if (isLoaded && location.pathname === "/dashboard") {
      switch (userRole) {
        case "admin":
          navigate("/dashboard/admin", { replace: true });
          break;
        case "staff":
          navigate("/dashboard/staff", { replace: true });
          break;
        case "donor":
        default:
          navigate("/dashboard/donor", { replace: true });
          break;
      }
    }
  }, [isLoaded, userRole, location.pathname, navigate]);

  const navigationItems = [
    { path: "/dashboard/donor", label: "Find Camps", icon: Map, roles: ["donor", "staff", "admin"] },
    { path: "/dashboard/staff", label: "Manage Camps", icon: Calendar, roles: ["staff", "admin"] },
    { path: "/dashboard/staff/inventory", label: "Inventory", icon: BarChart3, roles: ["staff", "admin"] },
    { path: "/dashboard/admin", label: "Admin Panel", icon: Shield, roles: ["admin"] },
    { path: "/dashboard/admin/staff-approval", label: "Staff Approval", icon: Users, roles: ["admin"] },
  ];

  const accessibleNavItems = navigationItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  if (!isLoaded) return <div>Loading dashboard...</div>;

  return (
    <div className="flex h-[calc(100vh-65px)] bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-gray-200 bg-white p-4 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Navigation */}
        <nav className="flex flex-col flex-grow gap-2 mt-2">
          {accessibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.label}
                className={`flex items-center rounded-lg px-3 py-2 transition-all duration-200 
                  ${
                    isSidebarOpen ? "justify-start gap-3" : "justify-center"
                  } ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div
          className={`flex flex-col gap-3 border-t border-gray-200 pt-4 ${
            isSidebarOpen ? "items-start" : "items-center"
          }`}
        >
          {/* Logout Button */}
          <button
            onClick={() => signOut(() => navigate("/"))}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 ${
              isSidebarOpen ? "justify-start gap-3" : "justify-center"
            }`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>

          {/* User Info */}
          <div
            className={`flex w-full items-center ${
              isSidebarOpen ? "pl-3 justify-start gap-3" : "justify-center"
            }`}
          >
            <UserButton appearance={{ elements: { userButtonAvatarBox: { margin: 0 } } }} />
            {isSidebarOpen && (
              <div>
                <p className="font-semibold m-0 whitespace-nowrap">{userName}</p>
                <p className="text-sm text-gray-500 capitalize m-0">{userRole}</p>
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 ${
              isSidebarOpen ? "justify-start gap-3" : "justify-center"
            }`}
          >
            <Menu size={20} />
            {isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};
