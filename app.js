const search = document.querySelector("#searchInput");
const results = document.querySelector("#results");
const count = document.querySelector("#resultCount");
const label = document.querySelector("#resultLabel");
const categories = document.querySelector("#categories");
const template = document.querySelector("#productCard");
const clear = document.querySelector("#clearSearch");
let products = [];
let activeCategory = "Todos";
const preseasonCodes = new Set([
  "20345CLOR", "20850BSNG", "21582DRBN", "21582WSTO", "22136BSNG", "22136SBDY",
  "22765CLOR", "22801BLSG", "22801OLGG", "23315BSNG", "23315WSTO", "25490PLCN",
  "25551OLNA", "26240RVGN", "27025BLSG", "27025SBDY", "27611BLSG", "27611WSTO",
  "28835CLOR", "33317RVGN", "37770BCW", "37770BLSG", "37841BLSG", "37841ORPL",
  "39724BBSN", "42410HMNL", "47914BLSG", "48262WSTO", "48835GMTG", "49448CLOR",
  "50151MTBA", "57450BSNG"
]);

const normalize = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const compareSizes = (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });

function render(items) {
  results.replaceChildren();
  count.textContent = items.length;
  label.textContent = items.length === 1 ? "producto encontrado" : "productos encontrados";
  if (!items.length) {
    results.innerHTML = '<p class="empty">No encontramos artículos para esa búsqueda. Probá con el código, color o una palabra más amplia.</p>';
    return;
  }
  for (const product of items) {
    const node = template.content.cloneNode(true);
    const img = node.querySelector("img");
    img.src = product.image;
    img.alt = `${product.name} - ${product.code}`;
    node.querySelector(".category").textContent = product.category;
    node.querySelector("h2").textContent = product.name;
    node.querySelector(".code").textContent = product.code;
    node.querySelector(".color").textContent = product.color;
    node.querySelector(".stock-total-value").textContent = product.stock?.total ?? 0;
    node.querySelector(".stock-carrito").textContent = product.stock?.carrito ?? 0;
    node.querySelector(".stock-local").textContent = product.stock?.local ?? 0;
    node.querySelector(".stock-bariloche").textContent = product.stock?.bariloche ?? 0;
    node.querySelector(".stock-rio").textContent = product.stock?.rio ?? 0;
    const sizeDetails = product.stock?.sizes || [];
    if (sizeDetails.length) {
      const sizeSection = node.querySelector(".stock-sizes");
      const sizeRows = node.querySelector(".stock-size-rows");
      sizeSection.hidden = false;
      for (const size of [...sizeDetails].sort((a, b) => compareSizes(a.size, b.size))) {
        const row = document.createElement("div");
        row.className = "stock-size-row";
        row.setAttribute("role", "row");
        for (const value of [size.size, size.carrito, size.local, size.bariloche, size.rio]) {
          const cell = document.createElement("span");
          cell.setAttribute("role", "cell");
          cell.textContent = value;
          row.append(cell);
        }
        sizeRows.append(row);
      }
    }
    results.append(node);
  }
}

function filter() {
  const query = normalize(search.value);
  const items = products.filter((p) => {
    const searchable = `${p.code} ${p.baseCode} ${p.color} ${p.name} ${p.category}`;
    const matchesCategory = activeCategory === "Todos"
      || (activeCategory === "PreSeason" && preseasonCodes.has(p.code))
      || p.category === activeCategory;
    return (!query || normalize(searchable).includes(query)) && matchesCategory;
  });
  clear.hidden = !query;
  render(items);
}

function buildCategories() {
  const names = ["Todos", "PreSeason", ...new Set(products.map((p) => p.category).sort((a, b) => a.localeCompare(b)))];
  names.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = name;
    button.setAttribute("aria-pressed", name === activeCategory);
    button.addEventListener("click", () => {
      activeCategory = name;
      [...categories.children].forEach((chip) => chip.setAttribute("aria-pressed", chip.textContent === name));
      filter();
    });
    categories.append(button);
  });
}

fetch("products.json").then((r) => r.json()).then((data) => {
  products = data;
  buildCategories();
  filter();
  search.addEventListener("input", filter);
}).catch(() => results.innerHTML = '<p class="empty">No se pudo cargar el catálogo. Abrí esta carpeta desde un servidor local.</p>');

clear.addEventListener("click", () => { search.value = ""; search.focus(); filter(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { search.value = ""; filter(); } });
