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

  // Static assets copied verbatim into _site/ (no template processing).
  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/script.js": "script.js" });
  eleventyConfig.addPassthroughCopy({ "src/refresh.php": "refresh.php" });
  eleventyConfig.addPassthroughCopy({ "src/gh_config.sample.php": "gh_config.sample.php" });
  eleventyConfig.addPassthroughCopy({ "src/logo.png": "logo.png" });
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });

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
