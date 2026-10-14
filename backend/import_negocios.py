"""Importa negocios desde una planilla CSV a la base de datos.

Uso (ver IMPORTAR_NEGOCIOS.md):
  python import_negocios.py negocios.csv              # solo revisa, NO guarda (prueba)
  python import_negocios.py negocios.csv --guardar    # guarda como "pendientes"
  python import_negocios.py negocios.csv --guardar --aprobar   # guarda ya publicados
"""
import argparse
import csv
import os
import re
import sys
import uuid
from datetime import datetime, timezone

CATEGORIAS = {
    "mecanica", "gnc", "scanner", "neumaticos", "electrica", "alineacion", "optica",
    "chapa_soldadura", "pintura", "repuestos", "lubricentros", "polarizados", "tapiceria",
    "seguridad_airbag", "accesorios", "personalizacion", "aire_acondicionado", "cascos",
    "importadores", "lavadero", "grua", "papeles_vtv", "asesoria_legal", "gestoria_aseguradoras",
}
COLUMNAS = ["nombre", "categoria", "vehiculos", "zona", "whatsapp", "descripcion", "servicios"]


def limpiar_whatsapp(valor):
    return re.sub(r"\D", "", valor or "")


def leer_fila(fila):
    """Devuelve (negocio, error). Si hay error, negocio es None."""
    nombre = (fila.get("nombre") or "").strip()
    categoria = (fila.get("categoria") or "").strip().lower()
    zona = (fila.get("zona") or "").strip()
    whatsapp = limpiar_whatsapp(fila.get("whatsapp"))
    vehiculos = [v.strip().lower() for v in re.split(r"[,;/ ]+", fila.get("vehiculos") or "") if v.strip()]
    vehiculos = [v for v in dict.fromkeys(vehiculos) if v in ("auto", "moto")]

    if len(nombre) < 2:
        return None, "falta el nombre"
    if categoria not in CATEGORIAS:
        return None, f"categoria '{categoria}' no existe (usá una de la lista de IMPORTAR_NEGOCIOS.md)"
    if not vehiculos:
        return None, "vehiculos debe ser auto, moto o 'auto,moto'"
    if not zona:
        return None, "falta la zona"
    if not 8 <= len(whatsapp) <= 15:
        return None, "el whatsapp debe tener entre 8 y 15 numeros (ej: 5492211234567)"

    servicios = [s.strip()[:60] for s in re.split(r"[,;]", fila.get("servicios") or "") if s.strip()][:30]
    return {
        "name": nombre[:120], "category": categoria, "vehicles": vehiculos,
        "zone": zona[:80], "whatsapp": whatsapp,
        "description": (fila.get("descripcion") or "").strip()[:1000],
        "services": servicios,
    }, None


def main():
    ap = argparse.ArgumentParser(description="Importar negocios desde CSV")
    ap.add_argument("archivo")
    ap.add_argument("--guardar", action="store_true", help="guardar en la base (sin esto solo revisa)")
    ap.add_argument("--aprobar", action="store_true", help="publicar directo (sin esto quedan pendientes)")
    args = ap.parse_args()

    with open(args.archivo, newline="", encoding="utf-8-sig") as f:
        muestra = f.read(4096)
        f.seek(0)
        delim = ";" if muestra.count(";") > muestra.count(",") else ","
        lector = csv.DictReader(f, delimiter=delim)
        faltan = [c for c in COLUMNAS if c not in (lector.fieldnames or [])]
        if faltan:
            sys.exit(f"Faltan columnas en la planilla: {', '.join(faltan)}")
        filas = list(lector)

    validos, errores = [], []
    for n, fila in enumerate(filas, start=2):
        if not any((v or "").strip() for v in fila.values()):
            continue
        negocio, error = leer_fila(fila)
        if error:
            errores.append((n, error))
        else:
            validos.append(negocio)

    print(f"Filas correctas: {len(validos)} | Con errores: {len(errores)}")
    for n, error in errores:
        print(f"  Fila {n}: {error}")

    if not args.guardar:
        print("\nPrueba terminada: NO se guardo nada. Agregá --guardar para cargarlos.")
        return
    if not validos:
        sys.exit("No hay filas correctas para guardar.")

    from dotenv import load_dotenv
    from pathlib import Path
    from pymongo import MongoClient
    load_dotenv(Path(__file__).parent / ".env")
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

    estado = "approved" if args.aprobar else "pending"
    ahora = datetime.now(timezone.utc).isoformat()
    nuevos, repetidos = 0, 0
    vistos = set()
    for negocio in validos:
        clave = (negocio["name"].lower(), negocio["whatsapp"])
        if clave in vistos or db.businesses.find_one({"name": negocio["name"], "whatsapp": negocio["whatsapp"]}):
            repetidos += 1
            continue
        vistos.add(clave)
        negocio.update({
            "id": str(uuid.uuid4()), "highlighted": False, "rating": 0.0, "reviewsCount": 0,
            "photos": [], "status": estado, "createdAt": ahora,
        })
        db.businesses.insert_one(negocio)
        nuevos += 1
    print(f"Guardados: {nuevos} ({'publicados' if args.aprobar else 'pendientes'}) | Repetidos omitidos: {repetidos}")


if __name__ == "__main__":
    main()
