/**
 * Get Page Data (Squarespace 7.1 / Fluid Engine) — collection metadata +
 * full section/row/column/block tree.
 *
 * Confirmed endpoint (captured from live admin network traffic):
 *   GET /api/pages/by-collection-id/<collectionId>
 * Returns: { regions: [ { sections: [ { content: { layout: {...} } } ] } ] }
 *
 * Run in the browser console while on a Squarespace 7.1 admin page.
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

  // On /config/pages (and other admin shell screens) the actual site — and
  // therefore window.Static.SQUARESPACE_CONTEXT — lives in a same-origin
  // iframe, not the top frame the console runs in by default. Check the top
  // frame first (works when run directly on a live page), then fall back to
  // scanning iframes for the same global.
  function findSquarespaceContext() {
    if (window.Static && window.Static.SQUARESPACE_CONTEXT) return window.Static.SQUARESPACE_CONTEXT;
    const iframes = document.querySelectorAll('iframe');
    for (const f of iframes) {
      try {
        const w = f.contentWindow;
        if (w && w.Static && w.Static.SQUARESPACE_CONTEXT) return w.Static.SQUARESPACE_CONTEXT;
      } catch (e) {
        // cross-origin iframe (e.g. an ad/embed) — skip it
      }
    }
    return null;
  }

  function getCollectionId() {
    const bodyId = document.body.id || '';
    if (bodyId.includes('-')) {
      const id = bodyId.split('-')[1];
      if (id && id.length > 10) return id;
    }
    const ctx = findSquarespaceContext();
    if (ctx && ctx.collection && ctx.collection.id) return ctx.collection.id;
    return null;
  }

  function apiGet(path) {
    const crumb = getCookie('crumb');
    return fetch(`${getUrl()}/api/${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        accept: 'application/json, text/plain, */*',
        'x-csrf-token': crumb,
      },
    }).then((res) =>
      res.text().then((raw) => {
        if (!res.ok) {
          console.error(`Request failed (${path}): ${res.status}`, raw);
          throw new Error(`Request failed (${path}): ${res.status}`);
        }
        if (!raw) {
          console.warn(`Empty response body for ${path} (status ${res.status})`);
          return null;
        }
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.error(`Non-JSON response for ${path}:`, raw.slice(0, 500));
          throw e;
        }
      })
    );
  }

  function getCollectionData(collectionId) {
    return apiGet(`commondata/GetCollection?collectionId=${collectionId}`);
  }

  // The real 7.1 layout endpoint: pages/by-collection-id/<id>
  function getPageLayoutData(collectionId) {
    return apiGet(`pages/by-collection-id/${collectionId}`);
  }

  // Recursively walk a Fluid Engine layout node. Rows can contain columns,
  // columns can contain nested rows OR blocks directly (both appear in
  // real responses), so we check every branch each level.
  function walkLayout(node, blocks) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((n) => walkLayout(n, blocks));
      return;
    }
    if (node.rows) walkLayout(node.rows, blocks);
    if (node.columns) walkLayout(node.columns, blocks);
    if (node.blocks) {
      node.blocks.forEach((b) => blocks.push(b));
    }
  }

  function countBlockTypes(blocks) {
    const counts = {};
    blocks.forEach((b) => {
      const key = b.definitionName || `type:${b.type}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function getFullPageData(collectionId) {
    return getCollectionData(collectionId).then((collection) => {
      return getPageLayoutData(collectionId).then((pageData) => {
        const regions = (pageData && pageData.regions) || [];
        const sections = regions.flatMap((r) => r.sections || []);
        const allBlocks = [];

        sections.forEach((s) => {
          const layout = s.content && s.content.layout;
          walkLayout(layout, allBlocks);
        });

        const result = {
          collection,
          regions,
          sections,           // full section objects: styles, background, layout, etc.
          blocks: allBlocks,  // flattened list of every block across all sections
          blockCounts: countBlockTypes(allBlocks),
        };

        console.log('Full page data:', result);
        return result;
      });
    });
  }

  const collectionId = getCollectionId();

  if (!collectionId) {
    console.warn(
      'Could not auto-detect collection ID from this page. ' +
      'Call SQSTools.getFullPageData("<id>") manually.'
    );
  } else {
    console.log('Detected collection ID:', collectionId);
    getFullPageData(collectionId);
  }

  window.SQSTools = window.SQSTools || {};
  window.SQSTools.getCollectionData = getCollectionData;
  window.SQSTools.getPageLayoutData = getPageLayoutData;
  window.SQSTools.getFullPageData = getFullPageData;
  window.SQSTools.walkLayout = walkLayout;
})();
