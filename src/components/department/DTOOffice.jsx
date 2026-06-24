import React from "react";
import { MapPin, Phone, User } from "lucide-react";
import mapImage from "../../assets/map.jpg";

const DTOOffice = () => {
  return (
    <div
    id="dto-office" className="overflow-hidden bg-white border shadow-sm rounded-xl">
      <div className="grid items-stretch lg:grid-cols-2">

        {/* Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-[#012b36]">
            DISTRICT TRANSPORT OFFICE (DTO)
          </h2>

          <div className="w-16 h-1 mt-3 mb-6 bg-orange-500"></div>

          <div className="space-y-5 text-gray-700">

            <div className="flex gap-3">
              <MapPin className="text-[#012b36] mt-1" size={20} />
              <p>
                Premises Truck Terminal,
                Lekhi, Naharlagun,
                District, Arunachal Pradesh – 791110
              </p>
            </div>

            <div className="flex gap-3">
              <Phone className="text-[#012b36]" size={20} />
              <p>9863700248</p>
            </div>

            <div className="flex gap-3">
              <User className="text-[#012b36]" size={20} />
              <p>Techi Tukap, DTO</p>
            </div>

          </div>
        </div>

        {/* Map Image */}
      <div className="h-full min-h-[370px]">
      <img
        src={mapImage}
        alt="Location Map"
        className="object-cover w-full h-full"
      />
    </div>

      </div>
    </div>
  );
};

export default DTOOffice;