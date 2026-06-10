import { useState } from "react";
import { useNavigate } from "react-router-dom";
import busImg from "../../assets/bus.png";
import logo from "../../assets/logo.png";

function NoticePopup() {
  const [show, setShow] = useState(true);
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">

      <div className="relative w-[95%] md:w-[1050px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6">

        {/* CLOSE */}
        <button
          onClick={() => setShow(false)}
          className="absolute flex items-center justify-center w-10 h-10 text-xl text-white bg-red-500 rounded-full top-3 right-3"
        >
          ✕
        </button>

        {/* HEADER */}
       <div className="flex items-center justify-center gap-4 mb-6 text-center">

  {/* LEFT LOGO */}
  <img
    src={logo}
    alt="logo"
    className="object-contain w-14 h-14"
  />

  {/* TEXT */}
  <div>
    <h1 className="text-2xl font-bold tracking-wide text-blue-900 md:text-3xl">

      SCHEDULE OF BUS SERVICE

    </h1>

    <p className="text-xs text-gray-600 md:text-sm">
      BETWEEN BANDERDEWA TO DONYI-POLO AIRPORT AND VICE VERSA
    </p>

    <p className="text-xs font-semibold text-green-600 md:text-sm">
      VIA NAHARLAGUN, ITANAGAR
    </p>
  </div>

</div>

        {/* MAIN */}
        <div className="grid gap-4 md:grid-cols-3">

          {/* TABLE */}
          <div className="overflow-x-auto md:col-span-2">

            <table className="w-full text-[12px] border border-gray-300">

              <thead>
                <tr className="text-white bg-blue-900">
                  <th className="p-2">Service No.</th>
                  <th className="p-2">Route</th>
                  <th className="p-2">Departure</th>
                  <th className="p-2">Arrival</th>
                  <th className="p-2">Fare</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>

              <tbody className="text-center">

                {/* 1st BUS GROUP */}
                <tr className="border">
                  <td rowSpan="4" className="font-bold text-white bg-green-600">
                    1st Bus
                  </td>
                  <td rowSpan="4" className="font-medium">
                    Banderdewa → Airport
                  </td>
                  <td>06:30 AM</td>
                  <td>08:30 AM</td>
                  <td>70</td>
                  <td rowSpan="4" className="text-xs">
                    Connecting Flight <br /> Daily Service
                  </td>
                </tr>

                <tr className="border">
                  <td>08:40 AM</td>
                  <td>10:20 AM</td>
                  <td>30</td>
                </tr>

                <tr className="border">
                  <td>10:30 AM</td>
                  <td>11:30 AM</td>
                  <td>50</td>
                </tr>

                <tr className="border">
                  <td>02:30 PM</td>
                  <td>05:00 PM</td>
                  <td>150</td>
                </tr>

                {/* 2nd BUS GROUP */}
                <tr className="border">
                  <td rowSpan="4" className="font-bold text-white bg-green-500">
                    2nd Bus
                  </td>
                  <td rowSpan="4" className="font-medium">
                    Banderdewa → Airport
                  </td>
                  <td>09:30 AM</td>
                  <td>10:30 AM</td>
                  <td>70</td>
                  <td rowSpan="4" className="text-xs">
                    Connecting Flight <br /> Daily Service
                  </td>
                </tr>

                <tr className="border">
                  <td>10:40 AM</td>
                  <td>11:20 AM</td>
                  <td>30</td>
                </tr>

                <tr className="border">
                  <td>11:30 AM</td>
                  <td>12:30 PM</td>
                  <td>50</td>
                </tr>

                <tr className="border">
                  <td>03:40 PM</td>
                  <td>06:00 PM</td>
                  <td>150</td>
                </tr>

              </tbody>
            </table>

          </div>

          {/* RIGHT IMAGES */}
          <div className="flex-col hidden gap-3 md:flex">
            <img src={busImg} className="object-cover h-28 rounded-xl" />
            <img src={busImg} className="object-cover h-28 rounded-xl" />
         
          </div>

        </div>

        {/* CONTACT STRIP */}
        <div className="flex flex-col items-center justify-between p-4 mt-6 text-white md:flex-row bg-gradient-to-r from-blue-900 to-green-600 rounded-xl">

          <div>
            Booking Counter APSTS, Itanagar <br />
            <span className="font-bold text-yellow-300">
              0360-3569962
            </span>
          </div>

          <div className="text-sm">
            1st Bus: 9436204046 <br />
            2nd Bus: 8413846127
          </div>

        </div>

        {/* NOTICE */}
        <div className="flex items-center justify-between p-4 mt-5 bg-gray-100 rounded-xl">

          <div>
            <p className="font-semibold text-gray-700">NOTICE</p>
            <p className="text-sm text-gray-500">
              For more updates & schedule changes
            </p>
          </div>

          <button
            onClick={() => {
              setShow(false);
              navigate("/notice");
            }}
            className="px-5 py-2 text-sm text-white bg-orange-500 rounded-full hover:bg-orange-600"
          >
            Read More →
          </button>

        </div>

      </div>
    </div>
  );
}

export default NoticePopup;