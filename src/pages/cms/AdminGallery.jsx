import { useState, useEffect, useRef } from "react";
import { cmsApi, buildImageUrl } from "../../api/cms";
import toast from "react-hot-toast";

function AdminGallery() {
  const [images,    setImages]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form,      setForm]      = useState({ title: "", altText: "", sortOrder: 0 });
  const fileRef = useRef();

   useEffect(() => {
    document.title = "Gallery | APSTS Admin Portal";
  }, []);

  const load = () => {
    setLoading(true);
    cmsApi.adminGetAllGallery()
      .then((res) => setImages(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load gallery."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!fileRef.current?.files[0]) {
      toast.error("Please select an image file.");
      return;
    }
    if (!form.altText.trim()) {
      toast.error("Alt text is required.");
      return;
    }
    setUploading(true);
    try {
      await cmsApi.adminUploadImage(fileRef.current.files[0], form);
      toast.success("Image uploaded successfully.");
      setForm({ title: "", altText: "", sortOrder: 0 });
      fileRef.current.value = "";
      load();
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (img) => {
    try {
      if (img.isActive) await cmsApi.adminDeactivateImage(img.id);
      else              await cmsApi.adminActivateImage(img.id);
      toast.success(`Image ${img.isActive ? "hidden" : "activated"}.`);
      load();
    } catch {
      toast.error("Failed to update image status.");
    }
  };

  const remove = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Delete this image permanently?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await cmsApi.adminDeleteImage(id);
                toast.success("Image deleted.");
                load();
              } catch {
                toast.error("Delete failed.");
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 border rounded text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gallery Management</h1>

      {/* Upload card */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="font-semibold text-gray-700 mb-4">Upload New Image</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Title (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Alt text *"
            value={form.altText}
            onChange={(e) => setForm({ ...form, altText: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload Image"}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="relative">
                <img
                  src={buildImageUrl(img.imageUrl)}
                  alt={img.altText}
                  className="object-cover w-full h-40"
                  onError={(e) => { e.target.style.background = "#f3f4f6"; }}
                />
                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium
                  ${img.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                  {img.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-700 truncate">{img.title || "—"}</p>
                <p className="text-xs text-gray-400 truncate">{img.altText}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggle(img)}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {img.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => remove(img.id)}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminGallery;