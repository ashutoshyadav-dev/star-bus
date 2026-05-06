import img1 from "../../assets/Gallery 1.png";
import img2 from "../../assets/Gallery 2.png";
import img3 from "../../assets/Gallery 3.png";
import img4 from "../../assets/Gallery 4.png";
import img5 from "../../assets/Gallery 5.png";
import img6 from "../../assets/Gallery 6.png";

function Gallery() {

  const images = [img1, img2, img3, img4, img5, img6];

  return (
    <div className="px-10 py-16 bg-gray-100">

      {/* Heading */}
      <div className="relative mb-10">

        <div className="text-center">
          <h2 className="text-3xl font-bold">Gallery</h2>
          <p className="text-sm text-gray-500">
            Explore beautiful destinations
          </p>
        </div>

        <button className="absolute top-0 right-0 px-4 py-2 text-sm text-white bg-orange-500 rounded-full">
          View All
        </button>

      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-6">

        {images.map((img, index) => (
          <div
            key={index}
            className="overflow-hidden transition duration-300 shadow-md rounded-xl hover:shadow-xl"
          >
            <img
              src={img}
              alt="gallery"
              className="object-cover w-full h-56 transition duration-300 hover:scale-105"
            />
          </div>
        ))}

      </div>

    </div>
  );
}

export default Gallery;