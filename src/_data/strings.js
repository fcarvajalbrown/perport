// Shared UI strings per language. The layout selects strings[lang] using each
// page's `lang` (front matter for the root/Spanish tree, directory data for
// /en/). Nav URLs differ per language for the translated pages (Home,
// Portfolio); Writing and Works are single pages shared by both trees.
module.exports = {
  es: {
    toggleLabel: "EN",
    toggleTitle: "View in English",
    nav: [
      { label: "Inicio", url: "/" },
      { label: "Escritos", url: "/writing/" },
      { label: "Portafolio", url: "/portfolio/" },
      { label: "Obras", url: "/works/" },
    ],
    footer: "Felipe Carvajal Brown · Santiago de Chile",
  },
  en: {
    toggleLabel: "ES",
    toggleTitle: "Ver en español",
    nav: [
      { label: "Home", url: "/en/" },
      { label: "Writing", url: "/writing/" },
      { label: "Portfolio", url: "/en/portfolio/" },
      { label: "Works", url: "/works/" },
    ],
    footer: "Felipe Carvajal Brown · Santiago, Chile",
  },
};
