import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import RolesResponsibilities from "../../components/department/RolesResponsibilities";
import ServicesOffered from "../../components/department/ServicesOffered";
import ActsRegulations from "../../components/department/ActsRegulations";
import DTOOffice from "../../components/department/DTOOffice";

// One focused page per About Us menu entry (the full overview stays at /home/department).
const SECTIONS = {
  roles:    { title: "Roles & Responsibilities", subtitle: "What the department is responsible for", Component: RolesResponsibilities, narrow: false },
  services: { title: "Services Offered",         subtitle: "Services provided by the department",    Component: ServicesOffered,       narrow: false },
  acts:     { title: "Acts & Regulations",       subtitle: "Laws and rules the department operates under", Component: ActsRegulations, narrow: true },
  offices:  { title: "DTO Offices",              subtitle: "District Transport Offices",              Component: DTOOffice,             narrow: true },
};

export default function DepartmentSection() {
  const { section } = useParams();
  const cfg = SECTIONS[section];

  useEffect(() => {
    if (cfg) document.title = `${cfg.title} | Department`;
  }, [cfg]);

  if (!cfg) return <Navigate to="/home/department" replace />;
  const { Component } = cfg;

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
      <div className="bg-gradient-to-r from-[#072235] via-[#0b3240] to-[#0d4a2f] px-6 pt-28 pb-12 text-white sm:px-10">
        <p className="text-xs uppercase tracking-widest text-white/60">About Us</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{cfg.title}</h1>
        <p className="mt-2 text-sm text-white/80">{cfg.subtitle}</p>
      </div>
      <div className={cfg.narrow ? "mx-auto max-w-4xl px-4 py-10" : ""}>
        <Component />
      </div>
    </div>
  );
}
