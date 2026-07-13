module.exports = function (eleventyConfig) {
  // Static assets copied verbatim into _site/ (no template processing).
  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/script.js": "script.js" });
  eleventyConfig.addPassthroughCopy({ "src/refresh.php": "refresh.php" });
  eleventyConfig.addPassthroughCopy({ "src/gh_config.sample.php": "gh_config.sample.php" });

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
