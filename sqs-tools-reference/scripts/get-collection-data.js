/**
 * Get Collection Data — standalone injection script
 * Run this in the browser console (or as a bookmarklet) while on a
 * Squarespace admin page (e.g. a page/collection editor screen).
 *
 * Based on the same request pattern used in your old template-getter.html
 * (GetCollection endpoint + crumb-token auth).
 */

(function () {
  function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function getUrl() {
    return window.location.protocol + '//' + window.location.host;
  }

  // Squarespace admin pages set body id like "collection-<id>" on
  // collection edit screens. Fallback: try to pull it from context if present.
  function getCollectionId() {
    const bodyId = document.body.id || '';
    if (bodyId.includes('-')) {
      const id = bodyId.split('-')[1];
      if (id && id.length > 10) return id;
    }
    // Fallback: Squarespace often exposes site/page context here
    if (window.Static && window.Static.SQUARESPACE_CONTEXT) {
      const ctx = window.Static.SQUARESPACE_CONTEXT;
      if (ctx.collection && ctx.collection.id) return ctx.collection.id;
    }
    return null;
  }

  function getCollectionData(collectionId) {
    const crumb = getCookie('crumb');

    return fetch(`${getUrl()}/api/commondata/GetCollection?collectionId=${collectionId}`, {
      method: 'GET',
      credentials: 'include', // send existing admin session cookies
      headers: {
        'X-CSRF-Token': crumb,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Collection Data:', data);
        return data;
      })
      .catch((err) => {
        console.error('Failed to get collection data:', err);
      });
  }

  const collectionId = getCollectionId();

  if (!collectionId) {
    console.warn(
      'Could not auto-detect collection ID from this page. ' +
      'Call getCollectionData("<id>") manually with the ID.'
    );
  } else {
    console.log('Detected collection ID:', collectionId);
    getCollectionData(collectionId);
  }

  // Expose for manual use / re-running against a different ID
  window.SQSTools = window.SQSTools || {};
  window.SQSTools.getCollectionData = getCollectionData;
  window.SQSTools.getCollectionId = getCollectionId;
})();
