import React from "react";
import { CheckCircle } from "lucide-react";

const ServicesOffered = () => {
  const col1 = [
    "Registration of various vehicles",
    "Collection of road taxes",
    "Issue Driving Licence",
    "Issue Learner's Licence",
    "Issue Conductor Licence",
  ];

  const col2 = [
    "Issue Plying Permit within Itanagar Region",
    "Issue Fitness Certificates",
    "Issue International Driving Permit",
    "Issue Agent and Ticket Booking Counter Licence",
  ];

  const col3 = [
    "Issue License to Driving Training School",
    "Conduct of MV checking",
    "Conduct Driving Test",
    "Issue Accident Report",
    "Issue Trade Certificate for Automobile Dealership etc.",
  ];

  return (
    <section className="bg-white py-14">
      <div className="px-6 mx-auto max-w-7xl">

        <h2 className="text-center text-4xl font-bold text-[#012b36]">
          SERVICES OFFERED
        </h2>

        <div className="w-16 h-1 mx-auto mt-4 bg-orange-500"></div>

        <div className="p-8 mt-12 bg-white border border-gray-200 shadow-lg rounded-2xl">

          <div className="grid gap-8 lg:grid-cols-3">

            {/* Column 1 */}
            <div className="border-gray-200 lg:border-r lg:pr-8">
              {col1.map((item, index) => (
                <div key={index} className="flex gap-3 mb-5">
                  <CheckCircle
                    size={18}
                    className="text-[#012b36] mt-1 flex-shrink-0"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div className="border-gray-200 lg:border-r lg:px-8">
              {col2.map((item, index) => (
                <div key={index} className="flex gap-3 mb-5">
                  <CheckCircle
                    size={18}
                    className="text-[#012b36] mt-1 flex-shrink-0"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Column 3 */}
            <div className="lg:pl-8">
              {col3.map((item, index) => (
                <div key={index} className="flex gap-3 mb-5">
                  <CheckCircle
                    size={18}
                    className="text-[#012b36] mt-1 flex-shrink-0"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Note */}
          <div className="flex justify-center pt-6 mt-8 border-t border-gray-200">
            <div className="flex max-w-3xl gap-3 text-center">
              <CheckCircle
                size={18}
                className="text-[#012b36] mt-1 flex-shrink-0"
              />
              <p>
                Issue Uploading of necessary information on the national portal
                website of Ministry of Road Transport & Highways.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ServicesOffered;