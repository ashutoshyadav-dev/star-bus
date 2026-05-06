import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-[240px] flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 pt-[80px] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
