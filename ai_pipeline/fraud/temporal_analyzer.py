"""
Temporal Analyzer
Analyses a short walkthrough video (5–10s) to detect staged restocking —
the most sophisticated fraud pattern: filling shelves immediately before inspection.

Strategy:
  1. Sample frames at T=0%, 25%, 50%, 75%, 100% of video duration.
  2. Send each frame to Groq Vision for shelf-density extraction.
  3. Compute the trend: if SDI rises monotonically, flag restocking in progress.
  4. High variance + rising trend = temporal_restocking_flag.

Fallback: if video processing fails for any reason, return neutral result (no flag).
"""
import asyncio
import base64
import math
import statistics
from typing import Optional


class TemporalAnalyzer:
    RESTOCKING_THRESHOLD = 0.15   # SDI rise across video to flag
    MIN_FRAMES_NEEDED   = 3

    async def analyze(self, video_url: str) -> dict:
        """
        Parameters
        ----------
        video_url : str
            URL of the uploaded video (local /uploads/... path or S3 URL).

        Returns
        -------
        dict with:
            temporal_stability_score : float  0–1 (1 = stable, no restocking)
            restocking_detected       : bool
            frame_sdis                : list[float]
            flag                      : dict | None
        """
        try:
            frames = await self._extract_frames(video_url)
            if not frames or len(frames) < self.MIN_FRAMES_NEEDED:
                return self._neutral()

            sdis = await asyncio.gather(*[
                self._sdi_from_frame(img_bytes, mt) for img_bytes, mt in frames
            ])
            sdis = [s for s in sdis if s is not None]
            if len(sdis) < self.MIN_FRAMES_NEEDED:
                return self._neutral()

            return self._evaluate(sdis)
        except Exception as e:
            print(f"[temporal_analyzer] Error: {e}")
            return self._neutral()

    # ── Frame extraction ──────────────────────────────────────────────────────

    async def _extract_frames(self, video_url: str) -> list:
        """
        Extract frames using opencv-python-headless (already in requirements.txt).
        Returns list of (jpeg_bytes, media_type) tuples.
        Supports both local file paths and HTTP URLs.
        """
        try:
            import cv2
            import numpy as np
            import httpx

            if video_url.startswith("http"):
                async with httpx.AsyncClient(timeout=20) as client:
                    resp = await client.get(video_url)
                    resp.raise_for_status()
                    video_bytes = resp.content
                # Write to a temp file (cv2 needs a path or file-like)
                import tempfile, os
                with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                    tmp.write(video_bytes)
                    tmp_path = tmp.name
                cap = cv2.VideoCapture(tmp_path)
            else:
                # local path
                local_path = video_url.lstrip("/")
                # Resolve relative to backend working dir
                cap = cv2.VideoCapture(local_path)

            if not cap.isOpened():
                return []

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if total_frames < 1:
                cap.release()
                return []

            # Sample at 5 evenly-spaced positions
            sample_positions = [
                int(total_frames * frac)
                for frac in [0.0, 0.25, 0.5, 0.75, 0.99]
            ]

            frames = []
            for pos in sample_positions:
                cap.set(cv2.CAP_PROP_POS_FRAMES, min(pos, total_frames - 1))
                ret, frame = cap.read()
                if not ret:
                    continue
                ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if ok:
                    frames.append((buf.tobytes(), "image/jpeg"))

            cap.release()
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

            return frames

        except ImportError:
            print("[temporal_analyzer] cv2 not available — skipping frame extraction")
            return []
        except Exception as e:
            print(f"[temporal_analyzer] Frame extraction failed: {e}")
            return []

    # ── Per-frame SDI via Groq Vision ─────────────────────────────────────────

    async def _sdi_from_frame(self, img_bytes: bytes, media_type: str) -> Optional[float]:
        try:
            from app.config import settings
            from groq import AsyncGroq

            b64 = base64.b64encode(img_bytes).decode()
            data_url = f"data:{media_type};base64,{b64}"

            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            completion = await client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {"type": "text",
                         "text": (
                             "Estimate the shelf density (fraction of shelf space that is stocked) "
                             "in this store image. Respond with ONLY a single float between 0.0 and 1.0."
                         )},
                    ],
                }],
                max_tokens=10,
                temperature=0.0,
            )
            raw = completion.choices[0].message.content.strip()
            # Strip any non-numeric chars except decimal point
            clean = "".join(c for c in raw if c.isdigit() or c == ".")
            return float(clean)
        except Exception:
            return None

    # ── Trend evaluation ──────────────────────────────────────────────────────

    def _evaluate(self, sdis: list) -> dict:
        stability = 1.0 - statistics.stdev(sdis) if len(sdis) > 1 else 1.0
        stability = max(0.0, min(1.0, stability))

        # Monotonic rise check
        rises = sum(1 for i in range(1, len(sdis)) if sdis[i] > sdis[i - 1])
        total_delta = sdis[-1] - sdis[0]
        monotonic_rise = rises >= len(sdis) - 1 and total_delta > self.RESTOCKING_THRESHOLD

        flag = None
        if monotonic_rise:
            flag = {
                "code": "temporal_restocking_flag",
                "severity": "high",
                "description": (
                    f"Shelf density rose by {total_delta:.0%} across the video — "
                    "shelves may have been stocked during filming to inflate the estimate."
                ),
                "recommended_action": (
                    "Request a new unannounced video or schedule a physical visit."
                ),
            }

        return {
            "temporal_stability_score": round(stability, 3),
            "restocking_detected": monotonic_rise,
            "frame_sdis": [round(s, 3) for s in sdis],
            "flag": flag,
        }

    def _neutral(self) -> dict:
        return {
            "temporal_stability_score": 0.8,
            "restocking_detected": False,
            "frame_sdis": [],
            "flag": None,
        }