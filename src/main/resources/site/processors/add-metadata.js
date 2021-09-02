const libs = {
    portal: require("/lib/xp/portal"),
    thymeleaf: require("/lib/thymeleaf"),
    util: require("/lib/util"),
    common: require("/lib/common"),
};

const view = resolve("add-metadata.html");

exports.responseProcessor = function (req, res) {
    const site = libs.portal.getSite();
    const content = libs.portal.getContent();
    const siteConfig = libs.common.getTheConfig(site);

    const isFrontpage = site._path === content._path;
    const pageTitle = libs.common.getPageTitle(content, site);
    const titleAppendix = libs.common.getAppendix(site, isFrontpage);

    const siteVerification = siteConfig.siteVerification || null;

    const url = libs.portal.pageUrl({ path: content._path, type: "absolute" });
    const fallbackImage = siteConfig.seoImage;
    let fallbackImageIsPrescaled = siteConfig.seoImageIsPrescaled;
    if (isFrontpage && siteConfig.frontpageImage) {
        fallbackImage = siteConfig.frontpageImage;
        fallbackImageIsPrescaled = siteConfig.frontpageImageIsPrescaled;
    }
    const image = libs.common.getOpenGraphImage(
        content,
        site,
        fallbackImage,
        fallbackImageIsPrescaled
    );

    const params = {
        title: pageTitle,
        description: libs.common.getMetaDescription(content, site),
        siteName: site.displayName,
        locale: libs.common.getLang(content, site),
        type: isFrontpage ? "website" : "article",
        url,
        image,
        imageWidth: 1200, // Twice of 600x315, for retina
        imageHeight: 630,
        blockRobots:
            siteConfig.blockRobots || libs.common.getBlockRobots(content),
        siteVerification,
        canonical: siteConfig.canonical || false,
        twitterUserName: siteConfig.twitterUsername,
    };

    const metadata = libs.thymeleaf.render(view, params);

    // Force arrays since single values will be return as string instead of array
    res.pageContributions.headEnd = libs.util.data.forceArray(
        res.pageContributions.headEnd
    );
    res.pageContributions.headEnd.push(metadata);

    // Handle injection of title - use any existing tag by replacing its content.
    // Also - Locate the <html> tag and make sure the "og" namespace is added.
    const titleHtml = "<title>" + pageTitle + titleAppendix + "</title>";
    const ogAttribute = "og: http://ogp.me/ns#";
    let titleAdded = false;
    if (res.contentType === "text/html") {
        if (res.body) {
            if (typeof res.body === "string") {
                // Find a title in the html and use that instead of adding our own title
                const titleHasIndex = res.body.indexOf("<title>") > -1;
                if (titleHasIndex) {
                    res.body = res.body.replace(
                        /(<title>)(.*?)(<\/title>)/i,
                        titleHtml
                    );
                    titleAdded = true;
                }
                // Find <html> and if it does not have proper "og"-prefix - inject it!
                const htmlIndex = res.body.toLowerCase().indexOf("<html");
                const endHtmlIndex = res.body.indexOf(">", htmlIndex);
                let thereIsAnAttributeThere = false;
                const tagAttributes = res.body.indexOf("=", htmlIndex);
                let prefixFound = false;
                if (tagAttributes) {
                    thereIsAnAttributeThere = true;
                }
                let htmlTagAttributes;
                if (thereIsAnAttributeThere) {
                    const htmlTagContents = res.body
                        .substr(htmlIndex + 5, endHtmlIndex - htmlIndex - 5)
                        .trim(); // Inside <html XX> - 5 is number of characters for <html
                    htmlTagAttributes = htmlTagContents.split("="); // Split on = so we can locate all the attributes.

                    for (let i = 0; i < htmlTagAttributes.length; i++) {
                        if (
                            htmlTagAttributes[i].toLowerCase().trim() ===
                            "prefix"
                        ) {
                            prefixFound = true;
                            if (
                                htmlTagAttributes[i + 1].indexOf(
                                    ogAttribute
                                ) === -1
                            ) {
                                //log.info("Before join - " + htmlTagAttributes[i+1]);
                                htmlTagAttributes[i + 1] =
                                    htmlTagAttributes[i + 1].substr(
                                        0,
                                        htmlTagAttributes[i + 1].length - 1
                                    ) +
                                    " " +
                                    ogAttribute +
                                    htmlTagAttributes[i + 1].substr(-1);
                                //log.info("After join - " + htmlTagAttributes[i+1]);
                            } else {
                                //log.info("Already in the tag!");
                            }
                        }
                    }
                }
                // Join the new html element string, and create the new body to return.
                let fixedHtmlTag = htmlTagAttributes.join("=");
                if (!prefixFound) {
                    fixedHtmlTag += ' prefix="' + ogAttribute + '"';
                }
                res.body =
                    res.body.substr(0, htmlIndex + 5) +
                    " " +
                    fixedHtmlTag +
                    res.body.substr(endHtmlIndex);
            }
        }
    }
    if (!titleAdded) {
        res.pageContributions.headEnd.push(titleHtml);
    }

    if (req.params) {
        if (req.params.debug === "true") {
            res.applyFilters = false; // Skip other filters
        }
    }

    return res;
};
