import banner from "../../assets/banner.png";
import Breadcrumb from "../Website/Breadcrumb";
import { FaFilePdf, FaClock } from "react-icons/fa";
import { useCmsPage } from "../../hooks/useCmsPage";
import { buildImageUrl } from "../../api/cms";

function RTI() {
  const { page, loading } = useCmsPage("rti");
  const docs = page?.documents ?? [];

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
     

      <div className="relative h-[280px] flex items-center px-10 pt-20 text-white">
        <div className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            RTI <span className="text-green-400">Manual</span>
          </h1>
          <p className="mt-2 text-gray-200">Right To Information Manuals</p>
        </div>
      </div>

      <Breadcrumb title="RTI Manual" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent
              rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {docs.map((doc) => (
              <div key={doc.id}
                className="overflow-hidden bg-white border border-gray-200 shadow-md
                  rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="h-14 flex items-center px-4 text-white
                  bg-gradient-to-r from-green-700 to-green-600">
                  {doc.fileUrl
                    ? <FaFilePdf className="mr-3 text-lg" />
                    : <FaClock className="mr-3 text-base" />}
                  <h3 className="font-medium">{doc.title}</h3>
                </div>

                {doc.fileUrl ? (
                  <div className="p-4 flex flex-col items-center gap-3">
                    <iframe
                      src={`${buildImageUrl(doc.fileUrl)}#toolbar=1`}
                      title={doc.title}
                      className="w-full rounded"
                      style={{ height: "260px" }}
                    />
                    <a href={buildImageUrl(doc.fileUrl)} target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-700 font-medium hover:underline">
                      Open PDF ↗
                    </a>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center
                    justify-center bg-gray-50 px-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex
                      items-center justify-center mb-4">
                      <FaClock className="text-2xl text-gray-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Coming Soon</h2>
                    <p className="mt-2 text-xs text-center text-gray-500">
                      RTI Manual will be available soon.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RTI;