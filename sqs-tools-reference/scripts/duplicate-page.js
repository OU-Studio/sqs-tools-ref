/**
 * Duplicate Page — clones the current page's full content into a new,
 * unlinked page (not added to navigation).
 *
 * SAFE BY DESIGN:
 *  - Step 1 (fetchSource) and Step 2 (previewClone) are READ-ONLY / local only.
 *  - Nothing is written to the live site until you explicitly call
 *    SQSDuplicate.commit() after reviewing the preview.
 *
 * Usage (run in console on the page you want to duplicate, e.g. Home):
 *   1. await SQSDuplicate.preview("Home 2")
 *      -> logs what WOULD be created, makes no changes
 *   2. await SQSDuplicate.commit()
 *      -> actually creates the page + writes the cloned content
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

  function getWebsiteId() {
    const ctx = findSquarespaceContext();
    return ctx ? ctx.websiteId : null;
  }

  async function apiCall(path, method, body) {
    const crumb = getCookie('crumb');
    const res = await fetch(`${getUrl()}/api/${path}`, {
      method,
      credentials: 'include',
      headers: {
        accept: 'application/json, text/plain, */*',
        'x-csrf-token': crumb,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await res.text();
    if (!res.ok) {
      console.error(`Request failed (${method} ${path}): ${res.status}`, raw);
      throw new Error(`Request failed (${path}): ${res.status}`);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Non-JSON response for ${path}:`, raw.slice(0, 300));
      throw e;
    }
  }

  function randomId(len) {
    const chars = 'abcdef0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  // Deep-walk a layout tree, replacing every section/block id with a fresh
  // random id of the same length (avoids collisions with the source page).
  function regenerateIds(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(regenerateIds);
      return;
    }
    if (typeof node !== 'object') return;
    if (typeof node.id === 'string' && /^[a-f0-9_]+$/i.test(node.id)) {
      node.id = randomId(node.id.replace(/[^a-f0-9]/gi, '').length || 20);
    }
    Object.values(node).forEach(regenerateIds);
  }

  const state = {
    sourceCollectionId: null,
    sourceRegions: null,
    newTitle: null,
    newUrlId: null,
    websiteId: null,
  };

  async function findHomepageId() {
    const data = await apiCall('commondata/GetCollections', 'GET');
    if (!data || !data.collections) return null;
    const match = Object.values(data.collections).find((c) => c.homepage === true);
    return match ? { id: match.id, websiteId: match.websiteId } : null;
  }

  async function preview(newTitle, collectionIdOverride) {
    let sourceId = collectionIdOverride || getCollectionId();
    let websiteId = getWebsiteId();

    if (!sourceId) {
      console.log('Could not detect collection ID from page context — looking up the homepage via GetCollections...');
      const found = await findHomepageId();
      if (!found) {
        console.error(
          'Could not determine the source page. Either navigate to the actual page (not /config/pages) ' +
          'and re-run, or call SQSDuplicate.preview("Home 2", "<collectionId>") with an explicit ID.'
        );
        return;
      }
      sourceId = found.id;
      websiteId = websiteId || found.websiteId;
      console.log('Found homepage collection:', sourceId);
    }

    if (!websiteId) {
      // last resort: pull it from the collection we just fetched
      const c = await apiCall(`commondata/GetCollection?collectionId=${sourceId}`, 'GET');
      websiteId = c && c.websiteId;
    }
    if (!websiteId) {
      console.error('Could not detect websiteId.');
      return;
    }

    console.log('Fetching source page layout for collection', sourceId);
    const pageData = await apiCall(`pages/by-collection-id/${sourceId}`, 'GET');
    if (!pageData || !pageData.regions) {
      console.error('No regions found on source page — nothing to clone.');
      return;
    }

    // Deep clone, then regenerate all ids so we don't collide with the original
    const clonedRegions = JSON.parse(JSON.stringify(pageData.regions));
    clonedRegions.forEach((region) => regenerateIds(region.sections));

    state.sourceCollectionId = sourceId;
    state.sourceRegions = clonedRegions;
    state.newTitle = newTitle;
    state.newUrlId = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    state.websiteId = websiteId;

    const sectionCount = clonedRegions.reduce((n, r) => n + (r.sections ? r.sections.length : 0), 0);
    console.log(
      `Preview ready: will create a new page titled "${newTitle}" (url: /${state.newUrlId}), ` +
      `NOT added to navigation, with ${sectionCount} section(s) cloned from the current page.`
    );
    console.log('Review the cloned regions below. Nothing has been written yet.');
    console.log(clonedRegions);
    console.log('Call SQSDuplicate.commit() to actually create it.');
  }

  async function commit() {
    if (!state.sourceRegions) {
      console.error('No preview available. Call SQSDuplicate.preview("Title") first.');
      return;
    }

    console.log('Creating new page:', state.newTitle);
    const created = await apiCall('commondata/SaveCollectionSettings', 'POST', {
      collectionData: {
        description: { html: '', raw: false },
        enabled: true,
        deleted: false,
        folder: false,
        regionName: 'default',
        dirty: false,
        body: null,
        collectionType: 10,
        supported: true,
        supportsVideoBackgrounds: false,
        typeName: 'page',
        title: state.newTitle,
        newTitle: state.newTitle,
        ordering: 3,
        icon: 'page',
        addText: 'Add Block',
        navigationTitle: state.newTitle,
        type: 10,
        websiteId: state.websiteId,
      },
      memberAreaData: { memberAreaIds: [] },
    });

    if (!created || !created.id) {
      console.error('Page creation failed or returned no id.', created);
      return;
    }
    const newId = created.id;
    console.log('New page created:', newId, `(/${created.urlId})`);
    console.log('Note: this page is NOT in navigation — find it via the Pages panel "Not Linked" section.');

    // The new page already has its own (empty) default region — we need to
    // target THAT region's id, not the source page's region id.
    console.log('Fetching new page\'s default region structure...');
    const newPageData = await apiCall(`pages/by-collection-id/${newId}`, 'GET');
    if (!newPageData || !newPageData.regions || !newPageData.regions[0]) {
      console.error('Could not read new page\'s default region.', newPageData);
      return;
    }

    const targetRegion = newPageData.regions[0];
    const sourceSections = state.sourceRegions[0] && state.sourceRegions[0].sections;
    if (!sourceSections) {
      console.error('No cloned sections found in preview state.');
      return;
    }

    // Keep the NEW page's own region id/displayName/type/etc — just swap in our cloned sections
    targetRegion.sections = sourceSections;
    targetRegion.ownerId = newId;

    console.log('Writing cloned content to new page...');
    const saveResult = await apiCall(`pages/by-collection-id/${newId}`, 'PUT', {
      regions: [targetRegion],
    });

    console.log('Done. New page content saved:', saveResult);
    console.log(`Go check /${created.urlId} in the Pages panel to verify it looks right.`);

    // reset state so accidental double-commit doesn't duplicate again
    state.sourceRegions = null;
  }

  window.SQSDuplicate = { preview, commit };
  console.log('SQSDuplicate loaded. Run: await SQSDuplicate.preview("Home 2")');
})();
