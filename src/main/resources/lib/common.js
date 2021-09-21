const libs = {
	portal: require('/lib/xp/portal'),
	content: require('/lib/xp/content'),
	util: require('/lib/util')
};

var appNamePath = libs.util.app.getJsonName();
var mixinPath = 'meta-data';

// The configuration needs to be fetched first from site config (using current content if site context is not available - like for widgets), and lastly we'll check for any config files and use these to overwrite.
exports.getTheConfig = function(site) {
	var config = libs.portal.getSiteConfig();
	if (!config) {
		config = exports.getSiteConfig(site, app.name);
	}
	let disableAppConfig = false;
	if (config.general && config.general.default) {
		disableAppConfig = config.general.default.disableAppConfig;
	}
	//Set empty values so the lookup does not crash
	if (config.general === undefined) {
		config.general = { default: {} };
	}
	if (config.twitter === undefined) {
		config.twitter = { default: {} };
	}
	if (config.fallback === undefined) {
		config.fallback = { default: {} };
	}
	if (config.title === undefined) {
		config.title = { default: {} };
	}
	if (config.advanced === undefined) {
		config.advanced = { default: {} };
	}

	if (app.config && !disableAppConfig) {
		// General settings
		if (app.config.canonical) {
			config.general.default.canonical = app.config.canonical;
		}
		if (app.config.blockRobots) {
			config.general.default.blockRobots = app.config.blockRobots;
		}
		if (app.config.siteVerification) {
			config.general.default.siteVerification =
				app.config.siteVerification;
		}

		// Twitter
		if (app.config.twitterUsername) {
			config.twitter.default.twitterUsername = app.config.twitterUsername;
		}

		// SEO fallback
		if (app.config.seoImage) {
			config.fallback.default.seoImage = app.config.seoImage;
		}
		if (app.config.seoImageIsPrescaled) {
			config.fallback.default.seoImageIsPrescaled =
				app.config.seoImageIsPrescaled;
		}
		if (app.config.frontpageImage) {
			config.fallback.default.frontpageImage = app.config.frontPageImage;
		}
		if (app.config.frontpageImageIsPrescaled) {
			config.fallback.default.frontpageImageIsPrescaled =
				app.config.frontpageImageIsPrescaled;
		}
		if (app.config.seoTitle) {
			config.fallback.default.seoTitle = app.config.seoTitle;
		}
		if (app.config.seoDescription) {
			config.fallback.default.seoDescription = app.config.seoDescription;
		}

		// Title
		if (app.config.titleSeparator) {
			config.title.default.titleSeparator = app.config.titleSeparator;
		}
		if (app.config.titleBehaviour) {
			config.title.default.titleBehaviour = app.config.titleBehaviour;
		}
		if (app.config.titleFrontpageBehaviour) {
			config.title.default.titleFrontpageBehaviour =
				app.config.titleFrontpageBehaviour;
		}

		// Advanced
		if (app.config.pathsImages) {
			config.advanced.default.pathsImages = app.config.pathsImages;
		}
		if (app.config.pathsTitles) {
			config.advanced.default.pathsTitles = app.config.pathsTitles;
		}
		if (app.config.pathsDescriptions) {
			config.advanced.default.pathsDescriptions =
				app.config.pathsDescriptions;
		}
	}
	return config;
};

exports.getLang = function(content, site) {
	// Format locale into the ISO format that Open Graph wants.
	var localeMap = {
		da: 'da_DK',
		sv: 'sv_SE',
		pl: 'pl_PL',
		no: 'nb_NO',
		en: 'en_US'
	};
	var lang = content.language || site.language || 'en';
	return localeMap[lang] || localeMap.en
}
exports.getSite = function(siteUrl) {
	// Code courtesy of PVMerlo at Enonic Discuss - https://discuss.enonic.com/u/PVMerlo
	var sitesResult = libs.content.query({
		query: "_path LIKE '/content/*' AND _name LIKE '" + siteUrl + "' AND data.siteConfig.applicationKey = '" + app.name + "'",
		contentTypes: ["portal:site"]
	});
	return sitesResult.hits[0];
}

// Find the site config even when the context is not known.
exports.getSiteConfig = function(site, applicationKey) {
	// Code courtesy of PVMerlo at Enonic Discuss - https://discuss.enonic.com/u/PVMerlo
	if (site && site.data && site.data.siteConfig) {
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
};

function commaStringToArray(str) {
	var commas = str || '';
	var arr = commas.split(',');
	if (arr) {
		arr = arr.map(function(s) { return s.trim() });
	} else {
		arr = libs.util.data.forceArray(str); // Make sure we always work with an array
	}
	return arr;
}

function findValueInJson(json, paths) {
	var value = null;
	var pathLength = paths.length;
	var jsonPath = ";";

	for (var i = 0; i < pathLength; i++) {
		if ( paths[i] ) {
			jsonPath = 'json.data["' + paths[i].split('.').join('"]["') + '"]'; // Wrap property so we can have dashes in it
			try {
				value = eval(jsonPath);
			} catch(e) {
				// Noop
			}
			if(value) {
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
exports.getAppendix = function(site, isFrontpage) {
	var siteConfig = exports.getTheConfig(site);
	var titleAppendix = '';
	if (siteConfig.title.default.titleBehaviour || !siteConfig.title.default.hasOwnProperty("titleBehaviour") ) {
		 var separator = siteConfig.title.default.titleSeparator || '-';
		 var titleRemoveOnFrontpage = siteConfig.title.default.hasOwnProperty("titleFrontpageBehaviour") ? siteConfig.title.default.titleFrontpageBehaviour : true; // Default true needs to be respected
		 if (!isFrontpage || !titleRemoveOnFrontpage) {
			  titleAppendix = ' ' + separator + ' ' + site.displayName;
		 }
	}
	return titleAppendix;
}

exports.getBlockRobots = function(content) {
	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].blockRobots;
	return setWithMixin;
};

exports.getContentForCanonicalUrl = function(content) {
	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoContentForCanonicalUrl
		&& libs.content.get({
			key: content.x[appNamePath][mixinPath].seoContentForCanonicalUrl
		});
	return setWithMixin;
};

exports.getPageTitle = function(content, site) {
	var siteConfig = exports.getTheConfig(site);

	var userDefinedPaths = siteConfig.advanced.default.pathsTitles || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content, userDefinedArray) : null;

	var setWithMixin = content.x[appNamePath]
	&& content.x[appNamePath][mixinPath]
	&& content.x[appNamePath][mixinPath].seoTitle;

	var metaTitle = setWithMixin ? stringOrNull(content.x[appNamePath][mixinPath].seoTitle) // Get from mixin
			: stringOrNull(userDefinedValue) // json property defined by user as important
			|| stringOrNull(content.data.title) || stringOrNull(content.data.heading) || stringOrNull(content.data.header) // Use other typical content titles (overrides displayName)
			|| stringOrNull(content.displayName) // Use content's display name
			|| stringOrNull(siteConfig.fallback.default.seoTitle) // Use default og-title for site
			|| stringOrNull(site.displayName) // Use site default
			|| ''

	return metaTitle;
};

exports.getMetaDescription = function(content, site) {
	var siteConfig = exports.getTheConfig(site);

	var userDefinedPaths = siteConfig.advanced.default.pathsDescriptions || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content,userDefinedArray) : null;

	var setWithMixin = content.x[appNamePath]
			&& content.x[appNamePath][mixinPath]
			&& content.x[appNamePath][mixinPath].seoDescription;

	var metaDescription = setWithMixin ? content.x[appNamePath][mixinPath].seoDescription // Get from mixin
					: userDefinedValue
					|| content.data.preface || content.data.description || content.data.summary // Use typical content summary names
					|| siteConfig.fallback.default.seoDescription // Use default for site
					|| site.description // Use bottom default
					|| ''; // Don't crash plugin on clean installs

	// Strip away all html tags, in case there's any in the description.
	var regex = /(<([^>]+)>)/ig;
	metaDescription = metaDescription.replace(regex, "");

	return metaDescription;
};

exports.getOpenGraphImage = function(content, site, defaultImg, defaultImgPrescaled) {
	var siteConfig = exports.getTheConfig(site);

	var userDefinedPaths = siteConfig.advanced.default.pathsImages || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content, userDefinedArray) : null;

	var setWithMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoImage;

	var ogImage;

	// Try to find an image in the content's image or images properties
	var imageArray = libs.util.data.forceArray(
	 		setWithMixin ? stringOrNull(content.x[appNamePath][mixinPath].seoImage)
			: userDefinedValue
			|| content.data.image
			|| content.data.images
			|| []);

	if (imageArray.length || (defaultImg && !defaultImgPrescaled)) {
		// Set basic image options
		var imageOpts = {
			scale: "block(1200,630)", // Open Graph requires 600x315 for landscape format. Double that for retina display.
			quality: 85,
			format: "jpg",
			type: "absolute",
		};

		// Set the ID to either the first image in the set or use the default image ID
		imageOpts.id = imageArray.length
			? imageArray[0].image || imageArray[0]
			: defaultImg;

		// Fetch actual image, make sure not to force it into .jpg if it's a SVG-file.
		var theImage = libs.content.get({
			key: imageOpts.id,
		});
		var mimeType = null;
		if (theImage) {
			if (theImage.data.media.attachment) {
				mimeType =
					theImage.attachments[theImage.data.media.attachment]
						.mimeType; // Get the actual mimeType
			} else if (theImage.data.media) {
				mimeType = theImage.attachments[theImage.data.media].mimeType;
			}
		}
		// Reset forced format on SVG to make them servable through portal.imageUrl().
		if (!mimeType || mimeType === "image/svg+xml") {
			imageOpts.quality = null;
			imageOpts.format = null;
		}

		ogImage = imageOpts.id ? libs.portal.imageUrl(imageOpts) : null;
	} else if (defaultImg && defaultImgPrescaled) {
		// Serve pre-optimized image directly
		ogImage = libs.portal.attachmentUrl({
			id: defaultImg,
			type: "absolute",
		});
	}

	// Return the image URL or nothing
	return ogImage;
};
