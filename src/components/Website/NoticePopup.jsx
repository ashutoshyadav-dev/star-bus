import { useState } from "react";
import { useNavigate } from "react-router-dom";

import busImg from "../../assets/bus.png";
import logo from "../../assets/logo.png";
import Logo from "../../assets/logo2.jpeg";

function NoticePopup() {
  const [show, setShow] = useState(true);
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <div
      className="
        fixed inset-0
        z-[9999]
        bg-black/80
        p-2 sm:p-4
        overflow-y-auto
      "
    >
      {/* ================= POPUP ================= */}

      <div
        className="
          relative
          w-full
          max-w-[1100px]
          mx-auto
          my-2 sm:my-4
          bg-white
          rounded-2xl sm:rounded-3xl
          shadow-2xl
          overflow-hidden
        "
      >
        {/* ================= CLOSE BUTTON ================= */}

        <button
          onClick={() => setShow(false)}
          className="absolute z-50 flex items-center justify-center w-8 h-8 text-sm text-white transition bg-red-500 rounded-full top-2 right-2 sm:top-3 sm:right-3 sm:w-10 sm:h-10 sm:text-xl hover:bg-red-600"
        >
          ✕
        </button>

        {/* =====================================================
            SCROLLABLE CONTENT
        ===================================================== */}

        <div
          className="
            max-h-[calc(100vh-16px)]
            sm:max-h-[calc(100vh-32px)]
            overflow-y-auto
            overflow-x-hidden
            p-3 sm:p-5 md:p-6
          "
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="flex flex-col items-center justify-center gap-2 px-8 mb-4 text-center sm:flex-row sm:gap-4 sm:mb-6 sm:px-10"
          >

            {/* LEFT LOGO */}

            <img
              src={logo}
              alt="APSTS Logo"
              className="object-contain w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0"
            />

            {/* HEADER TEXT */}

            <div className="min-w-0">

              <h1
                className="text-lg font-bold leading-tight tracking-wide text-blue-900 sm:text-xl md:text-2xl lg:text-3xl"
              >
                SCHEDULE OF BUS SERVICE
              </h1>

              <p
                className="
                  mt-1
                  text-[10px]
                  sm:text-xs
                  md:text-sm
                  text-gray-600
                  leading-relaxed
                "
              >
                BETWEEN BANDERDEWA TO DONYI-POLO AIRPORT AND VICE VERSA
              </p>

              <p
                className="
                  text-[10px]
                  sm:text-xs
                  md:text-sm
                  font-semibold
                  text-green-600
                "
              >
                VIA NAHARLAGUN, ITANAGAR
              </p>

            </div>

            {/* RIGHT LOGO */}

            <img
              src={Logo}
              alt="Government Logo"
              className="object-contain w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0"
            />

          </div>

          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >

            {/* =================================================
                TABLE
            ================================================= */}

            <div
              className="w-full min-w-0 lg:col-span-2"
            >

              <div
                className="w-full overflow-x-auto border border-gray-300 rounded-lg "
              >

                <table
                  className="
                    w-full
                    min-w-[650px]
                    text-[10px]
                    sm:text-[11px]
                    md:text-[12px]
                    border-collapse
                  "
                >

                  {/* TABLE HEADER */}

                  <thead>
                    <tr className="text-white bg-blue-900">

                      <th className="p-2 whitespace-nowrap">
                        Service No.
                      </th>

                      <th className="p-2 whitespace-nowrap">
                        Route
                      </th>

                      <th className="p-2 whitespace-nowrap">
                        Departure
                      </th>

                      <th className="p-2 whitespace-nowrap">
                        Arrival
                      </th>

                      <th className="p-2 whitespace-nowrap">
                        Fare
                      </th>

                      <th className="p-2 whitespace-nowrap">
                        Remarks
                      </th>

                    </tr>
                  </thead>

                  {/* TABLE BODY */}

                  <tbody className="text-center">

                    {/* ================= 1ST BUS ================= */}

                    <tr className="border-b border-gray-300">

                      <td
                        rowSpan="4"
                        className="p-2 font-bold text-white bg-green-600 whitespace-nowrap"
                      >
                        1st Bus
                      </td>

                      <td
                        rowSpan="4"
                        className="p-2 font-medium whitespace-nowrap"
                      >
                        Banderdewa → Airport
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        06:30 AM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        08:30 AM
                      </td>

                      <td className="p-2">
                        ₹70
                      </td>

                      <td
                        rowSpan="4"
                        className="
                          p-2
                          text-[10px]
                          sm:text-xs
                        "
                      >
                        Connecting Flight
                        <br />
                        Daily Service
                      </td>

                    </tr>

                    <tr className="border-b border-gray-300">

                      <td className="p-2 whitespace-nowrap">
                        08:40 AM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        10:20 AM
                      </td>

                      <td className="p-2">
                        ₹30
                      </td>

                    </tr>

                    <tr className="border-b border-gray-300">

                      <td className="p-2 whitespace-nowrap">
                        10:30 AM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        11:30 AM
                      </td>

                      <td className="p-2">
                        ₹50
                      </td>

                    </tr>

                    <tr className="border-b border-gray-300">

                      <td className="p-2 whitespace-nowrap">
                        02:30 PM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        05:00 PM
                      </td>

                      <td className="p-2">
                        ₹150
                      </td>

                    </tr>

                    {/* ================= 2ND BUS ================= */}

                    <tr className="border-b border-gray-300">

                      <td
                        rowSpan="4"
                        className="p-2 font-bold text-white bg-green-500 whitespace-nowrap"
                      >
                        2nd Bus
                      </td>

                      <td
                        rowSpan="4"
                        className="p-2 font-medium whitespace-nowrap"
                      >
                        Banderdewa → Airport
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        09:30 AM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        10:30 AM
                      </td>

                      <td className="p-2">
                        ₹70
                      </td>

                      <td
                        rowSpan="4"
                        className="
                          p-2
                          text-[10px]
                          sm:text-xs
                        "
                      >
                        Connecting Flight
                        <br />
                        Daily Service
                      </td>

                    </tr>

                    <tr className="border-b border-gray-300">

                      <td className="p-2 whitespace-nowrap">
                        10:40 AM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        11:20 AM
                      </td>

                      <td className="p-2">
                        ₹30
                      </td>

                    </tr>

                    <tr className="border-b border-gray-300">

                      <td className="p-2 whitespace-nowrap">
                        11:30 AM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        12:30 PM
                      </td>

                      <td className="p-2">
                        ₹50
                      </td>

                    </tr>

                    <tr>

                      <td className="p-2 whitespace-nowrap">
                        03:40 PM
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        06:00 PM
                      </td>

                      <td className="p-2">
                        ₹150
                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

              {/* MOBILE TABLE HINT */}

              <p
                className="
                  mt-1
                  text-[9px]
                  text-gray-400
                  text-center
                  sm:hidden
                "
              >
                ← Swipe table horizontally →
              </p>

            </div>

            {/* =================================================
                RIGHT BUS IMAGES
            ================================================= */}

            <div
              className="grid w-full grid-cols-2 gap-3 lg:grid-cols-1"
            >

              <img
                src={busImg}
                alt="APSTS Bus"
                className="object-cover w-full shadow-md h-28 sm:h-32 lg:h-36 rounded-xl"
              />

              <img
                src={busImg}
                alt="APSTS Bus"
                className="object-cover w-full shadow-md h-28 sm:h-32 lg:h-36 rounded-xl"
              />

            </div>

          </div>

          {/* =================================================
              CONTACT STRIP
          ================================================= */}

          <div
            className="flex flex-col items-center justify-between gap-3 p-3 mt-4 text-center text-white sm:flex-row sm:p-4 sm:mt-6 sm:text-left bg-gradient-to-r from-blue-900 to-green-600 rounded-xl"
          >

            <div
              className="text-xs leading-relaxed sm:text-sm"
            >
              Booking Counter APSTS, Itanagar

              <br />

              <span className="font-bold text-yellow-300">
                0360-3569962
              </span>
            </div>

            <div
              className="text-xs leading-relaxed sm:text-sm"
            >
              1st Bus: 9436204046
              <br />
              2nd Bus: 8413846127
            </div>

          </div>

          {/* =================================================
              NOTICE
          ================================================= */}

          <div
            className="flex flex-col items-center justify-between gap-3 p-3 mt-4 text-center bg-gray-100 sm:flex-row sm:p-4 rounded-xl sm:text-left"
          >

            <div>

              <p
                className="text-sm font-semibold text-gray-700 sm:text-base"
              >
                NOTICE
              </p>

              <p
                className="text-xs text-gray-500 sm:text-sm"
              >
                For more updates & schedule changes
              </p>

            </div>

            <button
              onClick={() => {
                setShow(false);
                navigate("/home/notice");
              }}
              className="px-5 py-2 text-xs text-white transition bg-orange-500 rounded-full sm:text-sm hover:bg-orange-600 whitespace-nowrap"
            >
              Read More →
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default NoticePopup;