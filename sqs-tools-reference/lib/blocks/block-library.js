/**
 * Squarespace 7.1 Block Library — reference defaults
 *
 * Captured from a live section containing one instance of every available
 * block type in its default (freshly-added, unedited) state.
 *
 * Each block in a section's layout looks like:
 *   { "id": "<unique-id>", "type": <number>, "value": {...}, "definitionName": "<optional>" }
 *
 * Use BLOCKS["buttonText"].template as a starting point when composing a
 * new section programmatically — spread it, override the fields you need,
 * and always generate a fresh unique "id".
 */

const BLOCKS = {
  text: {
    type: 1337,
    definitionName: 'website.components.html',
    label: 'Text',
    usage: 'often',
    template: {
      engine: 'wysiwyg',
      html: '',
      source: '',
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
    },
  },

  image: {
    type: 5,
    definitionName: null,
    label: 'Image',
    usage: 'often',
    template: {
      linkTo: '', newwindow: false, imageLink: 'none', lightbox: false, lightboxTheme: 'dark',
      combinationAnimation: 'site-default', individualImageAnimation: 'site-default', individualTextAnimation: 'site-default',
      aspectRatio: null, layout: 'caption-below', stretch: false,
      description: { engine: 'wysiwyg', source: '', html: '' },
      title: { engine: 'wysiwyg', source: '', html: '<p style="white-space:pre-wrap;">Make it stand out</p>' },
      subtitle: { engine: 'wysiwyg', source: '', html: '<p style="white-space:pre-wrap;">Whatever it is, the way you tell your story online can make all the difference.</p>' },
      designLayout: 'inline', imagePosition: 'left', imageCropType: 'css_styles', imageMask: 'circle',
      borderRadii: { topLeft: { value: 0, unit: 'px' }, topRight: { value: 0, unit: 'px' }, bottomLeft: { value: 0, unit: 'px' }, bottomRight: { value: 0, unit: 'px' } },
      imageOverlay: { enabled: false, color: { type: 'THEME_COLOR' }, blendMode: 'normal' },
      imageEffect: { type: 'none' },
      containerStyles: { backgroundEnabled: false, stretchedToFill: false },
      floatDir: null, hSize: null,
      // NOTE: does not include an actual imageId — an uploaded/library image asset id must be added to make this render a real photo
    },
  },

  button: {
    type: 1337,
    definitionName: 'website.components.button',
    label: 'Button',
    usage: 'often',
    template: {
      buttonText: 'Learn more', buttonLink: null, buttonAlignment: 'center', buttonSize: 'medium',
      newWindow: false, containerStyles: { stretchedToFill: false },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  spacer: {
    type: 1337,
    definitionName: 'website.components.spacer',
    label: 'Spacer',
    usage: 'often',
    template: { aspectRatio: null, vSize: 1, hSize: null, floatDir: null },
  },

  gallery: {
    type: 8,
    definitionName: null,
    label: 'Gallery',
    usage: 'often',
    template: {
      'aspect-ratio': 'square', aspectRatio: null, 'auto-crop': true, blockAnimation: 'none',
      design: 'grid', lightbox: false, padding: 20,
      'show-meta': true, 'show-meta-basic': true, 'show-meta-only-title': false, 'show-meta-only-description': false,
      'square-thumbs': true, 'thumbnails-per-row': 4, vSize: null, hSize: null, floatDir: null,
      methodOption: 'transient', existingGallery: null, newWindow: false,
      // NOTE: 'transientGalleryId' gets assigned server-side; images are added separately
    },
  },

  video: {
    type: 1337,
    definitionName: 'website.components.video',
    label: 'Video',
    usage: 'periodic',
    template: {
      customThumb: '', description: { html: '' }, height: 0, html: '', nativeVideo: '',
      providerName: '', resolvedBy: '', thumbnailUrl: '', url: '', width: 0,
      settings: { autoPlay: false, controls: 'full', loading: 'auto', loop: false, muted: false },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  form: {
    type: 1337,
    definitionName: 'website.components.form',
    label: 'Form',
    usage: 'periodic',
    template: {
      buttonAlignment: 'left', buttonVariant: 'primary', firstFieldHighlightType: 'none',
      formId: null, // NOTE: server assigns a real formId on save; a placeholder here will likely error
      lightboxHandleText: '', submissionAnimation: 'none', submissionTextAlignment: 'left', submissionVerticalAlignment: 'top',
      useLightbox: false,
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 20 }, topRight: { unit: 'px', value: 20 }, bottomLeft: { unit: 'px', value: 20 }, bottomRight: { unit: 'px', value: 20 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 2 } } },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  accordion: {
    type: 1337,
    definitionName: 'website.components.accordion',
    label: 'Accordion',
    usage: 'periodic',
    template: {
      accordionDescriptionAlignment: 'left', accordionDescriptionFont: 'paragraph-2', accordionDescriptionPlacement: 'left',
      accordionIconPlacement: 'right', accordionIconSize: { unit: 'px', value: 14 }, accordionIconThickness: { unit: 'px', value: 1 }, accordionIconType: 'plus',
      accordionItemPaddingTop: { unit: 'px', value: 30 }, accordionItemPaddingBottom: { unit: 'px', value: 30 }, accordionItemPaddingLeft: { unit: 'px', value: 0 }, accordionItemPaddingRight: { unit: 'px', value: 0 },
      accordionItems: [
        { title: 'Accordion Item 1', description: 'Description text goes here' },
        { title: 'Accordion Item 2', description: 'Description text goes here' },
        { title: 'Accordion Item 3', description: 'Description text goes here' },
      ],
      accordionTitleAlignment: 'left', accordionTitleFont: 'heading-4',
      descriptionPaddingTop: { unit: 'px', value: 0 }, descriptionPaddingBottom: { unit: 'px', value: 30 }, descriptionPaddingLeft: { unit: 'px', value: 0 }, descriptionPaddingRight: { unit: 'px', value: 0 },
      descriptionWidth: { unit: '%', value: 70 },
      dividerBorderThickness: { unit: 'px', value: 1 }, dividerOpacity: 1, isDividerEnabled: true, isFirstDividerVisible: true, isLastDividerVisible: true,
      isExpandedFirstItem: false, shouldAllowMultipleOpenItems: false,
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      hSize: null, floatDir: null,
    },
  },

  scrolling: {
    type: 1337,
    definitionName: 'website.components.scrolling',
    label: 'Scrolling (Marquee)',
    usage: 'periodic',
    template: {
      animationDirection: 'left', animationSpeed: 1, fadeEdges: false,
      itemSpacing: { unit: 'em', value: 0.5 }, linkTo: '', newWindow: false, pausedOnHover: false,
      marqueeItems: [{ text: 'Dream it' }, { text: '〰️' }],
      textSize: { unit: 'rem', value: 1.5 }, textStyle: 'heading-1',
      waveFrequency: 4, waveIntensity: 0,
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 3 }, right: { unit: '%', value: 0 }, bottom: { unit: '%', value: 3 }, left: { unit: '%', value: 0 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      hSize: null, floatDir: null,
    },
  },

  line: {
    type: 1337,
    definitionName: 'website.components.horizontalrule',
    label: 'Line',
    usage: 'periodic',
    template: { hSize: null, floatDir: null },
  },

  product: {
    type: 1337,
    definitionName: 'website.components.product',
    label: 'Product',
    usage: 'rare',
    template: {
      addToCartButtonVariant: 'primary', alignment: 'left', productId: null, productQuickViewEnabled: false,
      showBuyButton: false, showExcerpt: false, showImage: true, showPrice: true, showQuantity: false, showTitle: true,
      imageStyles: { aspectRatio: 'original', focalPoint: { x: 0.5, y: 0.5 }, shape: 'rectangle', borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } } },
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      hSize: null, floatDir: null,
      // NOTE: productId must point at a real product in a commerce collection to render
    },
  },

  pricingPlan: {
    type: 72,
    definitionName: null,
    label: 'Pricing Plan',
    usage: 'legacy',
    template: { showTitle: true, showPrice: true, showDescription: true, showJoinButton: true, showBenefits: true, joinButtonText: 'Sign Up', hSize: null, floatDir: null },
  },

  donation: {
    type: 1337,
    definitionName: 'website.components.donation',
    label: 'Donation',
    usage: 'legacy',
    template: {
      buttonText: 'Donate', disclaimerAlignment: 'center', donateButtonAlignment: 'center', donateButtonVariant: 'primary',
      donationAmountAlignment: 'center', fundDropdownLabel: 'Contribute to', fundIds: [], lightboxButtonText: '', useLightbox: false,
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 20 }, topRight: { unit: 'px', value: 20 }, bottomLeft: { unit: 'px', value: 20 }, bottomRight: { unit: 'px', value: 20 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'solid', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 2 } } },
      hSize: null, floatDir: null,
      // NOTE: fundIds needs at least one real fund UUID to function
    },
  },

  scheduling: {
    type: 1337,
    definitionName: 'website.components.acuity',
    label: 'Scheduling',
    usage: 'legacy',
    template: {
      enableStyleSyncing: true, resetColors: false,
      bodyBackgroundColor: { type: 'THEME_COLOR' }, buttonAccentColor: { type: 'THEME_COLOR' }, buttonTextColor: { type: 'THEME_COLOR' }, headerTextColor: { type: 'THEME_COLOR' }, schedulerBackgroundColor: { type: 'THEME_COLOR' }, schedulerTextColor: { type: 'THEME_COLOR' },
      acuityUrl: '', schedulingPageGroup: 'custom',
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  summary: {
    type: 1337,
    definitionName: 'website.components.summary',
    label: 'Summary',
    usage: 'often',
    template: {
      collectionId: '', collectionType: 24, design: 'autocolumns', autoCrop: true,
      columnWidth: 270, gutter: 60, headerText: '', imageAspectRatio: '1.5', lightbox: false,
      listImageAlignment: 'left', listImageSize: 30, metadataPosition: 'below-content', mixedContent: true,
      pageSize: 3, primaryMetadata: 'none', secondaryMetadata: 'none', productQuickViewEnabled: false,
      showExcerpt: true, showPastOrUpcomingEvents: 'upcoming', showPrice: true, showReadMoreLink: false,
      showThumbnail: true, showTitle: true, slidesPerRow: 3, textAlignment: 'left', textSize: 'medium',
      filter: {}, containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'black', alphaModifier: 1 } }, thickness: { unit: 'px', value: 2 } } },
      hSize: null, floatDir: null,
      // NOTE: collectionId must point at a real collection (blog, gallery, portfolio, etc.) to show items
    },
  },

  newsletter: {
    type: 51,
    definitionName: null,
    label: 'Newsletter',
    usage: 'periodic',
    template: {
      alignment: 'alignCenter', captchaEnabled: true, captchaTheme: 1, captchaAlignment: 2,
      description: { engine: 'wysiwyg', html: '<p>Sign up with your email address to receive news and updates.</p>', source: '<p>Sign up with your email address to receive news and updates.</p>' },
      disclaimer: { engine: 'wysiwyg', html: '<p>We respect your privacy.</p>', source: '<p>We respect your privacy.</p>' },
      formId: null, // NOTE: server-assigned on save
      layout: 'layoutFloat', submitButtonText: 'Sign Up', successRedirect: '', title: 'Subscribe', hasEnabledBackends: true,
      containerStyles: { backgroundEnabled: false, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stretchedToFill: false, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      floatDir: null, hSize: null,
    },
  },

  quote: {
    type: 1337,
    definitionName: 'website.components.quote',
    label: 'Quote',
    usage: 'periodic',
    template: {
      quote: 'Whatever it is, the way you tell your story online can make all the difference.', source: 'Quote Source',
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  audio: {
    type: 1337,
    definitionName: 'website.components.audio',
    label: 'Audio',
    usage: 'legacy',
    template: {
      audioAssetExternalUrl: '', audioAssetId: null, audioAssetLength: '', audioAssetMimeType: '', audioAssetMimeTypeSelector: 'other',
      colorTheme: 'dark', designStyle: 'minimal', fileLocation: 'embedded', showDownload: false, title: '',
      iTunesAuthor: '', iTunesDuration: '', iTunesEpisode: '', iTunesEpisodeNote: { html: '' }, iTunesEpisodeType: 'full', iTunesExplicit: false, iTunesSeason: '', iTunesSubtitle: '', iTunesSummary: '', iTunesTitle: '', podcastingUrlPrefix: '',
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  calendar: {
    type: 26,
    definitionName: null,
    label: 'Calendar',
    usage: 'legacy',
    template: { collectionId: null, hSize: null, floatDir: null },
  },

  map: {
    type: 1337,
    definitionName: 'website.components.map',
    label: 'Map',
    usage: 'periodic',
    template: {
      controls: false, labels: true, style: 2, terrain: false,
      location: { mapLat: 40.7207559, mapLng: -74.0007613, mapZoom: 12 },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      vSize: 12, hSize: null, floatDir: null,
    },
  },

  menu: {
    type: 18,
    definitionName: null,
    label: 'Menu',
    usage: 'legacy',
    template: {
      raw: 'Section Title\n=========\n\nItem Name\n$0.00',
      menus: [{ title: 'Section Title', description: null, sections: [{ title: '', description: null, items: [{ title: 'Item Name', variants: [{ price: '0' }], description: '' }] }] }],
      menuStyle: 'classic', currencySymbol: '$', hSize: null, floatDir: null,
    },
  },

  chart: {
    type: 62,
    definitionName: null,
    label: 'Chart',
    usage: 'legacy',
    template: { dataTableId: null, title: '', legend: 'none', caption: '', palette: 'default', flip: false, chartType: '1009', showLegend: false, hSize: null, floatDir: null },
  },

  code: {
    type: 1337,
    definitionName: 'website.components.code',
    label: 'Code',
    usage: 'often',
    template: {
      html: '<p>Hello, World!</p>',
      wysiwyg: { engine: 'code', isSource: false, mode: 'htmlmixed', source: '' },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  markdown: {
    type: 44,
    definitionName: null,
    label: 'Markdown',
    usage: 'periodic',
    template: { wysiwyg: { source: '', isSource: false, mode: 'markdown', engine: 'source' }, html: '', hSize: null, floatDir: null },
  },

  embed: {
    type: 1337,
    definitionName: 'website.components.embed',
    label: 'Embed',
    usage: 'periodic',
    template: {
      url: '', customThumbEnabled: false, embedBlockType: 'link',
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  socialLinks: {
    type: 1337,
    definitionName: 'website.components.socialLinks',
    label: 'Social Links',
    usage: 'periodic',
    template: {
      accounts: [], iconAlignment: 'center', iconBorderThickness: { unit: 'px', value: 2 }, iconColor: 'black', iconSize: 'small', iconStyle: 'icon-only',
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  searchField: {
    type: 1337,
    definitionName: 'website.components.search',
    label: 'Search Field',
    usage: 'legacy',
    template: {
      collectionFilter: false, collectionId: '', searchPreview: true, theme: 'dark',
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'white', alphaModifier: 1 } }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  pageLink: {
    type: 12,
    definitionName: null,
    label: 'Page Link',
    usage: 'legacy',
    template: { linkTitle: '', linkTarget: '', newWindow: false, collectionId: null, hSize: null, floatDir: null },
  },

  tagCloud: {
    type: 14,
    definitionName: null,
    label: 'Tag Cloud',
    usage: 'legacy',
    template: { collectionIds: [null], type: 'tag', sortby: 'az', count: 5, hSize: null, floatDir: null },
  },

  rss: {
    type: 49,
    definitionName: null,
    label: 'RSS',
    usage: 'legacy',
    template: { collectionId: null, hSize: null, floatDir: null },
  },

  archive: {
    type: 1337,
    definitionName: 'website.components.archive',
    label: 'Archive',
    usage: 'legacy',
    template: {
      authorSortBy: 'firstName', categoryAndTagSortBy: 'name', collectionId: '', collectionType: 1,
      dropdownTitle: 'Archive', groupBy: 'month', layout: 'index', multiColumns: true, orderAscending: false, showCount: false, showDate: true, textAlignment: 'left',
      containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'white', alphaModifier: 1 } }, borderRadii: { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } }, padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } }, stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: { unit: 'px', value: 6 } } },
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  instagram: {
    type: 25,
    definitionName: null,
    label: 'Instagram',
    usage: 'rare',
    template: {
      'aspect-ratio': 'square', aspectRatio: null, 'auto-crop': true, blockAnimation: 'none',
      collectionId: '', design: 'grid', lightbox: false, padding: 20,
      'show-meta': true, 'show-meta-basic': true, 'show-meta-only-title': false, 'show-meta-only-description': false,
      'square-thumbs': true, 'thumbnails-per-row': 4, title: true, thumbnail: true, excerpt: true, pageSize: 10,
      filter: {}, pageCollectionId: null, containingItemId: null, connectedAccountId: '',
      'enable-search': false, socialCollectionId: '', previewCollectionId: '', status: '', searchId: '', searchTerm: '',
      refresh: null, newWindow: false, vSize: null, hSize: null, floatDir: null,
    },
  },

  flickr: {
    type: 45,
    definitionName: null,
    label: 'Flickr',
    usage: 'legacy',
    template: {
      'aspect-ratio': 'square', aspectRatio: null, 'auto-crop': true, blockAnimation: 'none',
      collectionId: '', design: 'grid', lightbox: false, padding: 20,
      'show-meta': true, 'show-meta-basic': true, 'show-meta-only-title': false, 'show-meta-only-description': false,
      'square-thumbs': true, 'thumbnails-per-row': 4, title: true, thumbnail: true, excerpt: true, pageSize: 10,
      filter: {}, connectedAccountId: '', newWindow: false, vSize: null, hSize: null, floatDir: null,
    },
  },

  tock: {
    type: 68,
    definitionName: null,
    label: 'Tock',
    usage: 'legacy',
    template: { tockBusinessSlug: '', tockDisplayMode: 'inline', tockAlignment: 'center', tockColorMode: 'blue', hideTockLogo: true, blockSelectorSource: 'tock-reservations', hSize: null, floatDir: null },
  },

  soundcloud: {
    type: 56,
    definitionName: null,
    label: 'SoundCloud',
    usage: 'legacy',
    template: { aspectRatio: 67, hSize: null, floatDir: null },
  },

  opentable: {
    type: 1337,
    definitionName: 'website.components.openTable',
    label: 'OpenTable',
    usage: 'legacy',
    template: {
      domain: 'com', hideIcons: false, hideTitle: false, lang: 'en', restaurantId: '',
      transforms: { rotation: { z: { value: 0, unit: 'deg' } }, scale: { x: { value: 100, unit: '%' }, y: { value: 100, unit: '%' } }, opacity: { value: 100, unit: '%' }, offset: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } }, origin: { x: { value: 50, unit: '%' }, y: { value: 50, unit: '%' } }, skew: { x: { value: 0, unit: 'deg' }, y: { value: 0, unit: 'deg' } } },
      animations: [], breakpointOverrides: [], hSize: null, floatDir: null,
    },
  },

  zola: {
    type: 1337,
    definitionName: 'website.components.zola',
    label: 'Zola',
    usage: 'legacy',
    template: {
      displaySize: 4, isInset: false, registryKey: '',
      animations: [], breakpointOverrides: [],
      transforms: { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } },
      hSize: null, floatDir: null,
    },
  },

  bandsintown: {
    type: 59,
    definitionName: null,
    label: 'Bandsintown',
    usage: 'legacy',
    template: { artistId: '', timeframe: 'upcoming', startDate: null, endDate: null, hSize: null, floatDir: null },
  },
};

// ---- Row / column layout rules (confirmed from live capture) ----
// A row's columns must have `span` values that sum to exactly 12.
// Valid splits observed: [6,6], [4,4,4], [1,10,1] — any combination summing to 12 works.
// A column holds EITHER `blocks: [...]` OR nested `rows: [...]`, never both.
// The outer section layout is always: { columns: 12, rows: [ { columns: [ {span, blocks|rows} ] } ] }

module.exports = { BLOCKS };

/**
 * Helper: generate a fresh block instance ready to insert into a column's
 * `blocks` array. Always call this rather than reusing a template object
 * directly — every block needs a unique id.
 */
function createBlock(kind, overrides = {}) {
  const def = BLOCKS[kind];
  if (!def) throw new Error(`Unknown block kind: ${kind}`);
  const id = 'blk_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  const block = { id, type: def.type, value: { ...def.template, ...overrides } };
  if (def.definitionName) block.definitionName = def.definitionName;
  return block;
}

module.exports.createBlock = createBlock;
