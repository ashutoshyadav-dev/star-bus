import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import logo from "../../assets/logo.png";
function Footer() {
  return (
    <div className="bg-[#1f3b4d] text-white px-12 py-12">

      {/* Top Section */}
      <div className="grid grid-cols-4 gap-10">

        {/* Column 1 */}
        <div>
          <div className="flex items-start gap-3">
           <img
  src={logo}
  alt="DeptLogo"
  className="w-12 h-12"
/>
            <div>
              <h2 className="text-lg font-semibold leading-6">
                Arunachal Pradesh State <br />
                Transport Services <br />
                Version 4.0
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-300">
            Your trusted partner for exploring <br />
            Arunachal Pradesh
          </p>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="mb-4 font-semibold">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Web Information Manager</li>
            <li>Disclaimer</li>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="mb-4 font-semibold">Contact</h3>

          <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
            <FiPhone /> +91 9863319884
          </div>

          <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
            <FiMail /> apsts-arn[at]gov[dot]in
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-300">
            <FiMapPin className="mt-1" />
            <p>
              Office of The General Manager <br />
              Arunachal Pradesh State Transport Services, <br />
              Papum Pare, Arunachal Pradesh
            </p>
          </div>
        </div>

        {/* Column 4 */}
        <div>
          <h3 className="mb-4 font-semibold">Follow Us</h3>

          <div className="flex gap-3">
            <div className="bg-[#2c4f63] p-3 rounded-full cursor-pointer hover:bg-[#355e75]">
              <FaFacebookF />
            </div>
            <div className="bg-[#2c4f63] p-3 rounded-full cursor-pointer hover:bg-[#355e75]">
              <FaInstagram />
            </div>
            <div className="bg-[#2c4f63] p-3 rounded-full cursor-pointer hover:bg-[#355e75]">
              <FaTwitter />
            </div>
            <div className="bg-[#2c4f63] p-3 rounded-full cursor-pointer hover:bg-[#355e75]">
              <FaYoutube />
            </div>
          </div>
        </div>

      </div>

      {/* Divider Line */}
      <div className="mt-10 border-t border-gray-500"></div>

      {/* Bottom */}
      <div className="mt-6 text-sm text-center text-gray-300">
        © 2026 Arunachal Pradesh Car Rental. All rights reserved.
      </div>

    </div>
  );
}

export default Footer;