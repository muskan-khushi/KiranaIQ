"""
Groq Vision Client
Wraps the Groq multimodal API to extract structured shelf intelligence
from a kirana store image.

Now uses ImagePreprocessor to resize/enhance images before sending,
which improves extraction accuracy on dark or low-res field photos.
"""
import base64
import json
import re
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

GROQ_VISION_MODEL = "llama-3.2-11b-vision-preview"

SYSTEM_PROMPT = """You are a retail shelf analyst specialising in Indian kirana (corner grocery) stores.
Analyse the provided store image and return ONLY a valid JSON object — no prose, no markdown fences.

Required fields (all mandatory):
{
  "shelf_density": <float 0.0–1.0>,
  "sku_diversity": <int 1–10>,
  "dominant_categories": [<str>, ...],
  "refill_signal": <float 0.0–1.0>,
  "store_area_estimate": "<small|medium|large>",
  "image_type": "<interior|counter|exterior|other>",
  "image_quality": "<good|poor|unusable>",
  "observations": "<one sentence key observation>"
}

Category options: staples, snacks, beverages, personal_care, dairy, tobacco, cleaning, frozen, confectionery, electronics, imported

Calibration guide:
- shelf_density 0.9+ = fully stocked; 0.5 = half-empty; 0.2 = nearly bare
- sku_diversity 8+ = very diverse; 4 = average kirana; 1 = single-category
- refill_signal: 0.2 = recently sold out (high demand); 0.8 = slow mover / overstocked
- small < 100 sqft, medium 100-300 sqft, large > 300 sqft"""


def _parse_response(text: str) -> dict:
    text = re.sub(r"```(?:json)?|```", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


def _default_response() -> dict:
    return {
        "shelf_density": 0.5,
        "sku_diversity": 5,
        "dominant_categories": ["staples"],
        "refill_signal": 0.5,
        "store_area_estimate": "medium",
        "image_type": "other",
        "image_quality": "poor",
        "observations": "Could not extract data from image.",
    }


async def analyze_image_url(url: str) -> dict:
    """Async: fetches image → preprocesses → sends to Groq Vision."""
    try:
        from app.config import settings
        from groq import AsyncGroq
        import httpx
        from ai_pipeline.vision.image_preprocessor import ImagePreprocessor

        async with httpx.AsyncClient(timeout=15) as http:
            img_resp = await http.get(url)
            img_resp.raise_for_status()
            raw_bytes = img_resp.content
            content_type = img_resp.headers.get("content-type", "image/jpeg").split(";")[0]

        # Preprocess for better quality
        preprocessor = ImagePreprocessor()
        processed_bytes, content_type = preprocessor.preprocess(raw_bytes, content_type)

        b64 = base64.b64encode(processed_bytes).decode()
        data_url = f"data:{content_type};base64,{b64}"

        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        completion = await client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {"type": "text", "text": "Analyse this kirana store image and return the JSON object."},
                    ],
                },
            ],
            max_tokens=512,
            temperature=0.1,
        )
        raw_text = completion.choices[0].message.content or ""
        result = _parse_response(raw_text)
        return result if result else _default_response()

    except Exception as e:
        print(f"[groq_client] analyze_image_url error: {e}")
        return _default_response()


def analyze_image_bytes(image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
    """Sync wrapper for unit tests and one-off analysis."""
    import asyncio
    from ai_pipeline.vision.image_preprocessor import ImagePreprocessor

    async def _run():
        try:
            from app.config import settings
            from groq import AsyncGroq

            preprocessor = ImagePreprocessor()
            processed_bytes, processed_mt = preprocessor.preprocess(image_bytes, media_type)

            b64 = base64.b64encode(processed_bytes).decode()
            data_url = f"data:{processed_mt};base64,{b64}"

            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            completion = await client.chat.completions.create(
                model=GROQ_VISION_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": data_url}},
                            {"type": "text", "text": "Analyse this kirana store image and return the JSON object."},
                        ],
                    },
                ],
                max_tokens=512,
                temperature=0.1,
            )
            raw_text = completion.choices[0].message.content or ""
            result = _parse_response(raw_text)
            return result if result else _default_response()
        except Exception as e:
            print(f"[groq_client] analyze_image_bytes error: {e}")
            return _default_response()

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, _run())
                return future.result()
        else:
            return loop.run_until_complete(_run())
    except Exception as e:
        print(f"[groq_client] event loop error: {e}")
        return _default_response()