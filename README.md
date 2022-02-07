# SEO Meta Fields app for Enonic XP

This Enonic XP application adds a multitude of helpful meta fields for your [Enonic XP](https://github.com/enonic/xp) site. Like [Open Graph](http://ogp.me/) meta fields, [Twitter Cards](https://dev.twitter.com/cards/overview) meta fields, [Google Search Console](https://www.google.com/webmasters/tools) meta tag, and more! It also let's you better customize your site's and contents' title tag and meta description information. By applying mixin-fields to each content you can easily fine tune your sites' SEO and social sharing!

This app will add the following functionality to your site:

1. SEO friendly titles
2. SEO meta description
3. **New in 1.5**: Social media sharing image (custom per content)
4. Open Graph meta data
5. Twitter Cards meta data
6. Google Search Console meta tag
7. Canonical meta tag
8. Robots.txt exclude setting
9. **New in 1.6**: Widget for Content Studio that displays all the SEO data!
10. **New in 1.7**: Configure the app through config-files on the server.

## Installation

Go into the Enonic XP Application admin tool and install the app from the [Enonic Market](https://market.enonic.com/).

The **SEO Meta Fields** app will then be available to add to your websites through the Content Studio admin tool in Enonic XP. Edit your site content to add this app. Remember to save (after you've configured the app).

## How to use this app

After adding this app you should see a new `SEO`-section on your site and on all of your contents. The fields in this section can be used to set a custom title, description and/or image on each content, used only for SEO purposes. Starting with 6.15, click the "+ SEO" (or anywhere on the box) to add the SEO fields to any content when editing it. With the fields added you can tailor your SEO as needed.

**NB!** You do not need to change anything in your code for this app to work. It will however add meta description, Twitter Cards, and Open Graph meta fields even if you already added this in your code, so please remove those fields first! The logic behind adding a SEO friendly title is smarter and it will never insert duplicate `<title>` tags.

This app introduces a number of global settings. They're controlled on the app itself (on your site content) and are used across the entire site, and/or as default fallback settings.

1. General settings
2. Twitter Cards
3. Fallback settings
4. Title config
5. Advanced: prioritized JSON paths

### General settings

**"Generate Canonical meta?"**
Turn generation of canonical meta field on or off. Default is off, since most sites ship with this already. If checked, it will generate the meta tag with current URL. The logic is simple, it will use the current content's path as value, something we know in Enonic XP always is unique.

**"Google Search Console (site verification code)"**
Add meta tag for Google Search Console (formerly known as Google Webmaster Tools). Just fill in your ID here to generate the proper tag on all pages. Consult your Google Search Console login for finding this ID.

**"Hide site from search engines?"**
We also introduce a setting for hiding the entire site from search engine robots. This might be handy when wanting to have a live beta site but not letting search engine index it. It's up to the search engines to respect this setting, and this setting does not hide the pages from outside visitors as links to them and direct URL's will still work.

### Twitter Cards

For Twitter Cards to work we need a Twitter username (starting with `@`). When that is in place we can generate meta data for improved Twitter sharing called "Twitter Cards". By omitting the username no such meta data will be generated.

### Fallback settings

This app tries to figure out which data to use for all the meta fields based on the current content. However, on some pages, there might not be any custom data set, like on your site's first page. That's what these settings are for: default fallbacks. Here is where you add a default image to fallback on for Open Graph and Twitter Cards, and any fallback title and meta description. If nothing is added here, and the app can't figure out any suitable data to use for a content, the meta fields are not generated at all.

### Title config

With the title configuration you can control how we create the titles for you. If you already have a `<title>` tag in your source html, we will overwrite it and use it's location in the source code. It's pretty clever this way. If you do not have this tag already, we will append it at the end of the `<head>`-tag.

The settings here let you control if you want to add the site's name at the end of all pages' titles. You can activate this on all pages, but also control to not do this on the front page. There's also an option for controlling what separator sign to use between page name and site name (defaults to the dash character).

Note: Meta fields for Open Graph and Twitter Cards does not use these settings, it never adds site name to it's title meta field as it is redundant data.

### Advanced: prioritized JSON paths

When figuring out what data to put in your meta fields, this app analyzes the current content you're viewing. It will fetch a pre-defined set of fields in a pre-defined order (more on that later in the "Waterfall logic" section). You might however have fields with different names, or want to add more fields, or control in which order the data is evaluated. Then these settings are for you.

Add field names as comma separated strings, like `field1, field2, long-fieldname3`. It will remove spaces and it will handle dashes and other special characters in your field names. These custom fields will be checked before any other fields. If you add more than one field here, we'll let the first one overwrite any other fields on its right hand side. So if we find data in `field2` we won't look in `long-fieldname3`. This gives you powerful control over your SEO!

We only evaluate for matches in the JSON `data`-node for each content. So if you fill in `myField`, we'll look for `data.myField` in the content JSON (refer to Enonic XP's documentation on `getContent()` function).

### Advanced: default configuration files

You can put a file on the server to configure all running instances of the app across one server. This is a feature that you can turn on and off per site through the app's configuration when adding the app (through the `Don't overwrite values from app.config` setting). This means you can have the cake and eat it too!

Locate your `$XP_HOME/config/` folder and create a file called `com.enonic.app.metafields.cfg` and fill it with data like this, changing variables as needed (remove or comment out the ones you don't need):

```
# Configuration file for SEO Metafields app.
canonical = true|false
siteVerification = "xxx"
blockRobots = true|false
# This one is specific for the configuration file, use it when editing the app config in Content Studio to overwrite any configuration from this file.
# disableAppConfig = true|false
titleSeparator = "<3"
titleBehaviour = true|false
titleFrontpageBehaviour = true|false
twitterUsername = "@companyTwitter"
removeTwitterImage = true|false
removeOpenGraphUrl = true|false
removeOpenGraphImage = true|false
# seoImage = "[AnyImageContentID]"
seoImageIsPrescaled = true|false
# frontpageImage = "[AnyImageContentID]"
frontpageImageIsPrescaled = true|false
seoTitle = "Fallback title"
seoDescription = "Fallback description"
pathsImages = "media.mediaImage.imgSrc, mediaImage"
pathsTitles = "data.customTitle, someField"
pathsDescriptions = "data.description, data.preface"
```

You can find this example file in the root directory of this repo.

**NB!** When using this file, any corresponding setting in the admin UI will be overwritten. It is not possible, currently, to preview the values from the configuration files from the admin UI.

## Waterfall logic for meta fields

We will always add the meta fields for title and description, and most of the meta fields for Open Graph. However, if we cannot find any image to use, we won't add the meta fields for Open Graph image or Twitter Cards image.

It's important to understand the waterfall logic we use when evaluating which data to use for our meta fields (with the first match overwriting all the following ones):

### For titles

1. Current content's `SEO` mixin's `title` field.
2. The app config's custom JSON paths, if any (in the order defined).
3. Check in some commonly used fields: `title`, `header`, `heading`.
4. The content's `displayName` field (all content has this field).
5. See if the site itself has the `SEO` field `title` filled out.
6. As a last resort, we default to the site's `displayName` field.

For titles there is no way it can be empty, at least the last fallback will always trigger.

### For descriptions

1. Current content's `SEO` mixin's `description` field.
2. The app config's custom JSON paths, if any (in the order defined).
3. Check in some commonly used fields: `preface`, `description`, `summary`.
4. See if the site itself has the `SEO` field `description` filled out.
5. As a last resort, we default to the site's `description` field (default Enonic XP data).
6. An empty description is created.

### For images

1. Current content's `SEO` mixin's `image` field.
2. The app config's custom JSON paths, if any (in the order defined).
3. Check in some commonly used fields: `image`, `images`.
4. Resort to the fallback image set on the app itself.
5. If nothing is found the meta fields for the image are not created.

## Releases and Compatibility

| Version | XP version |
| ------------- | ------------- |
| 1.8.0-1.8.3 | 7.0.0 |
| 1.5.0-1.7.0 | 6.15.0 |
| 1.1.4-1.4.0 | 6.7.0 |
| 1.1.0-1.1.3 | 6.4.0 |
| 1.0.0 | 6.3.0 |
| 0.5.0 | 6.3.0 |

## Changelog

### Version 1.8.3

Added support for nested images (inside item- or option-sets)

### Version 1.8.2

Fixed 404 error on CSS reference in widget panel

### Version 1.8.1

Fixed widget not showing in the context panel of Content Studio

### Version 1.8.0

* Upgraded to work with Enonic XP 7.x.  -  Fairly simple and straightforward changes to references
and build tools to make it compatible with 7.x.  Will not work with XP 6.x.

### Version 1.7.0

* New: configure the app from configuration files on the server. Credit @edwardgronroos of TINE SA.
* Fix: Inject the `og:` namespace prefix definition in the `<html>`-tag automatically.

### Version 1.6.0

* New: Handy widget that displays what data each content item will expose to Facebook and Twitter and Google bots.

### Version 1.5.0

* New: Possibility to override/add custom image per content.
* Fix: Automatically skip converting images to JPG if it's a SVG being used.
* Changed: Fieldset display-name is now only "SEO" instead of "SEO Metadata".
* Changed: Using new x-data format making SEO fieldset optional.
* Update gradle build-file to modern format.
* Require Enonic XP 6.15.

### Version 1.4.0

* Added config option to return separate fallback image for frontpage. Credit @nerdegutt
* Added config option to return raw (unscaled) fallback images for both frontpage and normal content. Credit @nerdegutt
* Using HtmlArea as description basis now possible, tags stripped. (#29)
* Changing the label for "hide from search engine". (#30)

### Version 1.3.3

* Handle nested userDefinedPaths and non-strings when overriding title.

### Version 1.3.2

* **Bug fixed** don't intercept content types other than html files. Can cause crashes on websites generating XML or JSON.
* Improve title behavior on clean installs of the app.
* Upgrade to Gradle 3.

### Version 1.3.1

* Greatly improved usability of app by adding help texts to all the fields.
* Changed the overall structure of settings for the app. Now with more logical groups (field sets).
* Gave multiple labels improved names, making it more obvious what they do.
* Improved documentation (this file).
* Regex force Twitter username to always begin with the @ symbol.
* Added default settings for front page behavior, it now starts as checked.
* Setting for "Append site name to title" now starts out as checked.
* Added "-" as the default page-site title separator.

### Version 1.3.0

* Added Twitter Card meta data generation.
* Added canonical meta data generation.

### Version 1.2.0

* Fixed bug where user-defined paths for meta description always failed.
* Fixed a bug on how multiple user-defined paths (for all scenarios) where trimmed (only first field worked if space characters where used between the commas).
* Prefer user-defined paths before content DisplayName, when generating titles.
* Updates to readme to reflect the new and improved "waterfall" logic (also contained some errors).

### Version 1.1.4

* Upgrade to version 6.7.3

### Version 1.1.3

* Better handle data from CMS2XP (empty data fields) for custom fields setting

### Version 1.1.2

* Fix some minor code consistency things
* Use the new lib-util library (1.1.1)

### Version 1.1.1

* Fix crash on page contribution handling on new sites
* Fix crash on "robot" toggle on new sites

### Version 1.1.0

* Added settings on app, and for all content, to "exclude from search" (robots)
* Added setting for Google search console (old webmaster tools)
* Improved handling of nulls, empties, and multiple app setups

### Version 1.0.0

* App is launched
* Renamed to SEO Meta Fields
* Multiple changes and improvements
* **NOT** compatible with the older versions

### Version 0.5.0

* First Beta-launch (as "Open Graph app")
