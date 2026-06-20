import banner from "../../../assets/banner.png";
import Breadcrumb from "../../Website/Breadcrumb";
import { FaFilePdf, FaClock, FaBullhorn, FaCalendarAlt } from "react-icons/fa";
import { buildImageUrl } from "../../../api/cms";

export default function DocumentListTemplate({ page }) {
  const docs = page?.documents ?? [];

  // Detect if this is a tender-style page (has closing dates / reference numbers)
  const isTender = docs.some((d) => d.closingDate || d.referenceNumber);

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
  

      <div className="relative h-[280px] flex items-center px-10 pt-20 text-white">
        <div className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            {page?.title?.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-green-400">
              {page?.title?.split(" ").slice(-1)}
            </span>
          </h1>
          <p className="mt-2 text-gray-200">{page?.subtitle}</p>
        </div>
      </div>

      <Breadcrumb title={page?.title ?? ""} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {docs.length === 0 ? (
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm p-6 bg-white shadow-lg rounded-2xl
              border border-gray-100 text-center">
              <div className="flex items-center justify-center w-14 h-14 mb-4
                rounded-full bg-green-100 mx-auto">
                <FaBullhorn className="text-2xl text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Upcoming</h2>
              <p className="mt-2 text-sm text-gray-500">
                No documents available at the moment.
              </p>
              <span className="px-4 py-1 mt-4 inline-block text-xs font-medium
                text-green-700 bg-green-100 rounded-full">
                Stay Tuned
              </span>
            </div>
          </div>
        ) : isTender ? (
          /* Tender-style: list with dates + download */
          <div className="space-y-4">
            {docs.map((doc) => (
              <div key={doc.id}
                className="bg-white rounded-2xl shadow-md p-6 flex items-start
                  justify-between gap-4 hover:shadow-lg transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FaBullhorn className="text-green-600" />
                    <h3 className="font-semibold text-gray-800">{doc.title}</h3>
                  </div>
                  {doc.referenceNumber && (
                    <p className="text-xs text-gray-400 mb-2">
                      Ref: {doc.referenceNumber}
                    </p>
                  )}
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {doc.publishedDate && (
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-green-500" />
                        Published: {doc.publishedDate}
                      </span>
                    )}
                    {doc.closingDate && (
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-red-400" />
                        Closes: {doc.closingDate}
                      </span>
                    )}
                  </div>
                </div>
                {doc.fileUrl && (
                  <a href={buildImageUrl(doc.fileUrl)} target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600
                      text-white text-sm rounded-xl hover:bg-green-700
                      transition-colors shrink-0">
                    <FaFilePdf />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* RTI-style: PDF card grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {docs.map((doc) => (
              <div key={doc.id}
                className="overflow-hidden bg-white border border-gray-200
                  shadow-md rounded-xl hover:shadow-lg transition-all duration-300">
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
                      Will be available soon.
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