export const WHATSAPP_NUMBER = "18097294764";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function bookingMessage(b: {
  vehicleName: string;
  startDate: string;
  endDate: string;
  days: number;
  deliveryTime: string;
  deliveryLocation: string;
  totalPrice: number;
  clientName: string;
  clientPhone: string;
}): string {
  return [
    "¡Hola Tapia RentCar! Quiero solicitar una reserva:",
    `🚗 ${b.vehicleName}`,
    `📅 ${b.startDate} a ${b.endDate} (${b.days} días)`,
    `⏰ ${b.deliveryTime}  |  📍 ${b.deliveryLocation}`,
    `💰 Total: $${b.totalPrice}`,
    `👤 ${b.clientName}  |  📱 ${b.clientPhone}`,
  ].join("\n");
}
