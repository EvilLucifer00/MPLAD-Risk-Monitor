import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title and meta description
 * for Single Page Application routing, SEO indexing, and screen reader announcements.
 *
 * @param {string} title - The title of the page (e.g. "Dashboard Overview | MP Portal")
 * @param {string} description - The meta description summarizing the view content
 */
export function usePageSeo(title, description) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | MPLADS Risk Monitor`;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }
    }
  }, [title, description]);
}

export default usePageSeo;
