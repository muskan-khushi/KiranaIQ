"""
Image Preprocessor
Resize, denoise, and enhance store images before sending to Groq Vision.
Better input quality → more reliable shelf-density and SKU extraction.

Operations applied (in order):
  1. Resize to max 1024px on longest side (Groq works well at this res, saves tokens)
  2. Mild sharpening (unsharp mask) to bring out shelf edges
  3. Contrast normalisation (CLAHE on luminance channel) for dark/overexposed shops
  4. JPEG encode at quality 85 (reduces payload size for faster upload)

Falls back gracefully if OpenCV is unavailable — returns the original bytes unchanged.
"""
from __future__ import annotations
from typing import Tuple


class ImagePreprocessor:
    MAX_SIDE_PX:  int   = 1024
    JPEG_QUALITY: int   = 85

    def preprocess(self, image_bytes: bytes, media_type: str = "image/jpeg") -> Tuple[bytes, str]:
        """
        Parameters
        ----------
        image_bytes : bytes
            Raw image bytes (JPEG, PNG, WebP, etc.)
        media_type : str
            Original MIME type — returned unchanged if we skip processing.

        Returns
        -------
        (processed_bytes, output_media_type)
        """
        try:
            import cv2
            import numpy as np

            # Decode
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return image_bytes, media_type

            # 1. Resize
            img = self._resize(img)

            # 2. Denoise (fast, light touch)
            img = cv2.fastNlMeansDenoisingColored(img, None, 5, 5, 7, 21)

            # 3. CLAHE on luminance channel for contrast normalisation
            img = self._clahe(img)

            # 4. Unsharp mask (mild sharpening)
            img = self._sharpen(img)

            # Encode back to JPEG
            ok, buf = cv2.imencode(
                ".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, self.JPEG_QUALITY]
            )
            if not ok:
                return image_bytes, media_type

            return buf.tobytes(), "image/jpeg"

        except ImportError:
            # cv2 not installed — return as-is
            return image_bytes, media_type
        except Exception as e:
            print(f"[image_preprocessor] Warning: {e} — using original image")
            return image_bytes, media_type

    # ── Private helpers ───────────────────────────────────────────────────────

    def _resize(self, img):
        import cv2
        h, w = img.shape[:2]
        longest = max(h, w)
        if longest <= self.MAX_SIDE_PX:
            return img
        scale = self.MAX_SIDE_PX / longest
        new_w, new_h = int(w * scale), int(h * scale)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    def _clahe(self, img):
        import cv2
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_eq = clahe.apply(l)
        lab_eq = cv2.merge([l_eq, a, b])
        return cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)

    def _sharpen(self, img):
        import cv2
        import numpy as np
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        return cv2.addWeighted(img, 1.4, gaussian, -0.4, 0)