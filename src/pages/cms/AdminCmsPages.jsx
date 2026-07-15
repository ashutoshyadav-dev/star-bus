import { useState, useEffect, useRef } from "react";
import { cmsApi, buildImageUrl } from "../../api/cms";
import toast from "react-hot-toast";

const TABS = ["Pages", "Our History", "RTI", "Cancellation Policy", "Tenders"];

const TEMPLATES = [
  { value: "RICH_TEXT",      label: "Rich Text",      desc: "Title + paragraphs + bullet lists" },
  { value: "DOCUMENT_LIST",  label: "Document List",  desc: "PDF cards (RTI, Tenders style)"    },
  { value: "POLICY",         label: "Policy",         desc: "Table + terms & conditions"        },
  { value: "CUSTOM",         label: "Custom JSON",    desc: "Raw JSON content"                  },
];

export default function AdminCmsPages() {
  const [tab, setTab] = useState("Pages");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">CMS Pages</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${tab === t
                ? "bg-orange-500 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Pages"              && <PagesManager />}
      {tab === "Our History"        && <OurHistoryEditor />}
      {tab === "RTI"                && <RtiEditor />}
      {tab === "Cancellation Policy" && <PolicyEditor />}
      {tab === "Tenders"            && <TenderEditor />}
    </div>
  );
}

// =============================================================================
// Pages Manager — create / edit / publish any page
// =============================================================================

function PagesManager() {
  const [pages,      setPages]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("list"); // "list" | "create" | "edit"
  const [selected,   setSelected]   = useState(null);  // page being edited

  const load = () => {
    setLoading(true);
    cmsApi.adminGetAllPages()
      .then((res) => setPages(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load pages."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (view === "create") {
    return (
      <PageForm
        onSaved={(page) => { load(); setSelected(page); setView("edit"); }}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "edit" && selected) {
    return (
      <PageEditor
        page={selected}
        onUpdated={(updated) => { setSelected(updated); load(); }}
        onBack={() => { setView("list"); setSelected(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{pages.length} page(s)</p>
        <button
          onClick={() => setView("create")}
          className="px-5 py-2 bg-orange-500 text-white rounded-full text-sm
            hover:bg-orange-600"
        >
          + New Page
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-center">Template</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Updated</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No pages yet. Click "+ New Page" to create one.
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        /home/{p.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {p.template?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${p.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"}`}>
                        {p.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400">
                      {p.updatedAt
                        ? new Date(p.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => { setSelected(p); setView("edit"); }}
                          className="text-xs px-3 py-1 border rounded-lg
                            hover:bg-gray-50 text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => togglePublish(p, load)}
                          className={`text-xs px-3 py-1 rounded-lg
                            ${p.isPublished
                              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                        >
                          {p.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => deletePage(p.id, load)}
                          className="text-xs px-3 py-1 bg-red-50 text-red-500
                            rounded-lg hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Helpers shared by PagesManager ──────────────────────────────────────────

async function togglePublish(page, reload) {
  try {
    if (page.isPublished) {
      await cmsApi.adminUnpublishPage(page.id);
      toast.success("Page unpublished.");
    } else {
      await cmsApi.adminPublishPage(page.id);
      toast.success("Page published — live at /home/" + page.slug);
    }
    reload();
  } catch {
    toast.error("Failed to update publish status.");
  }
}

function deletePage(id, reload) {
  toast((t) => (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Delete this page permanently?</p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await cmsApi.adminDeletePage(id);
              toast.success("Page deleted.");
              reload();
            } catch { toast.error("Delete failed."); }
          }}
          className="px-3 py-1 bg-red-500 text-white rounded text-xs"
        >Delete</button>
        <button onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 border rounded text-xs">Cancel</button>
      </div>
    </div>
  ), { duration: 6000 });
}

// =============================================================================
// PageForm — create new page (step 1)
// =============================================================================

function PageForm({ onSaved, onCancel }) {
  const [form,   setForm]   = useState({
    title: "", slug: "", subtitle: "",
    template: "RICH_TEXT", isPublished: false,
    metaTitle: "", metaDescription: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug  = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setForm((f) => ({ ...f, title, slug }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.slug.trim())  { setError("Slug is required.");  return; }
    if (!form.template)     { setError("Template is required."); return; }

    setSaving(true);
    setError("");
    try {
      const res = await cmsApi.adminCreatePage({
        ...form,
        content: getDefaultContent(form.template),
      });
      const page = res.data?.data ?? res.data;
      toast.success("Page created! Now add your content.");
      onSaved(page);
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to create page.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-sm">
          ← Back
        </button>
        <h2 className="font-bold text-gray-800 text-lg">Create New Page</h2>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-5">

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Page Title *
          </label>
          <input
            value={form.title}
            onChange={handleTitleChange}
            placeholder="e.g. About APSTS"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
              focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Slug — auto-filled but editable */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            URL Slug * <span className="font-normal text-gray-400">(auto-generated)</span>
          </label>
          <div className="flex items-center border rounded-xl overflow-hidden
            focus-within:ring-2 focus-within:ring-orange-400">
            <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r">
              /home/
            </span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="about-apsts"
              className="flex-1 px-3 py-2 text-sm outline-none font-mono"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            This will be the URL: <strong>/home/{form.slug || "your-slug"}</strong>
          </p>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Subtitle / Hero Description
          </label>
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Short description shown in hero banner"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
              focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Template */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            Page Template * <span className="font-normal text-gray-400">
              (controls how content is displayed)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => (
              <label
                key={t.value}
                className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer
                  transition select-none
                  ${form.template === t.value
                    ? "bg-orange-50 border-orange-400"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.value}
                  checked={form.template === t.value}
                  onChange={() => setForm({ ...form, template: t.value })}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-gray-800">{t.label}</span>
                <span className="text-xs text-gray-500">{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SEO */}
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
            SEO Settings (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Meta Title
              </label>
              <input
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
                  focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
                  focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </details>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-100
            px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm
              hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Page →"}
          </button>
          <button onClick={onCancel}
            className="px-6 py-2 border rounded-full text-sm text-gray-600
              hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PageEditor — edit content of existing page (step 2)
// =============================================================================

function PageEditor({ page, onUpdated, onBack }) {
  const [saving,   setSaving]   = useState(false);
  const [content,  setContent]  = useState(page.content ?? {});
  const [rawJson,  setRawJson]  = useState(
    JSON.stringify(page.content ?? {}, null, 2)
  );
  const [jsonError, setJsonError] = useState("");

  const saveContent = async () => {
    let parsed = content;
    try {
      parsed = JSON.parse(rawJson);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON — please fix before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await cmsApi.adminUpdateContent(page.id, parsed);
      const updated = res.data?.data ?? res.data;
      toast.success("Content saved.");
      onUpdated(updated);
    } catch { toast.error("Save failed."); }
    finally  { setSaving(false); }
  };

  const publish = async () => {
    try {
      await cmsApi.adminPublishPage(page.id);
      toast.success(`Live at /home/${page.slug}`);
      onUpdated({ ...page, isPublished: true });
    } catch { toast.error("Publish failed."); }
  };

  const unpublish = async () => {
    try {
      await cmsApi.adminUnpublishPage(page.id);
      toast.success("Page unpublished.");
      onUpdated({ ...page, isPublished: false });
    } catch { toast.error("Unpublish failed."); }
  };

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back to Pages
          </button>
          <h2 className="font-bold text-gray-800 text-lg">{page.title}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${page.isPublished
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"}`}>
            {page.isPublished ? "Published" : "Draft"}
          </span>
        </div>

        <div className="flex gap-2">
          {page.isPublished ? (
            <button onClick={unpublish}
              className="px-4 py-1.5 text-sm border border-yellow-300 text-yellow-700
                rounded-full hover:bg-yellow-50">
              Unpublish
            </button>
          ) : (
            <button onClick={publish}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-full
                hover:bg-green-700">
              Publish →
            </button>
          )}
          <button onClick={saveContent} disabled={saving}
            className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-full
              hover:bg-orange-600 disabled:opacity-50">
            {saving ? "Saving…" : "Save Content"}
          </button>
        </div>
      </div>

      {/* Page info strip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3
        mb-6 text-sm text-blue-700 flex items-center gap-4">
        <span>Template: <strong>{page.template?.replace("_", " ")}</strong></span>
        <span>URL: <strong>/home/{page.slug}</strong></span>
        {page.isPublished && (
          <a href={`/home/${page.slug}`} target="_blank" rel="noreferrer"
            className="ml-auto text-xs underline hover:text-blue-900">
            View live page ↗
          </a>
        )}
      </div>

      {/* Content editor — switches by template */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Page Content</h3>

        {page.template === "RICH_TEXT"     && (
          <RichTextContentEditor
            content={rawJson}
            onChange={(json) => setRawJson(json)}
          />
        )}
        {page.template === "DOCUMENT_LIST" && (
          <DocumentListContentEditor page={page} />
        )}
        {page.template === "POLICY"        && (
          <PolicyContentEditor
            content={rawJson}
            onChange={(json) => setRawJson(json)}
          />
        )}
        {(page.template === "CUSTOM" || !TEMPLATES.find(t => t.value === page.template)) && (
          <RawJsonEditor
            content={rawJson}
            onChange={(json) => setRawJson(json)}
            error={jsonError}
          />
        )}

        {jsonError && (
          <p className="mt-3 text-xs text-red-500">{jsonError}</p>
        )}

        {/* Save button also at bottom */}
        <div className="mt-6 pt-4 border-t flex gap-3">
          <button onClick={saveContent} disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm
              hover:bg-orange-600 disabled:opacity-50">
            {saving ? "Saving…" : "Save Content"}
          </button>
          {!page.isPublished && (
            <button onClick={publish}
              className="px-6 py-2 bg-green-600 text-white rounded-full text-sm
                hover:bg-green-700">
              Save & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Content Editors per template
// =============================================================================

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

function RichTextContentEditor({ content, onChange }) {
  let parsed = {};
  try { parsed = JSON.parse(content); } catch (_) {}

  const update = (key, val) => {
    onChange(JSON.stringify({ ...parsed, [key]: val }, null, 2));
  };

  const paragraphs  = (parsed.paragraphs       ?? []).join("\n\n");
  const bulletSects = parsed.bulletSections     ?? [];
  const stats       = parsed.sidebar?.stats     ?? [];
  const highlights  = parsed.sidebar?.highlights?.items ?? [];

  return (
    <div className="space-y-5">

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          About / Main Title
        </label>
        <input
          value={parsed.aboutTitle ?? ""}
          onChange={(e) => update("aboutTitle", e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Paragraphs <span className="font-normal text-gray-400">
            (separate with a blank line)
          </span>
        </label>
        <textarea
          rows={8}
          value={paragraphs}
          onChange={(e) => update("paragraphs",
            e.target.value.split("\n\n").filter(Boolean))}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Bullet sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">
            Bullet Sections
          </label>
          <button
            onClick={() => update("bulletSections", [
              ...bulletSects, { heading: "New Section", items: [] }
            ])}
            className="text-xs px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            + Add Section
          </button>
        </div>

        {bulletSects.map((section, si) => (
          <div key={si} className="border rounded-xl p-4 mb-3 space-y-3">
            <div className="flex gap-2">
              <input
                value={section.heading}
                onChange={(e) => {
                  const updated = [...bulletSects];
                  updated[si] = { ...section, heading: e.target.value };
                  update("bulletSections", updated);
                }}
                placeholder="Section heading"
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => {
                  const updated = bulletSects.filter((_, i) => i !== si);
                  update("bulletSections", updated);
                }}
                className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg"
              >
                Remove
              </button>
            </div>
            <textarea
              rows={4}
              value={(section.items ?? []).join("\n")}
              onChange={(e) => {
                const updated = [...bulletSects];
                updated[si] = {
                  ...section,
                  items: e.target.value.split("\n").filter(Boolean)
                };
                update("bulletSections", updated);
              }}
              placeholder="One item per line"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Sidebar stats */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">
          Sidebar Stats <span className="font-normal text-gray-400">
            (color: green / orange / purple / blue)
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="border rounded-xl p-3 space-y-2">
              <input
                value={stat.label}
                onChange={(e) => {
                  const updated = [...stats];
                  updated[i] = { ...stat, label: e.target.value };
                  update("sidebar", {
                    ...parsed.sidebar,
                    stats: updated
                  });
                }}
                placeholder="Label"
                className="w-full border rounded-lg px-2 py-1 text-xs"
              />
              <div className="flex gap-2">
                <input
                  value={stat.value}
                  onChange={(e) => {
                    const updated = [...stats];
                    updated[i] = { ...stat, value: e.target.value };
                    update("sidebar", { ...parsed.sidebar, stats: updated });
                  }}
                  placeholder="Value"
                  className="flex-1 border rounded-lg px-2 py-1 text-xs"
                />
                <input
                  value={stat.color}
                  onChange={(e) => {
                    const updated = [...stats];
                    updated[i] = { ...stat, color: e.target.value };
                    update("sidebar", { ...parsed.sidebar, stats: updated });
                  }}
                  placeholder="color"
                  className="w-20 border rounded-lg px-2 py-1 text-xs"
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => update("sidebar", {
              ...parsed.sidebar,
              stats: [...stats, { label: "", value: "", color: "green" }]
            })}
            className="border-2 border-dashed rounded-xl p-3 text-xs text-gray-400
              hover:border-orange-300 hover:text-orange-400"
          >
            + Add Stat
          </button>
        </div>
      </div>

      {/* Sidebar highlights */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Key Highlights <span className="font-normal text-gray-400">(one per line)</span>
        </label>
        <textarea
          rows={5}
          value={highlights.join("\n")}
          onChange={(e) => update("sidebar", {
            ...parsed.sidebar,
            highlights: {
              heading: parsed.sidebar?.highlights?.heading ?? "Key Highlights",
              items: e.target.value.split("\n").filter(Boolean),
            }
          })}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400"
        />
      </div>
    </div>
  );
}

// ─── Document List Editor (for RTI, Tenders etc.) ─────────────────────────────

function DocumentListContentEditor({ page }) {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({
    title: "", description: "", referenceNumber: "",
    publishedDate: "", closingDate: "", sortOrder: 0,
  });
  const [adding,  setAdding]  = useState(false);
  const fileRefs = useRef({});
  const newFileRef = useRef();

  const load = () => {
    setLoading(true);
    cmsApi.adminGetDocuments(page.id)
      .then((res) => setDocs(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load documents."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page.id]);

  const addDoc = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      if (form.description)     fd.append("description",     form.description);
      if (form.referenceNumber) fd.append("referenceNumber", form.referenceNumber);
      if (form.publishedDate)   fd.append("publishedDate",   form.publishedDate);
      if (form.closingDate)     fd.append("closingDate",      form.closingDate);
      fd.append("sortOrder", form.sortOrder);
      if (newFileRef.current?.files[0]) {
        fd.append("file", newFileRef.current.files[0]);
      }
      await cmsApi.adminAddDocument(page.id, fd);
      toast.success("Document added.");
      setForm({ title:"", description:"", referenceNumber:"",
                publishedDate:"", closingDate:"", sortOrder:0 });
      if (newFileRef.current) newFileRef.current.value = "";
      load();
    } catch { toast.error("Failed to add document."); }
    finally  { setAdding(false); }
  };

  const uploadFile = async (docId) => {
    const file = fileRefs.current[docId]?.files[0];
    if (!file) { toast.error("Select a file."); return; }
    try {
      await cmsApi.adminUploadDocFile(docId, file);
      toast.success("File uploaded.");
      fileRefs.current[docId].value = "";
      load();
    } catch { toast.error("Upload failed."); }
  };

  const removeDoc = (docId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm">Remove this document?</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            toast.dismiss(t.id);
            try { await cmsApi.adminDeleteDocument(docId); toast.success("Removed."); load(); }
            catch { toast.error("Failed."); }
          }} className="px-3 py-1 bg-red-500 text-white rounded text-xs">Remove</button>
          <button onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 border rounded text-xs">Cancel</button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <div className="space-y-6">

      {/* Add document form */}
      <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
        <p className="text-xs font-semibold text-gray-600">Add New Document</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title *</label>
            <input value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Reference No.</label>
            <input value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Published Date</label>
            <input type="date" value={form.publishedDate}
              onChange={(e) => setForm({ ...form, publishedDate: e.target.value })}
              className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Closing Date</label>
            <input type="date" value={form.closingDate}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
              className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">File (PDF/Image)</label>
            <input type="file" ref={newFileRef}
              className="w-full border rounded-lg px-3 py-1 text-sm" />
          </div>
        </div>
        <button onClick={addDoc} disabled={adding}
          className="px-5 py-2 bg-orange-500 text-white text-sm rounded-full
            hover:bg-orange-600 disabled:opacity-50">
          {adding ? "Adding…" : "+ Add Document"}
        </button>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="text-gray-400 text-sm">Loading documents…</div>
      ) : docs.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          No documents yet. Add one above.
        </p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id}
              className="flex items-center gap-3 border rounded-xl p-4 bg-white">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800">{doc.title}</p>
                {doc.referenceNumber && (
                  <p className="text-xs text-gray-400">Ref: {doc.referenceNumber}</p>
                )}
                <p className="text-xs mt-1">
                  {doc.fileUrl
                    ? <span className="text-green-600">✓ File uploaded</span>
                    : <span className="text-gray-400">No file — Coming Soon</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="file"
                  ref={(el) => { fileRefs.current[doc.id] = el; }}
                  className="text-xs border rounded px-2 py-1 w-32"
                />
                <button onClick={() => uploadFile(doc.id)}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg
                    hover:bg-blue-700">
                  Upload
                </button>
                <button onClick={() => removeDoc(doc.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg
                    hover:bg-red-100">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Policy Editor ────────────────────────────────────────────────────────────

function PolicyContentEditor({ content, onChange }) {
  let parsed = {};
  try { parsed = JSON.parse(content); } catch (_) {}

  const update = (key, val) => {
    onChange(JSON.stringify({ ...parsed, [key]: val }, null, 2));
  };

  const charges   = parsed.chargesTable?.rows ?? [];
  const terms     = (parsed.termsSections?.[0]?.items ?? []).join("\n");

  return (
    <div className="space-y-5">

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Refund Info Notice
        </label>
        <textarea rows={3} value={parsed.refundInfo ?? ""}
          onChange={(e) => update("refundInfo", e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">
            Charges Table
          </label>
          <button
            onClick={() => update("chargesTable", {
              heading: parsed.chargesTable?.heading ?? "Cancellation Charges",
              rows: [...charges, { period: "", deduction: "", color: "green" }]
            })}
            className="text-xs px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            + Add Row
          </button>
        </div>
        {charges.map((row, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={row.period}
              onChange={(e) => {
                const updated = [...charges];
                updated[i] = { ...row, period: e.target.value };
                update("chargesTable", {
                  ...parsed.chargesTable, rows: updated });
              }}
              placeholder="Cancellation period"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
            <input value={row.deduction}
              onChange={(e) => {
                const updated = [...charges];
                updated[i] = { ...row, deduction: e.target.value };
                update("chargesTable", {
                  ...parsed.chargesTable, rows: updated });
              }}
              placeholder="Deduction (e.g. 25%)"
              className="w-28 border rounded-lg px-3 py-1.5 text-sm" />
            <select value={row.color}
              onChange={(e) => {
                const updated = [...charges];
                updated[i] = { ...row, color: e.target.value };
                update("chargesTable", {
                  ...parsed.chargesTable, rows: updated });
              }}
              className="w-24 border rounded-lg px-2 py-1.5 text-sm">
              <option value="green">Green</option>
              <option value="orange">Orange</option>
              <option value="red">Red</option>
            </select>
            <button
              onClick={() => {
                const updated = charges.filter((_, ri) => ri !== i);
                update("chargesTable", {
                  ...parsed.chargesTable, rows: updated });
              }}
              className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg">
              ×
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Terms & Conditions <span className="font-normal text-gray-400">
            (one per line)
          </span>
        </label>
        <textarea rows={8} value={terms}
          onChange={(e) => update("termsSections", [{
            heading: "Additional Terms & Conditions",
            items: e.target.value.split("\n").filter(Boolean),
          }])}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400" />
      </div>
    </div>
  );
}

// ─── Raw JSON fallback ────────────────────────────────────────────────────────

function RawJsonEditor({ content, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-2">
        Content JSON
      </label>
      <textarea
        rows={20}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-xl px-3 py-2 text-xs font-mono
          focus:outline-none focus:ring-2
          ${error ? "border-red-400 focus:ring-red-400" : "focus:ring-orange-400"}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// =============================================================================
// Default content per template — used when creating a new page
// =============================================================================

function getDefaultContent(template) {
  switch (template) {
    case "RICH_TEXT":
      return {
        aboutTitle: "About This Page",
        paragraphs: ["Add your content here."],
        bulletSections: [],
        sidebar: { stats: [], highlights: { heading: "Key Highlights", items: [] } },
      };
    case "DOCUMENT_LIST":
      return { description: "Documents for this page." };
    case "POLICY":
      return {
        refundInfo: "",
        chargesTable: { heading: "Charges", rows: [] },
        termsSections: [{ heading: "Terms & Conditions", items: [] }],
      };
    default:
      return {};
  }
}

// =============================================================================
// Existing editors (Our History, RTI, Cancellation Policy, Tenders)
// kept as tabs for quick access to seeded pages
// =============================================================================

function OurHistoryEditor() {
  const [form,   setForm]   = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cmsApi.adminGetPage("our-history")
      .then((res) => {
        const d = res.data?.data ?? res.data;
        const c = d.content ?? {};
        setForm({
          id: d.id,
          paragraphs:    (c.paragraphs    ?? []).join("\n\n"),
          aboutTitle:    c.aboutTitle     ?? "",
          futurePlans:   (c.bulletSections?.[0]?.items ?? []).join("\n"),
          highlights:    (c.sidebar?.highlights?.items ?? []).join("\n"),
          statBuses:     c.sidebar?.stats?.[0]?.value ?? "280",
          statRoutes:    c.sidebar?.stats?.[1]?.value ?? "119",
          statStations:  c.sidebar?.stats?.[2]?.value ?? "15",
          statSubStations: c.sidebar?.stats?.[3]?.value ?? "7",
        });
      })
      .catch(() => toast.error("Failed to load."));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await cmsApi.adminUpdateContent(form.id, {
        aboutTitle: form.aboutTitle,
        paragraphs: form.paragraphs.split("\n\n").filter(Boolean),
        bulletSections: [{
          heading: "Future Development Plans",
          items: form.futurePlans.split("\n").filter(Boolean),
        }],
        sidebar: {
          stats: [
            { label: "Total Buses",  value: form.statBuses,       color: "green"  },
            { label: "Routes",       value: form.statRoutes,      color: "orange" },
            { label: "Stations",     value: form.statStations,    color: "green"  },
            { label: "Sub Stations", value: form.statSubStations, color: "purple" },
          ],
          highlights: {
            heading: "Key Highlights",
            items: form.highlights.split("\n").filter(Boolean),
          },
        },
      });
      toast.success("Our History updated.");
    } catch { toast.error("Save failed."); }
    finally  { setSaving(false); }
  };

  if (!form) return <div className="text-gray-400">Loading…</div>;

  const f = (label, key, multi = false, rows = 3) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {multi ? (
        <textarea rows={rows} value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400" />
      ) : (
        <input value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-orange-400" />
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5 max-w-3xl">
      <h2 className="font-semibold text-gray-700">Edit Our History Page</h2>
      {f("About Title", "aboutTitle")}
      {f("Paragraphs (blank line between each)", "paragraphs", true, 6)}
      {f("Future Plans (one per line)", "futurePlans", true, 5)}
      {f("Key Highlights (one per line)", "highlights", true, 5)}
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Total Buses", "statBuses"], ["Routes", "statRoutes"],
          ["Stations", "statStations"], ["Sub Stations", "statSubStations"],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input value={form[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
                focus:ring-2 focus:ring-orange-400" />
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving}
        className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm
          hover:bg-orange-600 disabled:opacity-50">
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

function RtiEditor() {
  const [page,    setPage]    = useState(null);
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const fileRefs = useRef({});

  const load = () => {
    setLoading(true);
    cmsApi.adminGetPage("rti")
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setPage(p);
        return cmsApi.adminGetDocuments(p.id);
      })
      .then((res) => setDocs(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const uploadPdf = async (docId) => {
    const file = fileRefs.current[docId]?.files[0];
    if (!file) { toast.error("Select a PDF."); return; }
    try {
      await cmsApi.adminUploadDocFile(docId, file);
      toast.success("PDF uploaded.");
      fileRefs.current[docId].value = "";
      load();
    } catch { toast.error("Upload failed."); }
  };

  if (loading) return <div className="text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-semibold text-gray-700">RTI Documents</h2>
      {docs.map((doc) => (
        <div key={doc.id}
          className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-800">{doc.title}</p>
            {doc.fileUrl
              ? <p className="text-xs text-green-600 mt-1">✓ PDF uploaded</p>
              : <p className="text-xs text-gray-400 mt-1">No PDF — Coming Soon</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="file" accept="application/pdf"
              ref={(el) => { fileRefs.current[doc.id] = el; }}
              className="text-xs border rounded px-2 py-1" />
            <button onClick={() => uploadPdf(doc.id)}
              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg
                hover:bg-green-700">
              Upload PDF
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PolicyEditor() {
  const [page,   setPage]   = useState(null);
  const [raw,    setRaw]    = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cmsApi.adminGetPage("cancellation-policy")
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setPage(p);
        setRaw(JSON.stringify(p.content ?? {}, null, 2));
      })
      .catch(() => toast.error("Failed to load."));
  }, []);

  const save = async () => {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { toast.error("Invalid JSON."); return; }
    setSaving(true);
    try {
      await cmsApi.adminUpdateContent(page.id, parsed);
      toast.success("Policy updated.");
    } catch { toast.error("Save failed."); }
    finally  { setSaving(false); }
  };

  if (!page) return <div className="text-gray-400">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <PolicyContentEditor content={raw} onChange={setRaw} />
      <button onClick={save} disabled={saving}
        className="mt-5 px-6 py-2 bg-orange-500 text-white rounded-full text-sm
          hover:bg-orange-600 disabled:opacity-50">
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

function TenderEditor() {
  const [page,    setPage]    = useState(null);
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({
    title: "", referenceNumber: "", description: "",
    publishedDate: "", closingDate: "", sortOrder: 0,
  });
  const [adding,  setAdding]  = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    cmsApi.adminGetPage("tender")
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setPage(p);
        return cmsApi.adminGetDocuments(p.id);
      })
      .then((res) => setDocs(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title.trim()) { toast.error("Title required."); return; }
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      if (form.description)     fd.append("description",     form.description);
      if (form.referenceNumber) fd.append("referenceNumber", form.referenceNumber);
      if (form.publishedDate)   fd.append("publishedDate",   form.publishedDate);
      if (form.closingDate)     fd.append("closingDate",      form.closingDate);
      fd.append("sortOrder", form.sortOrder);
      if (fileRef.current?.files[0]) fd.append("file", fileRef.current.files[0]);
      await cmsApi.adminAddDocument(page.id, fd);
      toast.success("Tender added.");
      setForm({ title:"", referenceNumber:"", description:"",
                publishedDate:"", closingDate:"", sortOrder:0 });
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch { toast.error("Failed."); }
    finally  { setAdding(false); }
  };

  const remove = (docId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm">Remove this tender?</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            toast.dismiss(t.id);
            try { await cmsApi.adminDeleteDocument(docId); toast.success("Removed."); load(); }
            catch { toast.error("Failed."); }
          }} className="px-3 py-1 bg-red-500 text-white rounded text-xs">Remove</button>
          <button onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 border rounded text-xs">Cancel</button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  if (loading) return <div className="text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Add New Tender</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Title *",          key: "title",           type: "text" },
            { label: "Reference Number", key: "referenceNumber", type: "text" },
            { label: "Published Date",   key: "publishedDate",   type: "date" },
            { label: "Closing Date",     key: "closingDate",     type: "date" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
              <input type={type} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
                  focus:ring-2 focus:ring-orange-400" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
          <textarea rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none
              focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Attach PDF (optional)
          </label>
          <input type="file" accept="application/pdf" ref={fileRef}
            className="border rounded-xl px-3 py-2 text-sm w-full" />
        </div>
        <button onClick={add} disabled={adding}
          className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm
            hover:bg-orange-600 disabled:opacity-50">
          {adding ? "Adding…" : "Add Tender"}
        </button>
      </div>

      {docs.length > 0 && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Published</th>
                <th className="px-4 py-3 text-center">Closes</th>
                <th className="px-4 py-3 text-center">PDF</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.title}</td>
                  <td className="px-4 py-3 text-center text-xs">{d.publishedDate ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-xs">{d.closingDate   ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {d.fileUrl
                      ? <a href={buildImageUrl(d.fileUrl)} target="_blank" rel="noreferrer"
                          className="text-xs text-green-600 hover:underline">View</a>
                      : <span className="text-xs text-gray-400">None</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => remove(d.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1
                        rounded hover:bg-red-50">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}