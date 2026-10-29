const books = [
  {
    kind: "Libro",
    year: 2026,
    title: "Byzantine Hallucination Consensus",
    authors: "Felipe Carvajal Brown",
    language: "Inglés",
    cover: "#2e4057",
    doi: "10.5281/zenodo.20075957",
  },
  {
    kind: "Libro de dibujos",
    year: 2017,
    title: "Pipe Ace: Learning from a Sketch",
    authors: "Felipe Carvajal Brown",
    language: "Inglés",
    note: "Autoeditado en Estados Unidos",
    cover: "#6b4b1f",
  },
];

const research = [
  {
    kind: "Nota técnica",
    year: 2026,
    title: "A Continuous Alternative to Fixed-Fraction Byzantine Thresholds in Multi-Agent LLM Systems",
    authors: "Felipe Carvajal Brown",
    language: "Inglés",
    cover: "#1f4a5a",
    doi: "10.5281/zenodo.21341601",
  },
  {
    kind: "Preprint",
    year: 2026,
    title: "Entropía de Shannon como indicador de colapso progresivo en marcos estructurales: un simulador basado en MEF",
    authors: "Felipe Carvajal Brown",
    language: "Español",
    note: "En revisión en Ingeniare. Revista Chilena de Ingeniería",
    cover: "#5b2a3a",
    doi: "10.5281/zenodo.20007463",
  },
  {
    kind: "Informe",
    year: 2023,
    title: "Innovation in Sustainability: Addressing Heat Exchange Problems through Nano-biomaterial Simulations",
    authors: "Felipe Carvajal Brown",
    language: "Inglés",
    cover: "#2f4f3e",
    doi: "10.5281/zenodo.8412430",
  },
  {
    kind: "Tesis de pregrado",
    year: 2022,
    title: "Conservación Escuela República de México",
    authors: "Felipe Carvajal Brown, Cristopher Acuña y Ricardo Astudillo",
    language: "Español",
    cover: "#3b3355",
    doi: "10.5281/zenodo.10688167",
  },
];

module.exports = {
  shelves: [
    { heading: "Libros", items: books },
    { heading: "Investigación", items: research },
  ],
};
