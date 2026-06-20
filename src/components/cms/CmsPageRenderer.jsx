import { useParams, Navigate } from "react-router-dom";
import { useCmsPage } from "../../hooks/useCmsPage";
import RichTextTemplate     from "./templates/RichTextTemplate";
import DocumentListTemplate from "./templates/DocumentListTemplate";
import PolicyTemplate       from "./templates/PolicyTemplate";


const TEMPLATES = {
  RICH_TEXT:     RichTextTemplate,
  DOCUMENT_LIST: DocumentListTemplate,
  POLICY:        PolicyTemplate,
};

// Pages with dedicated components — skip renderer for these
const DEDICATED_SLUGS = [
  "our-history", "rti", "cancellation-policy", "tender",
  "timetable", "helpdesk", "contact", "faq", "routes", "buses",
];

export default function CmsPageRenderer() {
  const { slug } = useParams();

  // If this slug has a dedicated component, don't render via CMS
  if (DEDICATED_SLUGS.includes(slug)) {
    return <Navigate to="/ap" replace />;
  }

  return <CmsPageContent slug={slug} />;
}

function CmsPageContent({ slug }) {
  const { page, loading, error } = useCmsPage(slug);

  if (loading) return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
      <div className="flex justify-center py-40">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent
          rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !page) return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
      <div className="flex flex-col items-center justify-center py-40 text-gray-400">
        <p className="text-6xl mb-4">404</p>
        <p className="text-lg">Page not found.</p>
      </div>
    </div>
  );

  const Template = TEMPLATES[page.template];

  if (!Template) return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
      <div className="flex items-center justify-center py-40 text-gray-400">
        Unknown template type: {page.template}
      </div>
    </div>
  );

  return <Template page={page} />;
}