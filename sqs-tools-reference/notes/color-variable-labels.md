# Colors — `variableName` → UI label reference

Confirmed via live DOM capture of the per-theme color editor (Site
Styles → Colors → edit one of the 10 named themes). Every `variableName`
in a `website-colors` theme's `mappings` array (see
[site-styles.md](site-styles.md)) has a human-readable label and a
category grouping in the editor UI — this is that full taxonomy, ~313
variables across 62 categories, captured from one theme (the mapping is
identical across all 10 themes; only the assigned colors differ).

Categories roughly follow: sitewide chrome (Header, Sitewide, Text,
Links, Button, Toggle, Menu Overlay, Announcement Bar) first, then one
category per collection-list layout variant (Blog: *, Portfolio Grid: *,
Portfolio Hover: *, Video, Events, Product *, Course *), then one
category per content block type that has color options (Accordion,
Image Block: *, Form *, Newsletter, Summary, Social Links, Scrolling,
Line, Content Link, Menu, Quote, Shape, Donation, Stack, Scheduling).

Not yet captured: the UI's theme display-name scheme. The Colors panel
screenshot showed 10 themes named "Lightest 1/2", "Light 1/2", "Bright
1/2", "Dark 1/2", "Darkest 1/2" (grouped as 3 "on this page" + 7
"other"), which does NOT match the API's `colorThemes[].themeName` enum
(`white`, `white-bold`, `light`, `light-bold`, `dark`, `dark-bold`,
`black`, `black-bold`, `bright`, `bright-inverse`). Working hypothesis
(unconfirmed — needs one write-capture per theme to verify): "1" = base,
"2" = "-bold" variant, i.e. white↔Lightest 1, white-bold↔Lightest 2,
light↔Light 1, light-bold↔Light 2, dark↔Dark 1, dark-bold↔Dark 2,
black↔Darkest 1, black-bold↔Darkest 2, bright↔Bright 1,
bright-inverse↔Bright 2.

### Header
- Site Title — `siteTitleColor`
- Navigation Links — `navigationLinkColor`

### Sitewide
- Section Background — `siteBackgroundColor`
- Background Overlay — `backgroundOverlayColor`
- Inset Border — `section-inset-border-color`
- Section Divider Stroke — `section-divider-stroke-color`

### Text
- Heading (Extra Large) — `headingExtraLargeColor`
- Heading (Large) — `headingLargeColor`
- Heading (Medium) — `headingMediumColor`
- Heading (Small) — `headingSmallColor`
- Paragraph (Large) — `paragraphLargeColor`
- Paragraph (Medium) — `paragraphMediumColor`
- Paragraph (Small) — `paragraphSmallColor`
- Text Highlight — `text-highlight-color`
- Background Color — `tweak-text-block-background-color`
- Stroke Color — `tweak-text-block-stroke-color`
- Heading (Extra Large) on Background — `tweak-heading-extra-large-color-on-background`
- Heading (Large) on Background — `tweak-heading-large-color-on-background`
- Heading (Medium) on Background — `tweak-heading-medium-color-on-background`
- Heading (Small) on Background — `tweak-heading-small-color-on-background`
- Paragraph (Large) on Background — `tweak-paragraph-large-color-on-background`
- Paragraph (Medium) on Background — `tweak-paragraph-medium-color-on-background`
- Paragraph (Small) on Background — `tweak-paragraph-small-color-on-background`
- Text Highlight on Background — `text-highlight-color-on-background`

### Links
- Text Links on Background — `tweak-paragraph-link-color-on-background`
- Heading Links — `headingLinkColor`
- Text Links — `paragraphLinkColor`

### Button
- Primary Button Background — `primaryButtonBackgroundColor`
- Primary Button Text — `primaryButtonTextColor`
- Secondary Button Background — `secondaryButtonBackgroundColor`
- Secondary Button Text — `secondaryButtonTextColor`
- Tertiary Button Background — `tertiaryButtonBackgroundColor`
- Tertiary Button Text — `tertiaryButtonTextColor`

### Toggle
- Toggle Color - On — `toggle-on-color`
- Toggle Color - Off — `toggle-off-color`

### Menu Overlay
- Background — `menuOverlayBackgroundColor`
- Link Color — `menuOverlayNavigationLinkColor`
- Button Background — `menuOverlayButtonBackgroundColor`
- Button Text — `menuOverlayButtonTextColor`

### Announcement Bar
- Background — `announcement-bar-background-color`
- Text — `announcement-bar-text-color`

### Galleries
- Icon — `tweak-gallery-icon-color`
- Icon Background — `tweak-gallery-icon-background-color`
- Lightbox Background — `tweak-gallery-lightbox-background-color`
- Lightbox Icon — `tweak-gallery-lightbox-icon-color`

### List Section
- Section Title — `list-section-title-color`

### List Section: Simple
- Title — `list-section-simple-title-color`
- Description — `list-section-simple-description-color`
- Button Text — `list-section-simple-button-text-color`
- Button Background — `list-section-simple-button-background-color`
- Card Background — `list-section-simple-card-color`
- Card Title — `list-section-simple-card-title-color`
- Card Description — `list-section-simple-card-description-color`
- Card Description Link — `list-section-simple-card-description-link-color`
- Card Button Text — `list-section-simple-card-button-text-color`
- Card Button Background — `list-section-simple-card-button-background-color`

### List Section: Carousel
- Title — `list-section-carousel-title-color`
- Description — `list-section-carousel-description-color`
- Button Text — `list-section-carousel-button-text-color`
- Button Background — `list-section-carousel-button-background-color`
- Arrow — `list-section-carousel-arrow-color`
- Arrow Background — `list-section-carousel-arrow-background-color`
- Card — `list-section-carousel-card-color`
- Card Title — `list-section-carousel-card-title-color`
- Card Description — `list-section-carousel-card-description-color`
- Card Description Link — `list-section-carousel-card-description-link-color`
- Card Button Text — `list-section-carousel-card-button-text-color`
- Card Button Background — `list-section-carousel-card-button-background-color`

### List Section: Banner Slideshow
- Title — `list-section-banner-slideshow-title-color`
- Description — `list-section-banner-slideshow-description-color`
- Button Text — `list-section-banner-slideshow-button-text-color`
- Button Background — `list-section-banner-slideshow-button-background-color`
- Arrow — `list-section-banner-slideshow-arrow-color`
- Arrow Background — `list-section-banner-slideshow-arrow-background-color`
- Card — `list-section-banner-slideshow-card-color`
- Card Title — `list-section-banner-slideshow-card-title-color`
- Card Description — `list-section-banner-slideshow-card-description-color`
- Card Description Link — `list-section-banner-slideshow-card-description-link-color`
- Card Button Text — `list-section-banner-slideshow-card-button-text-color`
- Card Button Background — `list-section-banner-slideshow-card-button-background-color`

### Videos: Basic Grid
- Video Title — `video-grid-basic-title-color`
- Video Meta — `video-grid-basic-meta-color`
- Video Description — `video-grid-basic-description-color`
- Video Category Nav — `video-grid-category-nav-color`

### Video: Item
- Video Detail Title — `tweak-video-item-title-color`
- Video Detail Meta — `tweak-video-item-meta-color`
- Video Detail Description — `tweak-video-item-description-color`
- Video Detail Pagination Title — `tweak-video-item-pagination-title-color`
- Video Detail Pagination Icon — `tweak-video-item-pagination-icon-color`

### Portfolio Grid: Overlay
- Image Overlay (Hover) — `portfolio-grid-overlay-overlay-color`
- Project Title — `portfolio-grid-overlay-title-color`

### Portfolio Grid: Simple
- Project Title — `portfolio-grid-basic-title-color`

### Portfolio Hover: Background
- Project Title — `portfolio-index-background-title-color`

### Portfolio Hover: Follow Cursor
- Project Title — `portfolio-hover-follow-title-color`

### Portfolio Hover: Fixed
- Project Title — `portfolio-hover-static-title-color`

### Portfolio: Item
- Project Pagination Title — `tweak-portfolio-item-pagination-title-color`
- Project Pagination Meta — `tweak-portfolio-item-pagination-meta-color`
- Project Pagination Icon — `tweak-portfolio-item-pagination-icon-color`

### Blog: Alternating
- Post Title — `tweak-blog-alternating-side-by-side-list-title-color`
- Post Meta — `tweak-blog-alternating-side-by-side-list-meta-color`
- Post Excerpt — `tweak-blog-alternating-side-by-side-list-excerpt-color`
- Read More Link — `tweak-blog-alternating-side-by-side-list-read-more-color`

### Blog: Grid
- Post Title — `tweak-blog-basic-grid-list-title-color`
- Post Meta — `tweak-blog-basic-grid-list-meta-color`
- Post Excerpt — `tweak-blog-basic-grid-list-excerpt-color`
- Read More Link — `tweak-blog-basic-grid-list-read-more-color`

### Blog: Masonry
- Post Title — `tweak-blog-masonry-list-title-color`
- Post Meta — `tweak-blog-masonry-list-meta-color`
- Post Excerpt — `tweak-blog-masonry-list-excerpt-color`
- Read More Link — `tweak-blog-masonry-list-read-more-color`

### Blog: Side by Side
- Post Title — `tweak-blog-side-by-side-list-title-color`
- Post Meta — `tweak-blog-side-by-side-list-meta-color`
- Post Excerpt — `tweak-blog-side-by-side-list-excerpt-color`
- Read More Link — `tweak-blog-side-by-side-list-read-more-color`

### Blog: Single Column
- Post Title — `tweak-blog-single-column-list-title-color`
- Post Meta — `tweak-blog-single-column-list-meta-color`
- Post Excerpt — `tweak-blog-single-column-list-excerpt-color`
- Read More Link — `tweak-blog-single-column-list-read-more-color`

### Blog Post
- Post Title — `tweak-blog-item-title-color`
- Post Meta — `tweak-blog-item-meta-color`
- Post Pagination Title — `tweak-blog-item-pagination-title-color`
- Post Pagination Meta — `tweak-blog-item-pagination-meta-color`
- Post Pagination Icon — `tweak-blog-item-pagination-icon-color`
- Post Author Profile — `tweak-blog-item-author-profile-color`
- Post Comment Meta — `tweak-blog-item-comment-meta-color`
- Post Comment Text — `tweak-blog-item-comment-text-color`

### Product List Page
- Title — `tweak-product-grid-text-below-list-title-color`
- Price — `tweak-product-grid-text-below-list-price-color`
- Sale Price — `tweak-product-grid-text-below-list-sale-price-color`
- Status — `tweak-product-grid-text-below-list-status-color`
- Category Nav — `tweak-product-grid-text-below-list-category-nav-color`
- Pagination — `tweak-product-grid-text-below-list-pagination-color`
- Limited Availability Alert — `tweak-product-grid-text-below-list-scarcity-color`
- Product Description — `tweak-product-list-description-text-color`
- Filters Drawer Background Color — `product-list-filters-drawer-background-color`
- Filters Drawer Text Color — `product-list-filters-drawer-text-color`

### Product Detail Page
- Title — `tweak-product-basic-item-title-color`
- Price — `tweak-product-basic-item-price-color`
- Sale Price — `tweak-product-basic-item-sale-price-color`
- Description — `tweak-product-basic-item-description-color`
- Restock Notification CTA — `product-basic-item-restock-notification-color`
- Add Ons Title — `product-basic-item-add-ons-title-color`
- Breadcrumb Nav — `tweak-product-basic-item-breadcumb-nav-color`
- Limited Availability Alert — `tweak-product-basic-item-scarcity-color`
- Gallery Icons — `tweak-product-basic-item-gallery-controls-color`
- Discount Chip Background — `product-basic-item-discount-chip-background-color`
- Discount Chip Text — `product-basic-item-discount-chip-text-color`

### Product Detail Page: Subscriptions
- Title — `product-detail-subscriptions-title-color`
- Price — `product-detail-one-time-purchase-price-text-color`
- Subscription Price — `product-detail-subscription-price-text-color`
- Description — `product-detail-subscriptions-description-text-color`
- Subscription Frequency — `product-detail-subscriptions-frequency-text-color`
- Button Background Color — `product-detail-subscriptions-button-background-color`
- Button Text Color — `product-detail-subscriptions-button-text-color`
- Variant Fields — `tweak-product-basic-item-variant-fields-color`

### Events: Item
- Event Pagination Title — `tweak-events-item-pagination-title-color`
- Event Pagination Date — `tweak-events-item-pagination-date-color`
- Event Pagination Icon — `tweak-events-item-pagination-icon-color`

### Accordion Block
- Accordion Block Divider Color — `tweak-accordion-block-divider-color`
- Accordion Block Icon Color — `tweak-accordion-block-icon-color`
- Background Color — `tweak-accordion-block-background-color`
- Stroke Color — `tweak-accordion-block-stroke-color`
- Accordion Block Divider Color on Background — `tweak-accordion-block-divider-color-on-background`
- Accordion Block Icon Color on Background — `tweak-accordion-block-icon-color-on-background`

### Image Block
- Overlay Color — `image-block-overlay-color`

### Image Block: Poster
- Title — `image-block-poster-image-title-color`
- Subtitle — `image-block-poster-image-subtitle-color`
- Inline Link — `image-block-poster-inline-link-color`
- Image Overlay — `image-block-poster-image-overlay-color`
- Title Background — `image-block-poster-image-title-bg-color-v2`
- Button Background — `image-block-poster-image-button-bg-color`
- Button Text — `image-block-poster-image-button-text-color`

### Image Block: Card
- Title — `image-block-card-image-title-color`
- Subtitle — `image-block-card-image-subtitle-color`
- Inline Link — `image-block-card-inline-link-color`
- Image Overlay — `image-block-card-image-overlay-color`
- Title Background — `image-block-card-image-title-bg-color`
- Button Background — `image-block-card-image-button-bg-color`
- Button Text — `image-block-card-image-button-text-color`

### Image Block: Overlap
- Title — `image-block-overlap-image-title-color`
- Subtitle — `image-block-overlap-image-subtitle-color`
- Inline Link — `image-block-overlap-inline-link-color`
- Image Overlay — `image-block-overlap-image-overlay-color`
- Title Background — `image-block-overlap-image-title-bg-color`
- Button Background — `image-block-overlap-image-button-bg-color`
- Button Text — `image-block-overlap-image-button-text-color`

### Image Block: Collage
- Title — `image-block-collage-image-title-color`
- Subtitle — `image-block-collage-image-subtitle-color`
- Inline Link — `image-block-collage-inline-link-color`
- Image Overlay — `image-block-collage-image-overlay-color`
- Title Background — `image-block-collage-image-title-bg-color`
- Button Background — `image-block-collage-image-button-bg-color`
- Button Text — `image-block-collage-image-button-text-color`
- Card Background — `image-block-collage-background-color`

### Image Block: Stack
- Title — `image-block-stack-image-title-color`
- Subtitle — `image-block-stack-image-subtitle-color`
- Inline Link — `image-block-stack-inline-link-color`
- Image Overlay — `image-block-stack-image-overlay-color`
- Title Background — `image-block-stack-image-title-bg-color`
- Button Background — `image-block-stack-image-button-bg-color`
- Button Text — `image-block-stack-image-button-text-color`

### Form Fields
- Field Background — `tweak-form-block-field-fill-color`
- Field Border — `tweak-form-block-field-border-color`
- Field Accent — `tweak-form-block-field-accent-color`
- Field Accessory — `tweak-form-block-field-accessory-color`
- Button Background — `tweak-form-block-button-background-color`
- Field Background on Background — `tweak-form-block-field-fill-color-on-background`
- Field Border on Background — `tweak-form-block-field-border-color-on-background`
- Field Accent on Background — `tweak-form-block-field-accent-color-on-background`
- Field Accessory on Background — `tweak-form-block-field-accessory-color-on-background`
- Button Background on Background — `tweak-form-block-button-background-color-on-background`

### Form Background
- Background — `tweak-form-block-background-color`
- Stroke Color — `tweak-form-block-stroke-color`

### Form Text
- Title — `tweak-form-block-title-color`
- Description — `tweak-form-block-description-color`
- Caption — `tweak-form-block-caption-color`
- Input — `tweak-form-block-field-input-color`
- Option — `tweak-form-block-option-color`
- Survey Title — `tweak-form-block-survey-title-color`
- Button Text — `tweak-form-block-button-text-color`
- Title on Background — `tweak-form-block-title-color-on-background`
- Description on Background — `tweak-form-block-description-color-on-background`
- Caption on Background — `tweak-form-block-caption-color-on-background`
- Input on Background — `tweak-form-block-field-input-color-on-background`
- Option on Background — `tweak-form-block-option-color-on-background`
- Survey Title on Background — `tweak-form-block-survey-title-color-on-background`
- Button Text on Background — `tweak-form-block-button-text-color-on-background`

### Newsletter Block
- Title Color — `tweak-newsletter-block-title-color`
- Description Color — `tweak-newsletter-block-description-color`
- Button Background Color — `tweak-newsletter-block-button-background-color`
- Button Text Color — `tweak-newsletter-block-button-text-color`
- Footnote Color — `tweak-newsletter-block-footnote-color`
- Background Color — `tweak-newsletter-block-background-color`
- Stroke Color — `tweak-newsletter-block-stroke-color`
- Title Color on Background — `tweak-newsletter-block-title-color-on-background`
- Description Color on Background — `tweak-newsletter-block-description-color-on-background`
- Button Background Color on Background — `tweak-newsletter-block-button-background-color-on-background`
- Button Text Color on Background — `tweak-newsletter-block-button-text-color-on-background`
- Footnote Color on Background — `tweak-newsletter-block-footnote-color-on-background`

### Summary Block
- Header Text Color — `tweak-summary-block-header-text-color`
- Title Color — `tweak-summary-block-title-color`
- Excerpt Color — `tweak-summary-block-excerpt-color`
- Read More Color — `tweak-summary-block-read-more-color`
- Primary Metadata Color — `tweak-summary-block-primary-metadata-color`
- Secondary Metadata Color — `tweak-summary-block-secondary-metadata-color`
- Background Color — `tweak-summary-block-background-color`
- Stroke Color — `tweak-summary-block-stroke-color`
- Header Text Color on Background — `tweak-summary-block-header-text-color-on-background`
- Title Color on Background — `tweak-summary-block-title-color-on-background`
- Excerpt Color on Background — `tweak-summary-block-excerpt-color-on-background`
- Read More Color on Background — `tweak-summary-block-read-more-color-on-background`
- Primary Metadata Color on Background — `tweak-summary-block-primary-metadata-color-on-background`
- Secondary Metadata Color on Background — `tweak-summary-block-secondary-metadata-color-on-background`

### Social Links Block
- Background Color — `tweak-social-links-block-background-color`
- Stroke Color — `tweak-social-links-block-stroke-color`
- Main Color — `social-links-block-main-icon-color`
- Secondary Color (Solid Style Only) — `social-links-block-secondary-icon-color`

### Scrolling
- Heading Color — `tweak-marquee-block-heading-color`
- Paragraph Color — `tweak-marquee-block-paragraph-color`
- Background Color — `tweak-marquee-block-background-color`
- Stroke Color — `tweak-marquee-block-stroke-color`
- Heading Color on Background — `tweak-marquee-block-heading-color-on-background`
- Paragraph Color on Background — `tweak-marquee-block-paragraph-color-on-background`

### Line Block
- Line Color — `tweak-line-block-line-color`

### Content Link Block
- Title Color — `tweak-content-link-block-title-color`

### Menu Block
- Menu Nav Color — `tweak-menu-block-nav-color`
- Menu Title — `tweak-menu-block-title-color`
- Menu Item Title — `tweak-menu-block-item-title-color`
- Menu Item Description — `tweak-menu-block-item-description-color`
- Menu Item Price — `tweak-menu-block-item-price-color`

### Quote Block
- Text — `tweak-quote-block-text-color`
- Source — `tweak-quote-block-source-color`
- Background Color — `tweak-quote-block-background-color`
- Stroke Color — `tweak-quote-block-stroke-color`
- Text Color on Background — `tweak-quote-block-text-color-on-background`
- Source Color on Background — `tweak-quote-block-source-color-on-background`

### Summary Blocks: Messages
- Limited Availability Label Color — `summary-block-limited-availability-label-color`

### Shape Block
- Background Color — `shape-block-background-color`
- Drop Shadow Color — `shape-block-dropshadow-color`
- Stroke Color — `shape-block-stroke-color`

### Products: Styles
- Background Color — `product-block-background-color`
- Stroke Color — `product-block-stroke-color`
- Text Color on Background — `product-block-text-color-on-background`

### Products: Quick View Button
- Color — `tweak-product-quick-view-button-color`

### Products: Quick View Lightbox
- Overlay Color — `tweak-product-quick-view-lightbox-overlay-color`
- Controls Color — `tweak-product-quick-view-lightbox-controls-color`

### Course Overview
- Course Progress Bar — `course-list-course-progress-bar-color`

### Course Overview (List Layout)
- Lesson and Chapter Background — `course-list-course-item-background`
- Lesson and Chapter Hover Background — `course-list-course-item-hover-background`
- Lesson and Chapter Text — `course-list-course-item-text-color`
- Lesson and Chapter Border — `course-list-course-chapter-divider-color`

### Course Overview (Grid Layout)
- Chapter Divider — `course-list-grid-layout-chapter-divider-color`
- Lesson Card Background — `course-list-grid-layout-course-item-background-color`
- Lesson Card Hover Background — `course-list-grid-layout-course-item-hover-background-color`
- Lesson Card Text — `course-list-grid-layout-course-item-text-color`
- Lesson Card Border — `course-list-grid-layout-course-item-border-color`

### Course Lesson
- Side Nav Background Color — `course-item-nav-background-color`
- Side Nav Text Color — `course-item-nav-text-color`
- Side Nav Active Lesson Background Color — `course-item-nav-active-lesson-background-color`
- Side Nav Active Lesson Text Color — `course-item-nav-active-lesson-text-color`
- Border Color — `course-item-nav-border-color`

### Public Preview Badges
- Background Color — `video-preview-badge-background-color`
- Font Color — `video-preview-badge-font-color`

### Donation Block
- Background Color — `donation-block-background-color`
- Stroke Color — `donation-block-stroke-color`

### Stack
- Background Color — `stack-background-color`
- Stroke Color — `stack-stroke-color`

### Scheduling Block
- Background — `scheduling-block-background-color`
- Scheduler Background — `scheduling-block-scheduler-background-color`
- Header Text — `scheduling-block-header-text-color`
- Scheduler Text — `scheduling-block-scheduler-text-color`
- Button / accent color — `scheduling-block-button-accent-color`
- Button text — `scheduling-block-button-text-color`

