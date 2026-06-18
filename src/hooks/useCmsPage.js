import { useState, useEffect } from "react";
import { cmsApi } from "../api/cms";

export function useCmsPage(slug) {
  const [page,    setPage]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!slug) return;
    cmsApi.getPage(slug)
      .then((res) => setPage(res.data?.data ?? res.data))
      .catch((e)  => setError(e))
      .finally(()  => setLoading(false));
  }, [slug]);

  return { page, loading, error };
}