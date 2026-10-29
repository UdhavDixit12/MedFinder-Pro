import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · MedFinder Pro` : 'MedFinder Pro — Find nearby healthcare';
  }, [title]);
}
