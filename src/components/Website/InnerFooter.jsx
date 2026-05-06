function InnerFooter() {
  return (
    <footer className="bg-[#0B2C6B] text-white">

      {/* Top Section */}
      <div className="grid gap-8 px-10 py-8 md:grid-cols-3">

        {/* LEFT */}
        <div>
          <h2 className="mb-2 text-lg font-bold">APSTS</h2>
          <p className="text-sm opacity-80">
            Arunachal Pradesh State Transport Services provides safe and reliable
            transportation across the state.
          </p>
        </div>

        {/* MIDDLE */}
        <div>
          <h3 className="mb-2 font-semibold">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            <li>Disclaimer</li>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
            <li>Refund Policy</li>
          </ul>
        </div>

        {/* RIGHT */}
        <div>
          <h3 className="mb-2 font-semibold">Contact Us</h3>
          <p className="text-sm">📞 +91 9863319884</p>
          <p className="text-sm">✉ apsts@gmail.com</p>
          <p className="text-sm">📍 Itanagar, Arunachal Pradesh</p>
        </div>

      </div>

      {/* Bottom Strip */}
      <div className="bg-[#08204d] text-center text-sm py-3">
        © 2026 APSTS. All rights reserved.
      </div>

    </footer>
  );
}

export default InnerFooter;