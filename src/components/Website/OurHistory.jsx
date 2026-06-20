import banner from "../../assets/banner.png";
import Breadcrumb from "../Website/Breadcrumb";
import { FaBus, FaRoute, FaBuilding, FaNetworkWired, FaCheckCircle } from "react-icons/fa";
import { useCmsPage } from "../../hooks/useCmsPage";

const STAT_META = [
  { key: "statBuses",       label: "Total Buses",  color: "text-green-500",  icon: "bus"     },
  { key: "statRoutes",      label: "Routes",       color: "text-orange-500", icon: "route"   },
  { key: "statStations",    label: "Stations",     color: "text-green-500",  icon: "building"},
  { key: "statSubStations", label: "Sub Stations", color: "text-purple-500", icon: "network" },
];

const ICONS = {
  bus:      <FaBus />,
  route:    <FaRoute />,
  building: <FaBuilding />,
  network:  <FaNetworkWired />,
};

function OurHistory() {
  const { page, loading } = useCmsPage("our-history");
  const c = page?.content ?? {};

  return (
    <div className="w-full bg-[#f5f7fa]">
     

      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">
        <div className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            {page?.title?.split(" ").slice(0,-1).join(" ")}{" "}
            <span className="text-green-400">{page?.title?.split(" ").slice(-1)}</span>
          </h1>
          <p className="mt-2 text-gray-200">{page?.subtitle}</p>
        </div>
      </div>

      <Breadcrumb title={page?.title ?? "Our History"} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent
            rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8 px-10 py-12 lg:grid-cols-3">

          <div className="p-8 bg-white shadow-md rounded-2xl lg:col-span-2">
            <h2 className="mb-6 text-2xl font-bold">
              {c.aboutTitle?.split(" ").slice(0,-1).join(" ")}{" "}
              <span className="text-green-500">{c.aboutTitle?.split(" ").slice(-1)}</span>
              <div className="w-20 h-1 mt-2 bg-green-500 rounded" />
            </h2>

            <div className="space-y-4 text-gray-600 text-[15px] leading-relaxed">
              {(c.paragraphs ?? []).map((p, i) => <p key={i}>{p}</p>)}
            </div>

            {(c.bulletSections ?? []).map((section, si) => (
              <div key={si} className="mt-6">
                <h3 className="mb-3 text-lg font-semibold">{section.heading}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {(section.items ?? []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FaCheckCircle className="mt-1 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {(c.sidebar?.stats ?? []).map((stat, i) => (
                <div key={i}
                  className="p-5 text-center transition bg-white shadow-md
                    rounded-xl hover:shadow-lg">
                  <div className={`text-2xl ${STAT_META[i]?.color} mx-auto`}>
                    {ICONS[STAT_META[i]?.icon]}
                  </div>
                  <p className="mt-2 text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {c.sidebar?.highlights && (
              <div className="p-6 text-white shadow-lg rounded-2xl
                bg-gradient-to-br from-[#0f2027] to-[#14532d]">
                <h3 className="mb-4 text-lg font-semibold">
                  {c.sidebar.highlights.heading}
                </h3>
                <ul className="space-y-2 text-sm">
                  {(c.sidebar.highlights.items ?? []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FaCheckCircle className="mt-1 text-yellow-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OurHistory;