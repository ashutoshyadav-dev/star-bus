// src/components/home/Gallery.jsx
import { useState, useEffect } from "react";
import { cmsApi, buildImageUrl } from "../../api/cms";

function Gallery() {
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsApi.getActiveGallery()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setImages(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-10 py-16 bg-gray-100">

      <div className="relative mb-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Gallery</h2>
          <p className="text-sm text-gray-500">Explore beautiful destinations</p>
        </div>
        <button className="absolute top-0 right-0 px-4 py-2 text-sm text-white bg-orange-500 rounded-full">
          View All
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No images yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden transition duration-300 shadow-md rounded-xl hover:shadow-xl"
            >
              <img
                src={buildImageUrl(img.imageUrl)}
                alt={img.altText || img.title || "Gallery image"}
                className="object-cover w-full h-56 transition duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Gallery;