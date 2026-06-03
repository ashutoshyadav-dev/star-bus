import {
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Suspense, lazy } from "react";

// ── Spinner fallback ────────────────────────────────────────────────────────
import PageLoader from "./components/common/PageLoader";

// ── Admin Layout ────────────────────────────────────────────────────────────
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/users/UsersPage";
import RolesPage from "./pages/roles/RolesPage";
import AuditPage from "./pages/audit/AuditPage";
import BookingsPage from "./pages/booking/BookingsPage";
import PaymentsPage from "./pages/payment/PaymentsPage";
import RefundsPage from "./pages/refund/RefundsPage";
import AdminWalletPage from "./pages/wallet/AdminWalletPage";
import UserManagement from "./pages/UserManagement";
import RouteManagement from "./pages/RouteManagement";
import DepotForm from "./pages/DepotForm";
import StationForm from "./pages/StationForm";
import BusListPage from "./pages/bus/BusListPage";
import BusFormPage from "./pages/bus/BusFormPage";
import BusDetailPage from "./pages/bus/BusDetailPage";
import BusTypesPage from "./pages/bus/BusTypesPage";
import AddUser from "./pages/AddUser";
import AddRoute from "./pages/AddRoute";
import AdminPassengerProfile from "./components/admin/AdminPassengerProfile";
import AdminUserProfile from "./components/admin/AdminUserProfile";
import EditRoute from "./pages/EditRoute";
import RouteDetailPage from "./pages/RouteDetailPage";
import ScheduleManagement from "./pages/schedule/ScheduleManagement";
import AddSchedule from "./pages/schedule/AddSchedule";
import ScheduleDetails from "./pages/schedule/ScheduleDetails";
import ScheduleInventoryManagement from "./pages/schedule/ScheduleInventoryManagement";
import DutyAssignmentManagement from "./pages/schedule/DutyAssignmentManagement";
import CmsFaqPage from "./pages/cms/faqPage";
import AdminGrievancePage from "./pages/grievance/AdminGrievancePage"

// ── Auth ────────────────────────────────────────────────────────────────────
import LoginPage from "./pages/auth/LoginPage";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// ── Public Website ──────────────────────────────────────────────────────────
import Navbar from "./components/Website/Navbar";
import InnerNavbar from "./components/Website/InnerNavbar";
import Footer from "./components/Website/Footer";
import InnerFooter from "./components/Website/InnerFooter";
import Home from "./components/Website/Home";
import BusList from "./components/Website/BusList";
import SeatSelection from "./components/Website/SeatSelection";
import OurHistory from "./components/Website/OurHistory";
import BusService from "./components/Website/BusService";

// ── Customer / Passenger Area ───────────────────────────────────────────────
import UserLayout from "./components/customer/UserLayout";
import Dashboard from "./components/customer/Dashboard";
import MyBookings from "./components/customer/MyBookings";
import BookingDetails from "./components/customer/BookingDetails";
import Profile from "./components/customer/Profile";
import Helpdesk from "./components/customer/Helpdesk";
import BookTicket from "./components/customer/BookTicket";
import MyRefunds from "./components/customer/MyRefund";
import MyWallet from "./components/customer/CustomerWalletPage"
import AllGrievance from "./components/customer/Allgrievances"



// ── Role constants ──────────────────────────────────────────────────────────
const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "STATE_ADMIN",
  "DEPOT_MANAGER",
  "STAFF",
];

// ── Route Guards ────────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/ap/login" replace />;

  const isAdmin = user?.roles?.some((r) =>
    ADMIN_ROLES.includes(r.toUpperCase())
  );

  if (!isAdmin) return <Navigate to="/unauthorized" replace />;

  return children;
}

function UserRoute({ children }) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/ap/login" replace />;

  return children;
}

function GuestRoute({ children }) {
  const { user , isInitialized} = useAuth();
   console.log("GuestRoute:", { isInitialized, user });
if (!isInitialized) return <PageLoader />;
  if (!user) return children;

  const isAdmin = user?.roles?.some((r) =>
    ADMIN_ROLES.includes(r.toUpperCase())
  );

  return (
    <Navigate
      to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
      replace
    />
  );
}

// ── Public Website wrapper ──────────────────────────────────────────────────
const MAIN_PAGES = ["/ap", "/ap/our-history", "/ap/routes"];

function WebsiteLayout() {
  const { pathname } = useLocation();
  const isMain = MAIN_PAGES.includes(pathname);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-grow">
        <Outlet />
      </main>

      {isMain ? <Footer /> : <InnerFooter />}
    </div>
  );
}

// ── All Routes ──────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* ── Auth ──────────────────────────────────────────── */}
      <Route
        path="/ap/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={<Navigate to="/ap/login" replace />}
      />

      {/* ── Utility pages ─────────────────────────────────── */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />

      {/* ── Passenger Area ────────────────────────────────── */}
      <Route
        path="/user"
        element={
          <UserRoute>
            <UserLayout />
          </UserRoute>
        }
      >
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="book-ticket" element={<BookTicket />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="booking/:id" element={<BookingDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="helpdesk" element={<Helpdesk />} />
        <Route path="/user/my-refunds" element={<MyRefunds />} />
        <Route path="/user/wallet" element={<MyWallet/>} />
        <Route path="/user/all-grievance" element={<AllGrievance/>} />
      </Route>

      {/* ── Admin Area ────────────────────────────────────── */}
      <Route
        element={
          <AdminRoute>
            <AppLayout />
          </AdminRoute>
        }
      >

        <Route path="/admin/dashboard"      element={<DashboardPage />} />
        <Route path="/admin/users"          element={<UsersPage />} />
        <Route path="/admin/roles"          element={<RolesPage />} />
        <Route path="/admin/audit"          element={<AuditPage />} />
        <Route path="/admin/bookings"       element={<BookingsPage />} />
        <Route path="/admin/payments"       element={<PaymentsPage />} />
        <Route path="/admin/refunds"        element={<RefundsPage />} />
        <Route path="/admin/wallet"         element={<AdminWalletPage />} />
        <Route path="/admin/usermanagement" element={<UserManagement />} />
        <Route path="/admin/routes"         element={<RouteManagement />} />
        <Route path="/admin/depot"          element={<DepotForm />} />
        <Route path="/admin/stations"       element={<StationForm />} />
        {/* <Route path="/admin/buses"          element={<BusManagement />} /> */}
        <Route path="/admin/buses"          element={<BusListPage />} />
        <Route path="/admin/buses/new"      element={<BusFormPage />} />
        <Route path="/admin/buses/:id"      element={<BusDetailPage />} />
        <Route path="/admin/buses/:id/edit" element={<BusFormPage />} />
        <Route path="/admin/bus-types"      element={<BusTypesPage />} />
        <Route path="/admin/adduser"        element={<AddUser />} />
        <Route path="/admin/addroute"       element={<AddRoute />} />
        {/* <Route path="/admin/passengerProfile/:id" element={<AdminPassengerProfile/>}/> */}
        <Route path="/admin/user-profile/:id/:type" element={<AdminUserProfile />}/>
        <Route path="/admin/routes/:id"      element={<RouteDetailPage />} />
        <Route path="/admin/routes/:id/edit" element={<EditRoute />} />
        <Route path="/admin/schedules" element={<ScheduleManagement />} />
        <Route path="/admin/schedules/add" element={<AddSchedule />} />
        <Route path="/admin/schedules/:id" element={<ScheduleDetails />} />
        <Route path="/admin/schedules/:id/seats" element={<ScheduleInventoryManagement />} />
        <Route path="/admin/schedules/:id/duty" element={<DutyAssignmentManagement />} />
        <Route path="/admin/faq"  element={<CmsFaqPage />} />
        <Route path="/admin/grievance" element={<AdminGrievancePage/>} />
      </Route>

      {/* ── Public Website ────────────────────────────────── */}

      <Route path="/" element={<Navigate to="/ap" replace />} />

      <Route path="/ap" element={<WebsiteLayout />}>
        <Route index element={<Home />} />

        <Route path="buses" element={<BusList />} />

        <Route
          path="seat-selection"
          element={<SeatSelection />}
        />

        <Route
          path="our-history"
          element={<OurHistory />}
        />

        <Route path="routes" element={<BusService />} />

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}