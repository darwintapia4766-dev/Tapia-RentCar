import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

export function VehicleImageUploader({
  vehicleId,
  images,
  onChange,
}: {
  vehicleId: string;
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (images.length + files.length > 8) {
      toast.error("Máximo 8 fotos por vehículo.");
      return;
    }
    setUploading(true);
    const next = [...images];
    try {
      for (const file of Array.from(files)) {
        if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
          toast.error(`Formato no soportado: ${file.name}`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} excede 5 MB.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${vehicleId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("vehicle-images")
          .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
        if (error) {
          toast.error(`No se pudo subir ${file.name}: ${error.message}`);
          continue;
        }
        const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path);
        next.push(data.publicUrl);
      }
      onChange(next);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(idx: number) {
    const url = images[idx];
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
    const m = url.match(/\/vehicle-images\/(.+)$/);
    if (m) {
      await supabase.storage.from("vehicle-images").remove([m[1]]);
    }
  }

  function setCover(idx: number) {
    if (idx === 0) return;
    const next = [images[idx], ...images.filter((_, i) => i !== idx)];
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 bg-orange text-orange-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                Portada
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => setCover(i)}
                  className="bg-white/90 text-navy p-1.5 rounded-full"
                  title="Marcar como portada"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="bg-red-500 text-white p-1.5 rounded-full"
                title="Eliminar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {images.length < 8 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-border hover:border-orange grid place-items-center text-muted-foreground hover:text-orange transition"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <div className="text-center">
                <Upload className="h-5 w-5 mx-auto" />
                <span className="text-xs mt-1 block">Subir foto</span>
              </div>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-muted-foreground">JPG, PNG o WebP. Máx 5 MB c/u, hasta 8 fotos.</p>
    </div>
  );
}
