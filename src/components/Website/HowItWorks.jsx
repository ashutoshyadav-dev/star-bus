import howbook from "../../assets/howbook.png";

function HowItWorks() {
  return (
    <div className="bg-[#0f2c3f] text-white py-20 text-center">

      {/* Heading */}
      <h2 className="text-3xl font-bold mb-10">
        How to book online ticket ?
      </h2>

      {/* Full Width Image */}
      <img
        src={howbook}
        alt="how to book"
        className="w-full h-auto"
      />

    </div>
  );
}

export default HowItWorks;