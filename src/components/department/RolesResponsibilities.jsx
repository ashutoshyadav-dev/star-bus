import React from "react";
import {
  Car,
  FileText,
  Shield,
  BadgeCheck,
  IndianRupee,
  GraduationCap,
} from "lucide-react";

const data = [
  {
    icon: <Car size={28} />,
    title: "Vehicle Registration",
    desc: "Registration of various vehicles.",
  },
  {
    icon: <FileText size={28} />,
    title: "Driving Licences",
    desc: "Issue of Driving Licence, Learner's Licence and Conductor Licence.",
  },
  {
    icon: <FileText size={28} />,
    title: "Permit Services",
    desc: "Issue of plying permit and other permits.",
  },
  {
    icon: <Shield size={28} />,
    title: "Fitness Certification",
    desc: "Issue of fitness certificates for vehicles.",
  },
  {
    icon: <IndianRupee size={28} />,
    title: "Road Tax Collection",
    desc: "Collection of road taxes.",
  },
  {
    icon: <GraduationCap size={28} />,
    title: "Road Safety & Enforcement",
    desc: "MV checking, driving tests and road safety enforcement.",
  },
];

const RolesResponsibilities = () => {
  return (
    <section className="py-8 bg-white md:py-14">
      <div className="px-4 mx-auto md:px-6 max-w-7xl">

        <h2 className="text-2xl md:text-4xl text-center font-bold text-[#012b36]">
          ROLES AND RESPONSIBILITIES OF DTO
        </h2>

        <div className="w-16 h-1 mx-auto mt-4 bg-orange-500"></div>

        <div className="relative mt-10 md:mt-16">

          {/* Center Line */}
          <div className="hidden lg:block absolute top-10 left-0 w-full h-[2px] bg-[#012b36]"></div>

          <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6 md:gap-8">

            {data.map((item, index) => (
              <div
  key={index}
  className="p-4 text-center border border-gray-100 shadow-sm rounded-xl lg:border-0 lg:shadow-none"
>

              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-[#012b36] text-white flex items-center justify-center border-4 border-white shadow-lg">
                  {item.icon}
                </div>

                <h3 className="mt-4 md:mt-5 font-bold text-base md:text-lg text-[#012b36]">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-600 md:mt-3 md:text-sm md:leading-6">
                  {item.desc}
                </p>

              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
};

export default RolesResponsibilities;