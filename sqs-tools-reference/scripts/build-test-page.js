/**
 * Build Test Page — creates a new blank page with 4 sections, exercising
 * text/gallery/image blocks and section-level styles together, as a
 * real-world test of the block-library + section-settings reference.
 *
 * Spec (from the working session that requested this):
 *   1. Short + wide section, background image, single H1 centered "WELCOME"
 *   2. Short + wide section, Gallery block (grid, 4 per row)
 *   3. Row split 4/8: span-4 "H2 hello" text, span-8 Image block
 *      (design: card, title "winner", description "chicken dinner")
 *   4. Background image section, backgroundWidth INSET, height MEDIUM
 *
 * DEFAULT ENTRY POINT (fully confirmed working, 2026-08-27):
 *   await SQSBuildTest.preview("Page Title")
 *   await SQSBuildTest.commit()
 * Does everything from one placeholder image: references it once for the
 * background sections + card image, creates a gallery backing collection
 * and adds that same placeholder image into it 12x (matches the original
 * spec's "fill with 12 images any from library or same repeated"), then
 * writes the full 4-section page.
 *
 * PREREQUISITE: upload an image to the media library once, named exactly
 * "template-placeholder.jpg". pickLibraryImage() finds it by filename, not
 * recency — the media-api asset list has no server-side name search, so
 * this filters client-side against the first 200 items. Recency-based
 * picking was fragile (whatever's newest wins, drifts as the library
 * grows) — a fixed known filename is stable regardless of what else gets
 * uploaded.
 *
 * media-api.squarespace.com auth has been flaky in practice — 401
 * "Authentication information missing" from /config/pages and
 * occasionally from a live page too (unresolved, see HANDOVER.md gotcha
 * #8). If preview()/commit() 401s, fall back to one of:
 *   await SQSBuildTest.commitNoImages("Page Title")               // no images at all
 *   await SQSBuildTest.commitWithImage("Page Title", "<imageId>") // known-good imageId, no gallery
 *   await SQSBuildTest.commitWithImage("Page Title", "<imageId>", ["<rawAssetId>", ...]) // + gallery
 *
 * Gallery mechanics (see lib/blocks/gallery-variants.js for the full
 * writeup): a gallery block's images live in their own real backing
 * collection (type: 6, typeName: "gallery-block"), created via
 * createGalleryCollection() and populated via addImagesToGallery() (POST
 * galleries/<id>/images/asset-reference — a DIFFERENT endpoint from the
 * page-content image pipeline, and it wants RAW media library asset ids,
 * not block-ready ones). That collection id then becomes the gallery
 * block's collectionId/transientGalleryId.
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

  function getWebsiteId() {
    const ctx = findSquarespaceContext();
    return ctx ? ctx.websiteId : null;
  }

  // Fallback for when neither the top frame nor any same-origin iframe
  // exposes window.Static.SQUARESPACE_CONTEXT (seen in practice on
  // /config/pages — the site preview apparently isn't a plain same-origin
  // iframe there). GetCollections needs no websiteId itself and every
  // collection it returns carries one, so this works from anywhere on the
  // admin domain regardless of frame structure.
  async function resolveWebsiteId() {
    const fromContext = getWebsiteId();
    if (fromContext) return fromContext;
    console.log('Could not read websiteId from page context — falling back to commondata/GetCollections...');
    const data = await apiCall('commondata/GetCollections', 'GET');
    const first = data && data.collections && Object.values(data.collections)[0];
    if (first && first.websiteId) return first.websiteId;
    return null;
  }

  async function apiCall(path, method, body, extraHeaders) {
    const crumb = getCookie('crumb');
    const res = await fetch(`${getUrl()}/api/${path}`, {
      method,
      credentials: 'include',
      headers: {
        accept: 'application/json, text/plain, */*',
        'x-csrf-token': crumb,
        ...(extraHeaders || {}),
        ...(body && !extraHeaders ? { 'content-type': 'application/json' } : {}),
      },
      body: body || undefined,
    });
    const raw = await res.text();
    if (!res.ok) {
      const headerDump = {};
      res.headers.forEach((v, k) => { headerDump[k] = v; });
      // Log as a JSON STRING, not an object — a collapsed {...} object
      // reference is invisible once console output gets copy-pasted as text.
      console.error(`Request failed (${method} ${path}): ${res.status} ${res.statusText} | ` + JSON.stringify({ body: raw, headers: headerDump }));
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

  async function mediaApiGet(path, websiteId) {
    // media-api.squarespace.com is a different origin from the site itself —
    // its CORS preflight rejects the x-csrf-token header (fine, since this
    // is a read-only GET; CSRF tokens only matter for the mutating calls,
    // which all go to the site's own /api/ origin via apiCall() above).
    const res = await fetch(`https://media-api.squarespace.com/${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        accept: 'application/json, text/plain, */*',
        'x-library-id': websiteId,
      },
    });
    const raw = await res.text();
    if (!res.ok) {
      console.error(`Media API request failed (${path}): ${res.status}`, raw);
      throw new Error(`Media API request failed (${path}): ${res.status}`);
    }
    return raw ? JSON.parse(raw) : null;
  }

  // Every real captured id (section AND block) is plain lowercase hex, no
  // prefix, and EXACTLY 24 characters — a MongoDB ObjectId
  // (e.g. "6a90153cfabcda2cbfcf192b" from a confirmed-working live capture
  // of a real section-add). A "blk_..." prefixed id caused an empty-body
  // 400; a 20-char hex id (this function's old default) likely did too —
  // ObjectId validation server-side, silently rejected with no error body.
  function randomId(len = 24) {
    const chars = 'abcdef0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function heading(tag, text, { align = 'left' } = {}) {
    const alignStyle = align === 'center' ? 'text-align: center; ' : align === 'right' ? 'text-align: right; ' : '';
    return `<${tag} style="${alignStyle}white-space:pre-wrap;" data-rte-preserve-empty="true">${text}</${tag}>`;
  }

  function textBlockValue(html) {
    return {
      engine: 'wysiwyg',
      html,
      source: html,
      textAttributes: [],
      containerStyles: {
        backgroundEnabled: false,
        backgroundColor: { type: 'THEME_COLOR' },
        borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } },
        padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } },
        stretchedToFill: false,
        stroke: { style: 'none', color: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'black', alphaModifier: 1 } }, thickness: { unit: 'px', value: 2 } },
        blendMode: 'normal',
        blur: { enabled: false, filterType: 'backdrop', blurRadius: { unit: 'px', value: 15 } },
      },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    };
  }

  function textBlock(html) {
    return { id: randomId(), type: 1337, definitionName: 'website.components.html', value: textBlockValue(html) };
  }

  // collectionId, if supplied, is the real gallery-block collection created
  // via createGalleryCollection() below and populated via
  // addImagesToGallery() — leave undefined for an empty gallery block.
  function galleryBlock({ collectionId } = {}) {
    return {
      id: randomId(),
      type: 8,
      value: {
        'aspect-ratio': 'standard', aspectRatio: null, 'auto-crop': true, blockAnimation: 'none',
        collectionId: collectionId || null,
        design: 'grid', lightbox: false, padding: 20,
        'show-meta': true, 'show-meta-basic': true, 'show-meta-only-title': false, 'show-meta-only-description': false,
        'square-thumbs': true, 'thumbnails-per-row': 4, vSize: null, hSize: null, floatDir: null,
        methodOption: 'transient', existingGallery: null, newWindow: false,
        transientGalleryId: collectionId || null,
      },
    };
  }

  // ---- Gallery image population, confirmed via live capture ----
  // 1. Create a real collection to back the gallery block (type: 6,
  //    typeName: "gallery-block") — same no-`id` SaveCollectionSettings
  //    create trick as blog collections. Its id becomes the gallery
  //    block's collectionId/transientGalleryId.
  async function createGalleryCollection(websiteId, title) {
    const suffix = randomId(20);
    const created = await apiCall('commondata/SaveCollectionSettings', 'POST', JSON.stringify({
      collectionData: {
        navigationTitle: title || `Gallery Block ${suffix}`,
        description: { html: '', source: '' },
        enabled: true, deleted: false, folder: false,
        itemCount: 0, isEmpty: true,
        typeName: 'gallery-block', type: 6,
        itemLimit: 20, ordering: 1, nextDisplayIndex: 0,
        regionName: 'default',
        title: title || `Gallery Block ${suffix}`,
        urlId: suffix.slice(0, 20),
        pagePermissionType: null, calculatedItemCount: 0,
        websiteId,
      },
      memberAreaData: { memberAreaIds: [] },
    }));
    if (!created || !created.id) throw new Error('Gallery collection creation failed or returned no id.');
    return created.id;
  }

  // 2. Add each image (by its RAW media library asset id — NOT the
  //    block-ready id from uploads/images/asset-reference, a different id
  //    space) into that gallery collection. Different endpoint from the
  //    page-content image pipeline: galleries/<id>/images/asset-reference,
  //    not uploads/images/asset-reference.
  async function addImageToGallery(galleryCollectionId, assetId, websiteId) {
    const body = new URLSearchParams({ assetId, libraryId: websiteId, recordType: '2', collectionId: galleryCollectionId }).toString();
    const result = await apiCall(`galleries/${galleryCollectionId}/images/asset-reference`, 'POST', body, {
      'content-type': 'application/x-www-form-urlencoded',
    });
    const media = result && result.media && result.media[0];
    if (!media || !media.id) throw new Error('Gallery asset-reference did not return a usable media record.');
    return media;
  }

  async function addImagesToGallery(galleryCollectionId, assetIds, websiteId) {
    const results = [];
    for (const assetId of assetIds) {
      console.log(`Adding image ${assetId} to gallery ${galleryCollectionId}...`);
      results.push(await addImageToGallery(galleryCollectionId, assetId, websiteId));
    }
    return results;
  }

  const captionField = (text) => ({
    engine: 'wysiwyg', source: '',
    html: `<p class="" style="white-space:pre-wrap;">${text}</p>`,
  });

  function imageBlock({ imageId, designLayout = 'inline', title = '', subtitle = '', description = '' }) {
    return {
      id: randomId(),
      type: 5,
      value: {
        imageId,
        linkTo: '', newwindow: false, imageLink: 'none', buttonText: '',
        lightbox: false, lightboxTheme: 'dark',
        combinationAnimation: 'site-default', individualImageAnimation: 'site-default', individualTextAnimation: 'site-default',
        aspectRatio: null, layout: 'caption-below', stretch: false,
        description: captionField(description),
        title: captionField(title),
        subtitle: captionField(subtitle),
        designLayout, imagePosition: 'left',
        mapping: null, imageCropType: 'css_styles', imageMask: 'circle',
        borderRadii: { topLeft: { value: 0, unit: 'px' }, topRight: { value: 0, unit: 'px' }, bottomLeft: { value: 0, unit: 'px' }, bottomRight: { value: 0, unit: 'px' } },
        imageOverlay: { enabled: false, color: { type: 'THEME_COLOR' }, blendMode: 'normal' },
        imageEffect: { type: 'none' },
        floatDir: null, hSize: null,
        containerStyles: { backgroundEnabled: false, stretchedToFill: false },
      },
    };
  }

  function sectionStyles({
    sectionHeight = 'section-height--medium',
    contentWidth = 'content-width--wide',
    backgroundWidth = 'background-width--full-bleed',
    horizontalAlignment = 'horizontal-alignment--center',
    verticalAlignment = 'vertical-alignment--middle',
    backgroundMode = 'image',
    imageOverlayOpacity = 0.15,
  } = {}) {
    return {
      backgroundWidth, imageOverlayOpacity, sectionHeight, customSectionHeight: 10,
      horizontalAlignment, verticalAlignment, contentWidth, customContentWidth: 50,
      sectionTheme: '', sectionAnimation: 'none', backgroundMode,
    };
  }

  function makeSection({ id, styles, backgroundImageId, rows }) {
    // Shape matches a REAL freshly-created blank section, confirmed via a
    // live capture of catalog-preview/blankLayoutEngineSection +
    // content/add/layoutEngineSection (the actual editor "add section" flow).
    // That capture has NO regionId, parentSectionId, backgroundMediaEffect,
    // or divider — a previous fix guessed those were required (based on
    // seeing them on already-SAVED page sections) and that guess is now
    // directly contradicted by this real data. video is just {zoom: 0} too,
    // not the 4-field object used elsewhere in this repo.
    const section = {
      sectionName: 'LAYOUT_ENGINE',
      id,
      isCloneable: false,
      video: { zoom: 0 },
      styles,
      sourceType: 'blank',
      createdOn: Date.now(),
      content: { raw: false, layout: { columns: 12, rows } },
    };
    if (backgroundImageId) section.backgroundImageId = backgroundImageId;
    return section;
  }

  const state = { imageId: null, websiteId: null, sections: null, title: null };

  // ---- Step 1 (read-only): find a known placeholder image by filename ----
  // The media-api asset list has no server-side name-search param (only
  // order/assetTypes/assetSources/limit/offset) — filtering is client-side
  // against a fetched page. Picking "most recent" is fragile (whatever was
  // uploaded last wins, which drifts as the library grows); filtering by a
  // fixed known filename is stable regardless of what else gets uploaded.
  //
  // PREREQUISITE: upload an image to the media library once, named exactly
  // "template-placeholder.jpg" (or pass a different name below) — this
  // script then always finds that same asset regardless of upload order.
  //
  // Real response shape (corrected from an initial guess): assets are under
  // data.assets.assetRecords (data.assets is an object with pagination info
  // — previous/next/total/searchId — not directly an array), and each
  // record's filename is at stringMetaData.fileName, not a top-level field.
  async function pickLibraryImage(websiteId, filename = 'template-placeholder.jpg') {
    const data = await mediaApiGet(
      `user/libraries/${websiteId}/folders/root/assets?order=DESC&orderBy=CREATED_AT&assetTypes=IMAGE&assetSources=UPLOAD,FLICKR,SMUGMUG,DROPBOX,FIVEHUNDREDPX,REHOST,SQUARESPACE_APP,SQUARESPACE_APP_BULK,AI,AI_GENERATED,AI_SECTION_BG&limit=200&offset=0`,
      websiteId
    );
    const records = (data && data.assets && data.assets.assetRecords) || [];
    const match = records.find((a) => a.stringMetaData && a.stringMetaData.fileName === filename);
    if (match) return match;
    if (!records.length) throw new Error('No images found in the media library — upload one first.');
    throw new Error(
      `No asset named "${filename}" found in the first ${records.length} library items ` +
      `(library has ${data.assets.total} total). Upload an image with that exact filename, ` +
      `or call pickLibraryImage(websiteId, "<actual filename>") with the right name.`
    );
  }

  // ---- Step 2 (write, commit-only): turn a library asset into a block-ready imageId ----
  async function referenceImage(assetId, websiteId) {
    const body = new URLSearchParams({ assetId, libraryId: websiteId, recordType: '2' }).toString();
    const result = await apiCall('uploads/images/asset-reference', 'POST', body, {
      'content-type': 'application/x-www-form-urlencoded',
    });
    const media = result && result.media && result.media[0];
    if (!media || !media.id) throw new Error('asset-reference did not return a usable imageId.');
    return media.id;
  }

  function buildSections(imageId, galleryCollectionId) {
    return [
      // Section 1 — short + wide, background image, centered H1
      makeSection({
        id: randomId(),
        styles: sectionStyles({ sectionHeight: 'section-height--small', contentWidth: 'content-width--wide', backgroundMode: 'image' }),
        backgroundImageId: imageId,
        rows: [{ columns: [{ span: 12, blocks: [textBlock(heading('h1', 'WELCOME', { align: 'center' }))] }] }],
      }),

      // Section 2 — short + wide, Gallery block (grid, 4/row, 3:2 cropped).
      // Populated when galleryCollectionId is supplied (see
      // createGalleryCollection() + addImagesToGallery()) — otherwise empty.
      makeSection({
        id: randomId(),
        styles: sectionStyles({ sectionHeight: 'section-height--small', contentWidth: 'content-width--wide', backgroundMode: 'image' }),
        rows: [{ columns: [{ span: 12, blocks: [galleryBlock({ collectionId: galleryCollectionId })] }] }],
      }),

      // Section 3 — row split 4/8: H2 text + card image
      makeSection({
        id: randomId(),
        styles: sectionStyles(),
        rows: [{
          columns: [
            { span: 4, blocks: [textBlock(heading('h2', 'hello'))] },
            { span: 8, blocks: [imageBlock({ imageId, designLayout: 'card', title: 'winner', subtitle: 'chicken dinner' })] },
          ],
        }],
      }),

      // Section 4 — background image, inset width, medium height
      makeSection({
        id: randomId(),
        styles: sectionStyles({ sectionHeight: 'section-height--medium', backgroundWidth: 'background-width--inset', backgroundMode: 'image' }),
        backgroundImageId: imageId,
        rows: [{ columns: [{ span: 12, blocks: [] }] }],
      }),
    ];
  }

  async function preview(title, placeholderFilename) {
    if (!title) {
      console.error('Usage: await SQSBuildTest.preview("Page Title"[, "template-placeholder.jpg"])');
      return;
    }
    const websiteId = await resolveWebsiteId();
    if (!websiteId) {
      console.error('Could not detect websiteId — run this from a Squarespace admin page.');
      return;
    }

    console.log('Looking up the placeholder image from the media library (read-only)...');
    const asset = await pickLibraryImage(websiteId, placeholderFilename);
    console.log('Candidate image:', (asset.stringMetaData && asset.stringMetaData.fileName) || asset.id, asset);

    const sections = buildSections('<imageId will be assigned at commit>');
    state.title = title;
    state.websiteId = websiteId;
    state.candidateAssetId = asset.id;
    state.sections = sections;

    console.log(
      `Preview ready: will create page "${title}" with ${sections.length} sections. ` +
      'The placeholder image above will be referenced (write) once and reused for the ' +
      'background sections + card image, and added 12x into the gallery block, at commit time.'
    );
    console.log('Section/block tree (imageId placeholder shown, real id assigned at commit):', sections);
    console.log('Call SQSBuildTest.commit() to actually create it.');
  }

  async function commit() {
    if (!state.sections || !state.candidateAssetId) {
      console.error('No preview available. Call SQSBuildTest.preview("Title") first.');
      return;
    }

    console.log('Referencing placeholder image into site content (write, once)...');
    const imageId = await referenceImage(state.candidateAssetId, state.websiteId);
    console.log('Got block-ready imageId:', imageId);

    console.log('Creating gallery collection...');
    const galleryCollectionId = await createGalleryCollection(state.websiteId, `${state.title} Gallery`);
    console.log('Gallery collection created:', galleryCollectionId);
    // Same placeholder asset repeated 12x — matches the original spec
    // ("fill with 12 images any from library or same repeated").
    await addImagesToGallery(galleryCollectionId, new Array(12).fill(state.candidateAssetId), state.websiteId);
    console.log('Added 12 placeholder images to gallery.');

    const sections = buildSections(imageId, galleryCollectionId);

    console.log('Creating new blank page:', state.title);
    const created = await apiCall('commondata/SaveCollectionSettings', 'POST', JSON.stringify({
      collectionData: {
        description: { html: '', raw: false },
        enabled: true, deleted: false, folder: false, regionName: 'default', dirty: false, body: null,
        collectionType: 10, supported: true, supportsVideoBackgrounds: false, typeName: 'page',
        title: state.title, newTitle: state.title, ordering: 3, icon: 'page', addText: 'Add Block',
        navigationTitle: state.title, type: 10, websiteId: state.websiteId,
      },
      memberAreaData: { memberAreaIds: [] },
    }));

    if (!created || !created.id) {
      console.error('Page creation failed or returned no id.', created);
      return;
    }
    const newId = created.id;
    console.log('New page created:', newId, `(/${created.urlId})`);
    console.log('Note: this page is NOT in navigation — find it via the Pages panel "Not Linked" section.');

    console.log('Fetching new page\'s default region structure...');
    const newPageData = await apiCall(`pages/by-collection-id/${newId}`, 'GET');
    if (!newPageData || !newPageData.regions || !newPageData.regions[0]) {
      console.error('Could not read new page\'s default region.', newPageData);
      return;
    }

    const targetRegion = newPageData.regions[0];
    targetRegion.sections = sections;
    targetRegion.ownerId = newId;

    console.log('Writing section content to new page...');
    const saveResult = await apiCall(`pages/by-collection-id/${newId}`, 'PUT', JSON.stringify({ regions: [targetRegion] }));

    console.log('Done. New page content saved:', saveResult);
    console.log(`Go check /${created.urlId} in the Pages panel to verify it looks right.`);

    state.sections = null;
    state.candidateAssetId = null;
  }

  // ---- No-images path: media-api auth has proven unreliable to reproduce
  // headlessly (401 "Authentication information missing" even from a live
  // page). This drops every image dependency — no background images, no
  // Image block — so we can validate the section/block write mechanism
  // (the actual thing under test) independent of the image pipeline.
  // Usage: await SQSBuildTest.commitNoImages("Block Test")
  function buildSectionsNoImages() {
    return [
      // Section 1 — short + wide, no background image, centered H1
      makeSection({
        id: randomId(),
        styles: sectionStyles({ sectionHeight: 'section-height--small', contentWidth: 'content-width--wide' }),
        rows: [{ columns: [{ span: 12, blocks: [textBlock(heading('h1', 'WELCOME', { align: 'center' }))] }] }],
      }),

      // Section 2 — short + wide, Gallery block (grid, 4/row — block default, no images populated)
      makeSection({
        id: randomId(),
        styles: sectionStyles({ sectionHeight: 'section-height--small', contentWidth: 'content-width--wide' }),
        rows: [{ columns: [{ span: 12, blocks: [galleryBlock()] }] }],
      }),

      // Section 3 — row split 4/8: H2 text + a second text block standing in for the image
      makeSection({
        id: randomId(),
        styles: sectionStyles(),
        rows: [{
          columns: [
            { span: 4, blocks: [textBlock(heading('h2', 'hello'))] },
            { span: 8, blocks: [textBlock(heading('h2', 'winner — chicken dinner'))] },
          ],
        }],
      }),

      // Section 4 — no background image, inset width, medium height, dark theme instead
      makeSection({
        id: randomId(),
        styles: sectionStyles({ sectionHeight: 'section-height--medium', backgroundWidth: 'background-width--inset' }),
        rows: [{ columns: [{ span: 12, blocks: [] }] }],
      }),
    ];
  }

  async function commitNoImages(title) {
    if (!title) {
      console.error('Usage: await SQSBuildTest.commitNoImages("Page Title")');
      return;
    }
    const websiteId = await resolveWebsiteId();
    if (!websiteId) {
      console.error('Could not detect websiteId.');
      return;
    }

    const sections = buildSectionsNoImages();

    console.log('Creating new blank page:', title);
    const created = await apiCall('commondata/SaveCollectionSettings', 'POST', JSON.stringify({
      collectionData: {
        description: { html: '', raw: false },
        enabled: true, deleted: false, folder: false, regionName: 'default', dirty: false, body: null,
        collectionType: 10, supported: true, supportsVideoBackgrounds: false, typeName: 'page',
        title, newTitle: title, ordering: 3, icon: 'page', addText: 'Add Block',
        navigationTitle: title, type: 10, websiteId,
      },
      memberAreaData: { memberAreaIds: [] },
    }));

    if (!created || !created.id) {
      console.error('Page creation failed or returned no id.', created);
      return;
    }
    const newId = created.id;
    console.log('New page created:', newId, `(/${created.urlId})`);
    console.log('Note: this page is NOT in navigation — find it via the Pages panel "Not Linked" section.');

    const result = await debugWriteSections(newId, sections);
    console.log('Done. New page content saved:', result);
    console.log(`Go check /${created.urlId} in the Pages panel to verify it looks right.`);
    return { pageId: newId, urlId: created.urlId };
  }

  // ---- Manual path: skip media-library lookup + asset-reference entirely,
  // using an imageId already known-good from a prior successful commit.
  // The media-api lookup needs some editor-session auth state that a plain
  // page load doesn't reliably have (401 "Authentication information
  // missing" even from a live page in practice) — this routes around it.
  // Usage: await SQSBuildTest.commitWithImage("Block Test", "6a900d5c071d124f895561b5")
  // galleryAssetIds (optional): RAW media library asset ids (the .id field
  // from pickLibraryImage()/mediaApiGet() results — NOT the block-ready id
  // that comes back from uploads/images/asset-reference, a different id
  // space) to populate the gallery block with. Omit for an empty gallery.
  async function commitWithImage(title, imageId, galleryAssetIds) {
    if (!title || !imageId) {
      console.error('Usage: await SQSBuildTest.commitWithImage("Page Title", "<known-good imageId>"[, ["<raw asset id>", ...]])');
      return;
    }
    const websiteId = await resolveWebsiteId();
    if (!websiteId) {
      console.error('Could not detect websiteId.');
      return;
    }

    let galleryCollectionId;
    if (galleryAssetIds && galleryAssetIds.length) {
      console.log('Creating gallery collection...');
      galleryCollectionId = await createGalleryCollection(websiteId, `${title} Gallery`);
      console.log('Gallery collection created:', galleryCollectionId);
      await addImagesToGallery(galleryCollectionId, galleryAssetIds, websiteId);
      console.log(`Added ${galleryAssetIds.length} image(s) to gallery.`);
    }

    const sections = buildSections(imageId, galleryCollectionId);

    console.log('Creating new blank page:', title);
    const created = await apiCall('commondata/SaveCollectionSettings', 'POST', JSON.stringify({
      collectionData: {
        description: { html: '', raw: false },
        enabled: true, deleted: false, folder: false, regionName: 'default', dirty: false, body: null,
        collectionType: 10, supported: true, supportsVideoBackgrounds: false, typeName: 'page',
        title, newTitle: title, ordering: 3, icon: 'page', addText: 'Add Block',
        navigationTitle: title, type: 10, websiteId,
      },
      memberAreaData: { memberAreaIds: [] },
    }));

    if (!created || !created.id) {
      console.error('Page creation failed or returned no id.', created);
      return;
    }
    const newId = created.id;
    console.log('New page created:', newId, `(/${created.urlId})`);
    console.log('Note: this page is NOT in navigation — find it via the Pages panel "Not Linked" section.');

    const result = await debugWriteSections(newId, sections);
    console.log('Done. New page content saved:', result);
    console.log(`Go check /${created.urlId} in the Pages panel to verify it looks right.`);
    if (!galleryCollectionId) {
      console.log('Reminder: gallery left empty — pass galleryAssetIds to populate it.');
    }
    return { pageId: newId, urlId: created.urlId, galleryCollectionId };
  }

  // ---- Debug helper: write an arbitrary subset of sections to an existing
  // (already-created) page, for bisecting which section/field is causing a
  // 400. Usage:
  //   const sections = SQSBuildTest.buildSections('<real imageId>');
  //   await SQSBuildTest.debugWriteSections('<pageId>', [sections[3]]); // just section 4
  async function debugWriteSections(pageId, sectionsSubset) {
    const newPageData = await apiCall(`pages/by-collection-id/${pageId}`, 'GET');
    const region = newPageData.regions[0];
    sectionsSubset.forEach((s) => { s.regionId = region.id; });
    region.sections = sectionsSubset;
    region.ownerId = pageId;
    console.log(`Writing ${sectionsSubset.length} section(s) to page ${pageId}...`);
    const result = await apiCall(`pages/by-collection-id/${pageId}`, 'PUT', JSON.stringify({ regions: [region] }));
    console.log('Success:', result);
    return result;
  }

  window.SQSBuildTest = {
    preview, commit, commitWithImage, commitNoImages,
    createGalleryCollection, addImageToGallery, addImagesToGallery,
    // exposed for bisection debugging — see debugWriteSections comment above
    buildSections, debugWriteSections, apiCall, makeSection, textBlock, galleryBlock, imageBlock, sectionStyles, randomId,
    resolveWebsiteId, pickLibraryImage,
  };
  console.log('SQSBuildTest loaded. Run: await SQSBuildTest.preview("Block Test")');
})();
