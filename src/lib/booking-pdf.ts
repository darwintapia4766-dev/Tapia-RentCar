import jsPDF from "jspdf";

export type BookingPdfData = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  document_id?: string | null;
  vehicle_name: string;
  start_date: string;
  end_date: string;
  days: number;
  delivery_time: string;
  delivery_location?: string | null;
  flight_number?: string | null;
  price_per_day: number | string;
  total_price: number | string;
  status: string;
  created_at: string;
};

function shortCode(id: string) {
  return `TRC-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente de confirmacion",
  confirmado: "Confirmada",
  completado: "Completada",
  cancelado: "Cancelada",
};

export function generateBookingPdf(b: BookingPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const ORANGE: [number, number, number] = [234, 88, 12];
  const DARK: [number, number, number] = [30, 30, 30];
  const MUTED: [number, number, number] = [110, 110, 110];

  // Header bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TAPIA RENT CAR", 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Comprobante de reserva", 14, 20);
  doc.setFontSize(9);
  doc.text("www.tapiarentcar.com", W - 14, 13, { align: "right" });
  doc.text("Santo Domingo, Republica Dominicana", W - 14, 20, { align: "right" });

  // Booking code block
  let y = 40;
  doc.setFillColor(248, 248, 248);
  doc.rect(14, y - 6, W - 28, 22, "F");
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("CODIGO DE RESERVA", 18, y);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(shortCode(b.id), 18, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Estado: ${STATUS_LABEL[b.status] ?? b.status}`, W - 18, y, { align: "right" });
  doc.text(`Emitido: ${new Date(b.created_at).toLocaleDateString("es-DO")}`, W - 18, y + 6, { align: "right" });

  y += 28;

  function section(title: string) {
    doc.setTextColor(...ORANGE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), 14, y);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, W - 14, y + 1.5);
    y += 7;
  }

  function row(label: string, value: string) {
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label, 14, y);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    const lines = doc.splitTextToSize(value || "—", W - 90);
    doc.text(lines, 70, y);
    y += Math.max(7, lines.length * 5.2);
  }

  section("Cliente");
  row("Nombre", b.client_name);
  row("Correo", b.client_email);
  row("Telefono", b.client_phone);
  row("Documento", b.document_id ?? "—");

  y += 3;
  section("Vehiculo y fechas");
  row("Vehiculo", b.vehicle_name);
  row("Entrega", b.start_date);
  row("Devolucion", b.end_date);
  row("Duracion", `${b.days} dia${b.days === 1 ? "" : "s"}`);
  row("Hora entrega", b.delivery_time);
  row("Lugar entrega", b.delivery_location ?? "—");
  row("Vuelo", b.flight_number ?? "—");

  y += 3;
  section("Resumen de pago");
  const perDay = Number(b.price_per_day);
  const total = Number(b.total_price);
  const subtotal = perDay * b.days;
  const deliveryFee = Math.max(0, +(total - subtotal).toFixed(2));
  row("Tarifa diaria", `US$ ${perDay.toFixed(2)}`);
  row("Dias", String(b.days));
  row("Subtotal vehiculo", `US$ ${subtotal.toFixed(2)}`);
  row(
    "Entrega",
    deliveryFee > 0
      ? `US$ ${deliveryFee.toFixed(2)} (${b.delivery_location ?? "lugar especificado"})`
      : "Gratis / A coordinar",
  );

  // Total box
  y += 2;
  doc.setFillColor(...ORANGE);
  doc.rect(14, y, W - 28, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL A PAGAR", 18, y + 9);
  doc.setFontSize(15);
  doc.text(`US$ ${total.toFixed(2)}`, W - 18, y + 9.5, { align: "right" });
  y += 22;

  // Footer note
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const note = [
    "Conserve este codigo para cualquier consulta, modificacion o cancelacion de su reserva.",
    "Para cambios contacte por WhatsApp mencionando su codigo de reserva.",
    "El vehiculo se entrega con tanque lleno y debe ser devuelto en las mismas condiciones.",
  ];
  note.forEach((line) => { doc.text(line, 14, y); y += 4.5; });

  // Footer band
  const footY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footY - 4, W - 14, footY - 4);
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text("Tapia Rent Car · www.tapiarentcar.com", 14, footY);
  doc.text(shortCode(b.id), W - 14, footY, { align: "right" });

  const filename = `reserva-${shortCode(b.id)}-${b.client_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}

export { shortCode as bookingShortCode };
