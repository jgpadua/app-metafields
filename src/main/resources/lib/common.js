var libs = {
	portal: require('/lib/xp/portal'),
	content: require('/lib/xp/content'),
	util: require('/lib/util')
};

var appNamePath = libs.util.app.getJsonName();
var mixinPath = 'meta-data';

// The configuration needs to be fetched first from site config (using current content if site context is not available - like for widgets), and lastly we'll check for any config files and use these to overwrite.
exports.getTheConfig = function (site) {
	var config = libs.portal.getSiteConfig();
	if (!config) {
		config = exports.getSiteConfig(site, app.name);
	}
	if (app.config && !config.disableAppConfig) {
		for (var prop in app.config) {
			var value = app.config[prop];
			if (prop !== 'config.filename' && prop !== 'service.pid') { // Default props for .cfg-files, not to use further.
				if (value === 'true' || value === 'false') {
					value = value === 'true';
				}
				config[prop] = value;
			}
		}
	}
	return config;
};

exports.getLang = function (content, site) {
	// Format locale into the ISO format that Open Graph wants.
	let locale = 'en_US';
	if (content.language || site.language) {
		locale = (content.language || site.language).replace('-', '_');
	}
	return locale;
}

exports.getSite = function (siteUrl) {
	// Code courtesy of PVMerlo at Enonic Discuss - https://discuss.enonic.com/u/PVMerlo
	var sitesResult = libs.content.query({
		query: "_path LIKE '/content/*' AND _name LIKE '" + siteUrl + "' AND data.siteConfig.applicationKey = '" + app.name + "'",
		contentTypes: ["portal:site"]
	});
	return sitesResult.hits[0];
}

// Find the site config even when the context is not known.
exports.getSiteConfig = function (site, applicationKey) {
	// Code courtesy of PVMerlo at Enonic Discuss - https://discuss.enonic.com/u/PVMerlo
	if (site) {
		if (site.data) {
			if (site.data.siteConfig) {
				var siteConfigs = libs.util.data.forceArray(site.data.siteConfig);
				var siteConfig = {};
				siteConfigs.forEach(function (cfg) {
					if (applicationKey && cfg.applicationKey == applicationKey) {
						siteConfig = cfg;
					} else if (!applicationKey && cfg.applicationKey == app.name) {
						siteConfig = cfg;
					}
				});
				return siteConfig.config;
			}
		}
	}
};


function commaStringToArray(str) {
	var commas = str || '';
	var arr = commas.split(',');
	if (arr) {
		arr = arr.map(function (s) { return s.trim() });
	} else {
		arr = libs.util.data.forceArray(str); // Make sure we always work with an array
	}
	return arr;
}

function findValueInJson(json, paths, fullPath) {
	var value = null;
	var pathLength = paths.length;
	var jsonPath;

	for (var i = 0; i < pathLength; i++) {
		if (paths[i]) {
			jsonPath = (fullPath) ? 'json["' + paths[i].split('.').join('"]["') + '"]' : 'json.data["' + paths[i].split('.').join('"]["') + '"]'; // Wrap property so we can have dashes in it
			try {
				value = eval(jsonPath);
			} catch (e) {
				// Noop
			}
			if (value) {
				if (value.trim() === "")
					value = null; // Reset value if empty string (skip empties)
				else
					break; // Expect the first property in the string is the most important one to use
			} // if value
		} // if paths[i]
	} // for
	return value;
} // function findValueInJson

function isString(o) {
	return typeof o === 'string' || o instanceof String;
}

function stringOrNull(o) {
	return isString(o) ? o : null;
}

// Concat site title? Trigger if set to true in settings, or if not set at all (default = true)
exports.getAppendix = function (site, isFrontpage) {
	var siteConfig = exports.getTheConfig(site);
	var titleAppendix = '';
	if (siteConfig.titleBehaviour || !siteConfig.hasOwnProperty("titleBehaviour")) {
		var separator = siteConfig.titleSeparator || '-';
		var titleRemoveOnFrontpage = siteConfig.hasOwnProperty("titleFrontpageBehaviour") ? siteConfig.titleFrontpageBehaviour : true; // Default true needs to be respected
		if (!isFrontpage || !titleRemoveOnFrontpage) {
			titleAppendix = ' ' + separator + ' ' + site.displayName;
		}
	}
	return titleAppendix;
}

exports.getBlockRobots = function (content) {
	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].blockRobots;
	return setWithMixin;
};

exports.getContentForCanonicalUrl = function (content) {
	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoContentForCanonicalUrl
		&& libs.content.get({
			key: content.x[appNamePath][mixinPath].seoContentForCanonicalUrl
		});
	return setWithMixin;
};

exports.getPageTitle = function (content, site) {
	var siteConfig = exports.getTheConfig(site);

	var userDefinedPaths = siteConfig.pathsTitles || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content, userDefinedArray, siteConfig.fullPath) : null;

	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoTitle;

	var metaTitle = setWithMixin ? stringOrNull(content.x[appNamePath][mixinPath].seoTitle) // Get from mixin
		: stringOrNull(userDefinedValue) // json property defined by user as important
		|| stringOrNull(content.data.title) || stringOrNull(content.data.heading) || stringOrNull(content.data.header) // Use other typical content titles (overrides displayName)
		|| stringOrNull(content.displayName) // Use content's display name
		|| stringOrNull(siteConfig.seoTitle) // Use default og-title for site
		|| stringOrNull(site.displayName) // Use site default
		|| ''

	return metaTitle;
};

exports.getMetaDescription = function (content, site) {
	var siteConfig = exports.getTheConfig(site);

	var userDefinedPaths = siteConfig.pathsDescriptions || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content, userDefinedArray, siteConfig.fullPath) : null;

	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoDescription;

	var metaDescription = setWithMixin ? content.x[appNamePath][mixinPath].seoDescription // Get from mixin
		: userDefinedValue
		|| content.data.preface || content.data.description || content.data.summary // Use typical content summary names
		|| siteConfig.seoDescription // Use default for site
		|| site.description // Use bottom default
		|| ''; // Don't crash plugin on clean installs

	// Strip away all html tags, in case there's any in the description.
	var regex = /(<([^>]+)>)/ig;
	metaDescription = metaDescription.replace(regex, "");

	return metaDescription;
};

exports.getImage = function (content, site, defaultImg, defaultImgPrescaled) {
	const siteConfig = exports.getTheConfig(site);
	const userDefinedPaths = siteConfig.pathsImages || '';
	const userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	const userDefinedValue = userDefinedPaths ? findValueInJson(content, userDefinedArray, siteConfig.fullPath) : null;
	const setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoImage;

	let image;

	// Try to find an image in the content's image or images properties
	const imageArray = libs.util.data.forceArray(
		setWithMixin ? stringOrNull(content.x[appNamePath][mixinPath].seoImage)
			: userDefinedValue
			|| content.data.image
			|| content.data.images
			|| []);

	if (imageArray.length || (defaultImg && !defaultImgPrescaled)) {

		// Set basic image options
		const imageOpts = {
			scale: 'block(1200,630)', // Open Graph requires 600x315 for landscape format. Double that for retina display.
			quality: 85,
			format: 'jpg',
			type: 'absolute'
		};

		// Set the ID to either the first image in the set or use the default image ID
		imageOpts.id = imageArray.length ? (imageArray[0].image || imageArray[0]) : defaultImg;

		// Fetch actual image, make sure not to force it into .jpg if it's a SVG-file.
		const imageContent = libs.content.get({
			key: imageOpts.id
		});
		let mimeType = null;
		if (imageContent) {
			if (imageContent.data.media.attachment) {
				mimeType = imageContent.attachments[imageContent.data.media.attachment].mimeType; // Get the actual mimeType
			} else if (imageContent.data.media) {
				mimeType = imageContent.attachments[imageContent.data.media].mimeType;
			}
		}
		// Reset forced format on SVG to make them servable through portal.imageUrl().
		if (!mimeType || mimeType === 'image/svg+xml') {
			imageOpts.quality = null;
			imageOpts.format = null;
		}

		image = imageOpts.id ? libs.portal.imageUrl(imageOpts) : null;
	}
	else if (defaultImg && defaultImgPrescaled) {
		// Serve pre-optimized image directly
		image = libs.portal.attachmentUrl({
			id: defaultImg,
			type: 'absolute'
		});
	}

	// Return the image URL or nothing
	return image;
};
