import hondaCrv from "@/assets/honda-crv.jpg";
import hondaCivic from "@/assets/honda-civic.jpg";
import hyundaiI10 from "@/assets/hyundai-i10.jpg";
import hyundaiElantra from "@/assets/hyundai-elantra.jpg";
import chevroletCaptiva from "@/assets/chevrolet-captiva.jpg";
import nissanMarch from "@/assets/nissan-march.jpg";
import kiaSorento from "@/assets/kia-sorento.jpg";

const map: Record<string, string> = {
  "honda crv": hondaCrv,
  "honda civic": hondaCivic,
  "hyundai i10": hyundaiI10,
  "hyundai elantra": hyundaiElantra,
  "chevrolet captiva": chevroletCaptiva,
  "nissan march": nissanMarch,
  "kia sorento": kiaSorento,
};

export function vehicleImage(name: string): string {
  const key = name.trim().toLowerCase();
  return map[key] ?? hondaCrv;
}
