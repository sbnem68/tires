import { useEffect } from "react";

const SITE_NAME = "Tires4Today";

const upsertMeta = (name, content) => {
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const upsertCanonical = (href) => {
  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

/**
 * Per-page SEO control. `indexable` must be explicitly true to allow indexing;
 * everything else (including while loading) is noindex. index.html also ships noindex by default.
 */
export const Seo = ({ title, description, indexable = false, path }) => {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    if (description) upsertMeta("description", description);
    upsertMeta("robots", indexable ? "index, follow" : "noindex, nofollow");
    // One domain, one path per city. Query strings (attribution) are never part of the canonical URL.
    upsertCanonical(`${window.location.origin}${path ?? window.location.pathname}`);
  }, [title, description, indexable, path]);
  return null;
};
