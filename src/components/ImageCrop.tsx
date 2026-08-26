import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCropProps {
  image: string;
  aspect?: number;
  circular?: boolean;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.9);
    };
    image.src = imageSrc;
  });
}

export default function ImageCrop({ image, aspect = 1, circular = true, onCrop, onCancel }: ImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_: any, croppedArea: any) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(image, croppedAreaPixels);
    onCrop(blob);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] rounded-2xl border border-white/[0.06] overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
            <h3 className="text-[14px] font-semibold text-white">Crop Image</h3>
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="relative h-[350px] bg-black">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={circular ? 'round' : 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none bg-white/[0.1] accent-[#8b5cf6] cursor-pointer"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer"
              >
                <Check size={14} />
                Apply
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
