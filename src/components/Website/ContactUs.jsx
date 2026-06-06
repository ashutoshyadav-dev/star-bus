import banner from "../../assets/banner.png";
import Navbar from "../Website/Navbar";
import Breadcrumb from "../Website/Breadcrumb";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaHeadset,
} from "react-icons/fa";

function ContactUs() {
  return (
    <div className="w-full bg-[#f5f7fa] min-h-screen">
      <Navbar />

      {/* HERO */}
      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            Contact <span className="text-green-400">Us</span>
          </h1>

          <p className="mt-2 text-gray-200">
            We are here to help you with your queries and support
          </p>
        </div>
      </div>

      <Breadcrumb title="Contact Us" />

      <div className="max-w-6xl px-6 py-12 mx-auto grid md:grid-cols-2 gap-8">

        {/* CONTACT INFO */}
        <div className="p-6 bg-white shadow-md rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <FaHeadset className="text-2xl text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Get in Touch
            </h2>
          </div>

          <div className="space-y-5 text-gray-700">

            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="mt-1 text-green-600" />
              <p>
                Arunachal Pradesh State Transport Services,
                Papunallah, Papum Pare, Arunachal Pradesh, India
              </p>
            </div>

            <div className="flex items-center gap-3">
              <FaPhoneAlt className="text-green-600" />
              <p>+91 9863319884</p>
            </div>

            <div className="flex items-center gap-3">
              <FaEnvelope className="text-green-600" />
              <p>apsts-arn@gov.in</p>
            </div>

            <div className="flex items-center gap-3">
              <FaEnvelope className="text-green-600" />
              <p>sts.help-arn@gov.in</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-sm text-gray-600">
              Our support team is available during office hours to assist you
              with ticket booking, refund and travel related queries.
            </p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="p-6 bg-white shadow-md rounded-2xl">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Send a Message
          </h2>

          <form className="space-y-4">

            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="email"
              placeholder="Your Email"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="text"
              placeholder="Subject"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <textarea
              rows="5"
              placeholder="Your Message"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            ></textarea>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Submit
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default ContactUs;