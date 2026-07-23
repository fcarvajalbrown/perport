const crypto = require("crypto");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // Cache-busting: append a short content hash of the source asset so returning
  // visitors re-fetch styles.css / script.js / logo.png only when they change.
  // Example: {{ '/styles.css' | bust }} -> /styles.css?v=1a2b3c4d
  eleventyConfig.addFilter("bust", function (publicPath) {
    try {
      const srcFile = "src" + publicPath;
      const hash = crypto
        .createHash("md5")
        .update(fs.readFileSync(srcFile))
        .digest("hex")
        .slice(0, 8);
      return publicPath + "?v=" + hash;
    } catch (e) {
      return publicPath;
    }
  });

  // Spanish long-date formatting for escritos. Read UTC fields so a date-only
  // front-matter value ("2026-07-09") is not shifted a day by local timezone.
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  eleventyConfig.addFilter("fechaLarga", function (d) {
    const dt = new Date(d);
    return dt.getUTCDate() + " de " + MESES[dt.getUTCMonth()] + " de " + dt.getUTCFullYear();
  });
  eleventyConfig.addFilter("isoDate", function (d) {
    return new Date(d).toISOString().slice(0, 10);
  });

  // True if any item in the collection has the given escrito `type`. Used to
  // render a type filter chip only when that type actually has content.
  eleventyConfig.addFilter("hasType", function (collection, type) {
    return (collection || []).some(function (item) { return item.data.type === type; });
  });

  // Static assets copied verbatim into _site/ (no template processing).
  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/script.js": "script.js" });
  eleventyConfig.addPassthroughCopy({ "src/escritos.js": "escritos.js" });
  eleventyConfig.addPassthroughCopy("src/writing/covers");
  eleventyConfig.addPassthroughCopy({ "src/refresh.php": "refresh.php" });
  eleventyConfig.addPassthroughCopy({ "src/gh_config.sample.php": "gh_config.sample.php" });
  eleventyConfig.addPassthroughCopy({ "src/logo-nav.png": "logo-nav.png" });
  eleventyConfig.addPassthroughCopy({ "src/logo-nav.webp": "logo-nav.webp" });
  eleventyConfig.addPassthroughCopy({ "src/favicon-32.png": "favicon-32.png" });
  eleventyConfig.addPassthroughCopy({ "src/apple-touch-icon.png": "apple-touch-icon.png" });
  eleventyConfig.addPassthroughCopy({ "src/og-image.png": "og-image.png" });
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    // Markdown and HTML pages may use Nunjucks/Liquid features (layouts, etc.).
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "liquid",
    templateFormats: ["md", "njk", "html", "liquid"],
  };
};
