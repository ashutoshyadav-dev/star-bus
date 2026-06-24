import React from "react";
import transport from "../../assets/transport.png";
const AboutSection = () => {
  return (
    <section className="bg-white py-14">
      <div className="grid items-center gap-10 px-6 mx-auto max-w-7xl lg:grid-cols-2">

      <img
  src={transport}
  alt="Transport Department"
  className="shadow-lg rounded-xl"
/>

        <div>
          <h2 className="text-4xl font-bold text-[#012b36]">
            ABOUT TRANSPORT DEPARTMENT
          </h2>

          <div className="w-16 h-1 mt-3 mb-4 bg-orange-500"></div>

         <p className="leading-8 text-gray-700">
  Arunachal Pradesh State Transport Services (APSTS) was established in December 1975 with just 2 buses and 5 employees. Since then, it has grown into one of the state's most important public transport networks.
</p>

<p className="mt-3 leading-8 text-gray-700">
  Today, APSTS operates a fleet of over 326 buses, including Volvo and electric buses, supported by 1 ISBT, 16 bus stations, 5 sub-stations, and modern workshop facilities.
</p>

<p className="mt-3 leading-8 text-gray-700">
  APSTS connects district headquarters, towns, and remote villages across Arunachal Pradesh, providing reliable intra-state and inter-state transport services and serving as a vital lifeline for the people of the state.
</p>
        </div>

      </div>
    </section>
  );
};

export default AboutSection;