import { useState, useEffect } from "react";
import bg from "../../assets/news-bg.png";
import gradient from "../../assets/Gradient.png";
import gradient1 from "../../assets/Gradient1.png";

function Services() {
  const newsData = [
    { title: "New Routes to Tawang", date: "April 2026" },
    { title: "New Bus Service Launch", date: "May 2026" },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % newsData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#f3f6f9] py-20 px-10">

      {/* Heading */}
      <div className="text-center mb-10">

        <h2 className="text-3xl font-bold">News & Services</h2>

        <p className="text-gray-500 text-sm">
          Explore beautiful destinations
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* 🔥 LEFT NEWS */}
        <div
          className="rounded-xl p-6 text-white relative overflow-hidden"
          style={{
            backgroundImage: `url(${bg})`,
            backgroundSize: "cover",
          }}
        >

          <h3 className="text-xl font-bold mb-4">
            Latest News
          </h3>

          {/* TWO NEWS CARDS */}
          {[0,1].map((i) => (
            <div key={i} className="bg-white text-black p-4 rounded-lg shadow mb-3">

              <div className="flex items-center gap-3">

                {/* small image */}
                <div className="w-16 h-12 bg-gray-300 rounded"></div>

                <div>
                  <p className="text-sm font-semibold">
                    {newsData[(index+i)%2].title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {newsData[(index+i)%2].date}
                  </p>
                  <p className="text-orange-500 text-xs mt-1">
                    Read More →
                  </p>
                </div>

              </div>
            </div>
          ))}

          {/* arrows */}
          <div className="absolute bottom-3 left-4 text-white text-xl">
            ‹
          </div>
          <div className="absolute bottom-3 right-4 text-white text-xl">
            ›
          </div>

        </div>

        {/* 🔥 RIGHT SERVICES */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">

          {/* CARD COMPONENT */}
          {[
            { title: "Online ticket", items: ["Book Ticket","Cancel Ticket"], grad: gradient },
            { title: "Other Services", items: ["Timetable","Track My Bus"], grad: gradient },
            { title: "Seat Availability", items: ["Check Seat","Select Seat"], grad: gradient1 },
            { title: "Grievance", items: ["HelpDesk","Check status"], grad: gradient1 },

          ].map((card, i) => (

            <div
              key={i}
              className="relative bg-white p-5 rounded-xl border border-orange-400 shadow-sm overflow-hidden group"
            >

              {/* HALF CIRCLE GRADIENT */}
              <img
                src={card.grad}
                alt=""
                className="absolute top-0 right-0 w-32 opacity-40 pointer-events-none"
              />

              {/* HOVER OVERLAY */}
              <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-10 transition"></div>

              <h3 className="font-semibold text-orange-500 mb-2">
                {card.title}
              </h3>

              {card.items.map((item, idx) => (
                <p key={idx} className="text-sm flex items-center gap-2">
                  › {item}
                </p>
              ))}

            </div>

          ))}

          {/* 🔥 BOTTOM BAR */}
          <div className="col-span-2 bg-[#1f3c2e] text-white p-5 rounded-xl flex justify-between items-center">

            <div>
              <p className="text-sm">
                Conductor of the Month - March, 2026
              </p>
              <p className="text-xs text-gray-300">
                Details will be available soon.
              </p>
            </div>

            <button className="bg-orange-500 px-4 py-2 rounded">
              Visitor Count 7463882
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Services;