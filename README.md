# Catálogo Patagonia Primavera-Verano 2026-27

Aplicación estática con 605 variantes extraídas del PDF de catálogo. Permite buscar por código completo o base, color, nombre y categoría.

Para usarla localmente, ejecutá desde esta carpeta:

```powershell
python -m http.server 8088 --bind 127.0.0.1
```

Luego abrí `http://127.0.0.1:8088/`.

## Actualizar stock

La ficha muestra stock total y por talle de Carrito, Local, Bariloche y Río. Para actualizarlo diariamente con una planilla STOCK:

```powershell
py -m pip install -r requirements.txt
py scripts\actualizar_stock.py "C:\ruta\STOCK 20-08.xlsx"
```

Después subí `products.json` actualizado a GitHub y redeployá el stack en Portainer. La planilla no se sube al repositorio.

## Actualizar precios

Usá la planilla de precios con estas columnas: `SKU`, `COLOR`, `PRECIO SIN IVA`, `IVA %` y `PRECIO CON IVA`. Podés dejar en blanco las prendas que aún no tengan precio: se mostrarán en `$0` hasta cargarlas.

```powershell
py scripts\actualizar_precios.py "C:\ruta\precios.xlsx"
```

El comando conserva las imágenes y el stock, y solo actualiza los precios dentro de `products.json`. Al finalizar, subí ese archivo a GitHub y redeployá el stack en Portainer.
