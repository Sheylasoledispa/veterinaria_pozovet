from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm


def generar_factura_pdf(reserva):
    """
    Devuelve bytes del PDF (simple y limpio).
    """
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    y = height - 20 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, y, "Veterinaria PozoVet - Factura de Reserva")
    y -= 8 * mm

    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, f"Código: {reserva.codigo_factura}")
    y -= 5 * mm
    c.drawString(20 * mm, y, f"Fecha: {reserva.fecha_reserva.strftime('%Y-%m-%d %H:%M')}")
    y -= 5 * mm

    cliente = reserva.id_usuario
    c.drawString(20 * mm, y, f"Cliente: {cliente.nombre} {cliente.apellido} | Cédula: {cliente.cedula}")
    y -= 10 * mm

    # Tabla header
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, y, "Producto")
    c.drawString(110 * mm, y, "Cant.")
    c.drawString(130 * mm, y, "P. Unit")
    c.drawString(160 * mm, y, "Subtotal")
    y -= 4 * mm

    c.setLineWidth(0.5)
    c.line(20 * mm, y, 190 * mm, y)
    y -= 6 * mm

    c.setFont("Helvetica", 10)
    total = Decimal("0.00")

    for d in reserva.detalles.all():
        nombre = d.id_producto.nombre_producto
        cant = int(d.cantidad)
        pu = Decimal(str(d.precio_unitario))
        sub = Decimal(str(d.subtotal))
        total += sub

        # salto de página si se llena
        if y < 25 * mm:
            c.showPage()
            y = height - 20 * mm
            c.setFont("Helvetica", 10)

        c.drawString(20 * mm, y, (nombre[:45] + "...") if len(nombre) > 48 else nombre)
        c.drawRightString(125 * mm, y, str(cant))
        c.drawRightString(155 * mm, y, f"${pu:.2f}")
        c.drawRightString(190 * mm, y, f"${sub:.2f}")
        y -= 6 * mm

    y -= 4 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(190 * mm, y, f"TOTAL: ${total:.2f}")
    y -= 10 * mm

    if reserva.observaciones:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20 * mm, y, "Observaciones:")
        y -= 5 * mm
        c.setFont("Helvetica", 10)
        c.drawString(20 * mm, y, reserva.observaciones[:120])

    c.showPage()
    c.save()

    buf.seek(0)
    return buf.getvalue()
