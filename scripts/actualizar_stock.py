import json
import sys
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "products.json"


def as_text(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def as_price(value):
    if value is None or as_text(value) in {"", "-"}:
        return None
    if isinstance(value, (int, float)):
        return round(value)
    return round(float(as_text(value).replace("$", "").replace(".", "").replace(",", ".")))


if len(sys.argv) != 2:
    raise SystemExit("Uso: python scripts/actualizar_stock.py RUTA_AL_EXCEL_STOCK.xlsx")

stock_file = Path(sys.argv[1]).resolve()
if not stock_file.is_file():
    raise SystemExit(f"No se encontró el archivo de stock: {stock_file}")

products = json.loads(CATALOG.read_text(encoding="utf-8"))
workbook = openpyxl.load_workbook(stock_file, read_only=True, data_only=True)
sheet = workbook["STOCK"]
stock_by_code = {}
retail_values_by_code = {}

for row in sheet.iter_rows(min_row=2, max_col=18, values_only=True):
    code = f"{as_text(row[1])}{as_text(row[2])}".replace(" ", "")
    if not code:
        continue
    retail_price = as_price(row[10])
    if retail_price is not None:
        retail_values_by_code.setdefault(code, []).append(retail_price)
    record = stock_by_code.setdefault(code, {"carrito": 0, "local": 0, "rio": 0, "bariloche": 0, "sizes": {}})
    size = as_text(row[3]) or "Sin talle"
    size_record = record["sizes"].setdefault(size, {"carrito": 0, "local": 0, "rio": 0, "bariloche": 0})
    values = {"carrito": int(row[12] or 0), "local": int(row[13] or 0), "rio": int(row[16] or 0), "bariloche": int(row[17] or 0)}
    for base, amount in values.items():
        record[base] += amount
        size_record[base] += amount

for record in stock_by_code.values():
    record["total"] = record["carrito"] + record["local"] + record["rio"] + record["bariloche"]
    record["sizes"] = [{"size": size, **amounts} for size, amounts in record["sizes"].items() if sum(amounts.values()) > 0]

prices_by_code = {
    code: Counter(values).most_common(1)[0][0]
    for code, values in retail_values_by_code.items()
}
price_conflicts = {
    code: sorted(set(values))
    for code, values in retail_values_by_code.items()
    if len(set(values)) > 1
}

for product in products:
    product["stock"] = stock_by_code.get(product["code"], {"carrito": 0, "local": 0, "rio": 0, "bariloche": 0, "total": 0, "sizes": []})
    without_vat = prices_by_code.get(product["code"], 0)
    product["prices"] = {"withoutVat": without_vat, "vatPercent": 21, "withVat": round(without_vat * 1.21)}

CATALOG.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
catalog_codes = {product["code"] for product in products}
print(f"Precios sin IVA cargados desde RETAIL (columna K): {len(set(prices_by_code) & catalog_codes)}.")
conflicts_in_catalog = sorted(set(price_conflicts) & catalog_codes)
if conflicts_in_catalog:
    print("Advertencia: precios distintos por talle; se usó el valor más repetido en: " + ", ".join(conflicts_in_catalog[:30]))
print(f"Stock actualizado para {len(products)} productos; {len(stock_by_code)} códigos leídos.")
