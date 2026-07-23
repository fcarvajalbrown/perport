// Single source of truth for the Escritos taxonomy and type labels.
// `topics` order is also the display order of the filter chips.
const topics = [
  { slug: "ia",       label: "Inteligencia Artificial" },
  { slug: "trabajo",  label: "Trabajo y empleo" },
  { slug: "economia", label: "Economía y fiscalidad" },
  { slug: "software", label: "Software e ingeniería" },
  { slug: "govtech",  label: "GovTech, datos y transparencia" },
  { slug: "ciudad",   label: "Vivienda, ciudad e infraestructura" },
  { slug: "ciencia",  label: "Ciencia, medio ambiente y educación" },
  { slug: "justicia", label: "Justicia, derechos e instituciones" },
  { slug: "politica", label: "Política y partidos" },
];

const labelOf = {};
topics.forEach(function (t) { labelOf[t.slug] = t.label; });

const tipos = {
  carta:    { singular: "Carta al director", plural: "Cartas" },
  columna:  { singular: "Columna",           plural: "Columnas" },
  articulo: { singular: "Artículo",          plural: "Artículos" },
};

module.exports = { topics: topics, labelOf: labelOf, tipos: tipos };
