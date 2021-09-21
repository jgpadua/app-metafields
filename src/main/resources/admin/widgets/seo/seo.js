var libs = {
	portal: require('/lib/xp/portal'),
	content: require('/lib/xp/content'),
	thymeleaf: require('/lib/thymeleaf'),
	util: require('/lib/util'),
	common: require('/lib/common')
};

/*
TODO: Refactoring of code in JS ... perhaps create entire ojects for each social media in common.js?
TODO: Link to Twitter/FB debuggers in a way so that the end-URL is sent to them (auto post?).
TODO: Possible to minimize help-texts (remember with cookie).
TODO: Somehow piece together the full end-URL (respecting vhost) instead of showing the admin-url. Currently not possible in XP to get "end URL" with code as code is not aware of server config.
TODO: Don't spawn anything for content without templates, folders, images, etc. Gives no meaning.
TODO: Perhaps add (?) icons with info for each data.
TODO: Possibility to click title, desc, image and see the water fall logic and where data is found?
TODO: Grade each data based on amount of text etc. Red, yellow, green. And info about it (best-practise).
*/
exports.get = function(req) {
/*
	TODO: Display content settings? If any, then fallbacks.
	x": {
		"com-enonic-app-metafields": {
			"meta-data"
*/

	var contentId = req.params.contentId;

	if (!contentId || !libs.content.exists({ key: contentId })) {
		return {
			contentType: 'text/html',
			body: '<widget class="error">No content selected</widget>'
		};
	}

	var params = {};
	var content = libs.content.get({ key: contentId });

	if (content) {
		// The first part of the content '_path' is the site's URL, make sure to fetch current site!
		var parts = content._path.split('/');
		var site = libs.common.getSite(parts[1]); // Send the first /x/-part of the content's path.
		if (site) {
			var siteConfig = libs.common.getTheConfig(site);
			if (siteConfig) {
				var isFrontpage = site._path === content._path;
				var pageTitle = libs.common.getPageTitle(content, site);
				var titleAppendix = libs.common.getAppendix(site, siteConfig, isFrontpage);
				var description = libs.common.getMetaDescription(content, site);
				if (description === '') description = null;

				var frontpageUrl = libs.portal.pageUrl({ path: site._path, type: "absolute" });
				var url = libs.portal.pageUrl({ path: content._path, type: "absolute" });
				var contentForCanonicalUrl = libs.common.getContentForCanonicalUrl(content);
				var canonicalUrl = contentForCanonicalUrl ? libs.portal.pageUrl({ path: contentForCanonicalUrl._path, type: "absolute" }) : url;
				var justThePath = url.replace(frontpageUrl,'');
				var canonicalJustThePath = canonicalUrl.replace(frontpageUrl,'');				

				const general = siteConfig.general && siteConfig.general.default ? siteConfig.general.default : {};
				const twitter = siteConfig.twitter && siteConfig.twitter.default ? siteConfig.twitter.default : {};
				const fallback = siteConfig.fallback && siteConfig.fallback.default ? siteConfig.fallback.default : {};

				var fallbackImage = fallback.seoImage;
				var fallbackImageIsPrescaled = fallback.seoImageIsPrescaled;
				if (isFrontpage && fallback.frontpageImage) {
					 fallbackImage = fallback.frontpageImage;
					 fallbackImageIsPrescaled = fallback.frontpageImageIsPrescaled;
				}
				var image = libs.common.getOpenGraphImage(content, site, fallbackImage, fallbackImageIsPrescaled);

				params = {
					summary: {
						title: pageTitle,
						fullTitle: (pageTitle + titleAppendix),
						description,
						image,
						canonical: (general.canonical ? canonicalJustThePath : null),
						blockRobots: (general.blockRobots || libs.common.getBlockRobots(content))
					},
					og: {
						type: (isFrontpage ? 'website' : 'article'),
						title: pageTitle,
						description,
						siteName: site.displayName,
						url: justThePath,
						locale: libs.common.getLang(content,site),
						image: {
							src: image,
							width: 1200, // Twice of 600x315, for retina
							height: 630
						}
					},
					twitter: {
						active: (twitter.twitterUsername ? true : false),
						title: pageTitle,
						description,
						image,
						site: twitter.twitterUsername || null
					}
				};
			}
		}
	}

	return {
		body: libs.thymeleaf.render( resolve('seo.html'), params),
		contentType: 'text/html'
	};
};
