import React from "react";
import department from "../../assets/department.png";

const HeroSection = () => {
  const scrollToDTO = () => {
    document
      .getElementById("dto-office")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
   <section
  className="relative min-h-[500px] md:min-h-[700px] bg-cover overflow-hidden"
  style={{
    backgroundImage: `url(${department})`,
    backgroundPosition: "center 20%",
  }}
>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001923]/90 via-[#012b36]/20 to-transparent"></div>

      {/* Content */}
      <div className="relative z-3 flex items-center min-h-[400px] md:min-h-[600px] px-4 mx-auto sm:px-6 max-w-7xl pt-20 md:pt-24">
        <div className="max-w-2xl text-white animate-[fadeUp_1s_ease-out] mt-8 md:mt-0">

          <span className="inline-block px-4 py-1 mb-5 text-sm font-medium text-white bg-orange-500 rounded-full shadow-lg">
            Government of Arunachal Pradesh
          </span>

          <h1
            className="text-2xl font-extrabold leading-tight sm:text-4xl md:text-7xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
          >
            TRANSPORT
            <br />
            DEPARTMENT
          </h1>

          <div className="w-24 h-1 mt-6 bg-orange-500 rounded-full"></div>

          <p className="max-w-xl mt-4 text-sm leading-6 text-gray-200 sm:text-base md:text-xl md:leading-8">
            Providing efficient, transparent and citizen-friendly transport
            services for safe, reliable and seamless mobility across Arunachal
            Pradesh.
          </p>

          <div className="flex flex-col gap-4 mt-8 sm:flex-row">
            <button
              onClick={scrollToDTO}
             className="px-5 py-3 text-sm font-semibold text-white transition-all duration-300 bg-orange-500 rounded-lg shadow-lg sm:px-8 sm:py-4 sm:text-base hover:bg-orange-600 hover:scale-105"
            >
              CONTACT DTO
            </button>

            {/* <a
              href="#about"
              className="px-8 py-4 font-semibold transition-all duration-300 border border-white rounded-lg hover:bg-white hover:text-[#012b36]"
            >
              Learn More
            </a> */}
          </div>
        </div>
      </div>

      {/* Floating Scroll Indicator */}
      <div className="absolute text-xl text-white transform -translate-x-1/2 bottom-4 md:bottom-8 left-1/2 animate-bounce">
        ↓
      </div>
    </section>
  );
};

export default HeroSection;