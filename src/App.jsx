import {
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Suspense, lazy } from "react";
import CmsPageRenderer from "./components/cms/CmsPageRenderer"


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
import UserManagement from "./pages/users/UserManagement";
import RouteManagement from "./pages/route/RouteManagement";
import DepotForm from "./pages/depot/DepotForm";
import StationForm from "./pages/station/StationForm";
import BusListPage from "./pages/bus/BusListPage";
import BusFormPage from "./pages/bus/BusFormPage";
import BusDetailPage from "./pages/bus/BusDetailPage";
import BusTypesPage from "./pages/bus/BusTypesPage";
import AddUser from "./pages/users/AddUser";
import AddRoute from "./pages/route/AddRoute";
import AdminPassengerProfile from "./components/admin/AdminPassengerProfile";
import AdminUserProfile from "./components/admin/AdminUserProfile";
import EditRoute from "./pages/route/EditRoute";
import RouteDetailPage from "./pages/route/RouteDetailPage";
import ScheduleManagement from "./pages/schedule/ScheduleManagement";
import AddSchedule from "./pages/schedule/AddSchedule";
import ScheduleDetails from "./pages/schedule/ScheduleDetails";
import ScheduleInventoryManagement from "./pages/schedule/ScheduleInventoryManagement";
import DutyAssignmentManagement from "./pages/schedule/DutyAssignmentManagement";
import CmsFaqPage from "./pages/cms/faqPage";
import AdminGrievancePage from "./pages/grievance/AdminGrievancePage"
import AdminGallery from "./pages/cms/AdminGallery";
import AdminMenu    from "./pages/cms/AdminMenu";
import AdminCmsPages from "./pages/cms/AdminCmsPages";

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
import Helpdesktop from "./components/Website/Helpdesk";
import Tender from "./components/Website/Tender"
import CancellationPolicy from "./components/Website/Policies"
import RTI from "./components/Website/RTI"
import Timetable from "./components/Website/Timetable";
import ContactUs from "./components/Website/ContactUs";



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

//-----------import Transport from "./pages/Transport";----------------------
import Transport from "./pages/department/Transport";


//--------------------imports for conductor profile -------------------
import MyDuty from "./pages/conductor/MyDuty";
import ConductorScan from "./pages/conductor/ConductorScan";




//import for Role from constants/roles
import { ADMIN_ROLES, classifyRole } from "./constants/roles";


// ── Role constants ──────────────────────────────────────────────────────────
// const ADMIN_ROLES = [
//   "SUPER_ADMIN",
//   "STATE_ADMIN",
//   "DEPOT_MANAGER",
//   "STAFF",
// ];

// ── Route Guards ────────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/home/login" replace />;

  const isAdmin = user?.roles?.some((r) =>
    ADMIN_ROLES.includes(r.toUpperCase())
  );

  if (!isAdmin) return <Navigate to="/unauthorized" replace />;

  return children;
}

function UserRoute({ children }) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/home/login" replace />;

  return children;
}

function DutyStaffRoute({ children }) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/home/login" replace />;

  const roleClass = classifyRole(user?.roles ?? []);
  if (roleClass !== "duty_staff") return <Navigate to="/unauthorized" replace />;

  return children;
}

// function GuestRoute({ children }) {

//   const { user , isInitialized} = useAuth();
//    console.log("GuestRoute:", { isInitialized, user });
// if (!isInitialized) return <PageLoader />;

//   if (!user) return children;

//   const isAdmin = user?.roles?.some((r) =>
//     ADMIN_ROLES.includes(r.toUpperCase())
//   );

//   return (
//     <Navigate
//       to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
//       replace
//     />
//   );
// }

function GuestRoute({ children }) {
  const { user, isInitialized } = useAuth();
  if (!isInitialized) return <PageLoader />;
  if (!user) return children;

  const roleClass = classifyRole(user?.roles ?? []);
  const target =
    roleClass === "admin"      ? "/admin/dashboard" :
    roleClass === "duty_staff" ? "/conductor/duty"   :   // ADDED
                                  "/user/dashboard";

  return <Navigate to={target} replace />;
}

// ── Public Website wrapper ──────────────────────────────────────────────────

// const MAIN_PAGES = ["/ap", "/ap/our-history", "/ap/routes"];
const MAIN_PAGES = ["/home"];


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
         {/* Default route */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* ── Auth ──────────────────────────────────────────── */}
      <Route
        path="/home/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={<Navigate to="/home/login" replace />}
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
        <Route path="my-refunds" element={<MyRefunds />} />

        <Route path="wallet" element={<MyWallet/>} />
        <Route path="all-grievance" element={<AllGrievance/>} />

      </Route>




      {/* ── Admin Area ────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout />
          </AdminRoute>
        }
      >

        <Route path="dashboard"      element={<DashboardPage />} />
        <Route path="users"          element={<UsersPage />} />
        <Route path="roles"          element={<RolesPage />} />
        <Route path="audit"          element={<AuditPage />} />
        <Route path="bookings"       element={<BookingsPage />} />
        <Route path="payments"       element={<PaymentsPage />} />
        <Route path="refunds"        element={<RefundsPage />} />
        <Route path="wallet"         element={<AdminWalletPage />} />
        <Route path="usermanagement" element={<UserManagement />} />
        <Route path="routes"         element={<RouteManagement />} />
        <Route path="depot"          element={<DepotForm />} />
        <Route path="stations"       element={<StationForm />} />
        {/* <Route path="/admin/buses"          element={<BusManagement />} /> */}
        <Route path="buses"          element={<BusListPage />} />
        <Route path="buses/new"      element={<BusFormPage />} />
        <Route path="buses/:id"      element={<BusDetailPage />} />
        <Route path="buses/:id/edit" element={<BusFormPage />} />
        <Route path="bus-types"      element={<BusTypesPage />} />
        <Route path="adduser"        element={<AddUser />} />
        <Route path="addroute"       element={<AddRoute />} />
        {/* <Route path="/admin/passengerProfile/:id" element={<AdminPassengerProfile/>}/> */}
        <Route path="user-profile/:id/:type" element={<AdminUserProfile />}/>
        <Route path="routes/:id"      element={<RouteDetailPage />} />

        <Route path="routes/:id/edit" element={<EditRoute />} />
        <Route path="schedules" element={<ScheduleManagement />} />
        <Route path="schedules/add" element={<AddSchedule />} />
        <Route path="schedules/:id" element={<ScheduleDetails />} />
        <Route path="schedules/:id/seats" element={<ScheduleInventoryManagement />} />
        <Route path="schedules/:id/duty" element={<DutyAssignmentManagement />} />
        <Route path="faq"  element={<CmsFaqPage />} />
        <Route path="grievance" element={<AdminGrievancePage/>} />
        <Route path="cms/gallery" element={<AdminGallery />} />
        <Route path="cms/menu"    element={<AdminMenu />} />
        <Route path="cms/pages" element={<AdminCmsPages />} />
      </Route>


{/* ── Duty Staff Area (conductor, driver, guard) ───────── */}
      <Route
        path="/conductor"
        element={
          <DutyStaffRoute>
            <Outlet />
          </DutyStaffRoute>
        }
      >
        <Route index element={<Navigate to="duty" replace />} />
        <Route path="duty" element={<MyDuty />} />
        <Route path="scan/:scheduleId" element={<ConductorScan />} />
      </Route>



      {/* ── Public Website ────────────────────────────────── */}
{/* <Route path="/ap" element={<Transport />} /> */}
<Route path="department" element={<Transport />} />

<Route path="/home" element={<WebsiteLayout />}>
  <Route index element={<Home />} />

      {/* <Route path="/" element={<Navigate to="/ap" replace />} />

      <Route path="/ap" element={<WebsiteLayout />}>
        <Route index element={<Home />} /> */}

        <Route path="buses" element={<BusList />} />

        <Route
          path="seat-selection"
          element={<SeatSelection />}
        />

        <Route
          path="our-history"
          element={<OurHistory />}
        />
        
        <Route path="department" element={<Transport />} />

        <Route
          path="helpdesk"
          element={<Helpdesktop />}
        />

        <Route
          path="tender"
          element={<Tender />}
        />

        <Route
          path="contact"
          element={<ContactUs/>}
        />

        <Route
          path="cancellation-policy"
          element={<CancellationPolicy />}
        />


        <Route
          path="rti"
          element={<RTI />}
        />

        <Route
          path="timetable"
          element={<Timetable />}
        />


        {/* <Route path="privacy" element={<PrivacyPolicy/>} />
         <Route path="web-information-manager" element={<WebInformationMan/>} />
          <Route path="disclaimer" element={<Disclaimer/>} />
           <Route path="terms-condition" element={<TermsAndCondition/>} /> */}


        <Route path="routes" element={<BusService />} />

        <Route path=":slug" element={<CmsPageRenderer />} />

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