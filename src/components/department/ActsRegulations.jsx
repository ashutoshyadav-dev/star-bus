import React from "react";
import lawImage from "../../assets/law.jpg";

const ActsRegulations = () => {
  return (
    <div className="bg-[#012b36] text-white rounded-xl overflow-hidden shadow-lg">

      <div className="p-8">
        <h2 className="text-2xl font-bold">
          ACTS & REGULATIONS IMPLEMENTED
        </h2>

        <div className="w-16 h-1 mt-3 mb-6 bg-orange-500"></div>

        <div className="flex flex-col items-center gap-6 lg:flex-row">

          {/* Image */}
          <div className="w-full lg:w-1/3">
            <img
    src={lawImage}
    alt="Acts and Regulations"
    className="object-cover w-full rounded-lg"
  />
          </div>

          {/* Content */}
          <div className="w-full lg:w-2/3">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-orange-400">•</span>
                CMV Act, 1988
              </li>

              <li className="flex items-start gap-3">
                <span className="text-orange-400">•</span>
                CMVR, 1989
              </li>

              <li className="flex items-start gap-3">
                <span className="text-orange-400">•</span>
                Arunachal Pradesh Motor Vehicle Taxation Act, 2006
              </li>

              <li className="flex items-start gap-3">
                <span className="text-orange-400">•</span>
                Arunachal Pradesh Motor Vehicle Taxation Act, 2010
              </li>

              <li className="flex items-start gap-3">
                <span className="text-orange-400">•</span>
                Notifications & Gazettes issued by MoRTH
              </li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ActsRegulations;