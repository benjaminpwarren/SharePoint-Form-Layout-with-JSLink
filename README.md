Inspired by https://www.codeproject.com/Articles/1039724/SharePoint-Client-Side-Rendering-List-Forms-p.

# Installation

To 'install', save `jslink_layout.js` and `form.html` somewhere in your site.

I create a folder structure in `SiteAssets` like so:

Path | Contains
------------ | -------------
`/SiteAssets/lib` | This is where generic JS/CSS/HTML goes (e.g. jQuery, SPServices, generic SharePoint libraries).
`/SiteAssets/lib<App>` | This is where JS/CSS/HTML specific to a given project/app goes.
`/SiteAssets/Lists/<ListName>` | This is where JS/CSS/HTML specific to a given List goes.

Doing this means you can use dynamic references elsewhere in your code, instead of hardcoding paths.

# Setup

In the `JS Link` property of your `ListFormWebPart`s, add a link to `jslink_layout.js` using a `~site` or `~sitecollection` token,
i.e. using my folder structure, it would be `~site/SiteAssets/lib/jslink_layout.js`.

**YOU CAN'T USE `../../` style relative paths with JSLink paths**, they don't seem to work. Use tokens, root relative,
or absolute paths. Tokens are best because they're dynamic, so essentially relative.

Add `Content Editor Web Part`s to your `*Form.aspx` pages. In the `Content Link` property, add a link to your `form.html` template,
i.e. using my folder structure, the link would be `../../SiteAssets/Lists/<ListName>/form.html`.

**`CONTENT EDITOR WEB PART`S DON'T LIKE TOKENS**, so use a relative or absolute path. (Yay, SharePoint.)

Haven't yet tested with `ctx.Templates`.

Note: Debugging `jslink` js a b*%^h. Good luck.
