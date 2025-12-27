import { useState, useEffect, useCallback, useRef } from 'react';
import { useBeforeUnload } from 'react-router-dom';

export function useUnsavedChanges(initialValues, currentValues, additionalDirtyCheck = () => false) {
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const hasUnsavedChangesRef = useRef(false);

  const hasUnsavedChanges = useCallback(() => {
    const valuesChanged = Object.keys(initialValues).some(
      key => currentValues[key] !== initialValues[key]
    );
    return isDirty && (valuesChanged || additionalDirtyCheck());
  }, [isDirty, initialValues, currentValues, additionalDirtyCheck]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges();
  }, [hasUnsavedChanges]);

  // Intercept link clicks
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a[href]');
      if (!link || !hasUnsavedChangesRef.current) return;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
      setShowUnsavedModal(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      if (hasUnsavedChangesRef.current) {
        window.history.pushState(null, '', window.location.pathname);
        setShowUnsavedModal(true);
        setPendingNavigation('__BACK__');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.pathname);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Browser beforeunload
  useBeforeUnload(
    useCallback((e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    }, [hasUnsavedChanges])
  );

  return {
    isDirty,
    setIsDirty,
    hasUnsavedChanges,
    showUnsavedModal,
    setShowUnsavedModal,
    pendingNavigation,
    setPendingNavigation
  };
}
