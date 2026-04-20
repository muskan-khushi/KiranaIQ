"""
Groq Vision Client
Wraps the Groq multimodal API (llava-v1.5-7b-4096-preview or llama-3.2-11b-vision-preview)
to extract structured shelf intelligence from a kirana store image.

Returns a normalised dict that ShelfAnalyzer can consume directly.
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
  "shelf_density": <float 0.0–1.0>,         // fraction of shelf space that is stocked
  "sku_diversity": <int 1–10>,              // approximate number of distinct product categories visible
  "dominant_categories": [<str>, ...],      // 1–5 categories from: staples, snacks, beverages, personal_care, dairy, tobacco, cleaning, frozen, confectionery, electronics, imported
  "refill_signal": <float 0.0–1.0>,         // 0=recently emptied/high turnover, 1=overstocked/low turnover
  "store_area_estimate": "<small|medium|large>",  // visual floor-space estimate
  "image_type": "<interior|counter|exterior|other>",
  "image_quality": "<good|poor|unusable>",
  "observations": "<one sentence key observation>"
}

Calibration guide:
- shelf_density 0.9+ = fully stocked; 0.5 = half-empty; 0.2 = nearly bare
- sku_diversity 8+ = very diverse (10+ categories); 4 = average kirana; 1 = single-category
- refill_signal: look for gaps at eye level (0.2 = sold out = high demand); full dusty top shelves (0.8 = slow mover)
- small < 100 sqft, medium 100-300 sqft, large > 300 sqft"""


def _parse_response(text: str) -> dict:
    """Robustly parse the JSON blob from the model response."""
    # Strip markdown fences if present
    text = re.sub(r"```(?:json)?|```", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract the first {...} block
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


def _default_response() -> dict:
    """Safe fallback when the model returns nothing useful."""
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
    """
    Async — fetches the image from `url` and sends it to Groq Vision.
    Used by ShelfAnalyzer in the main pipeline.
    """
    try:
        from app.config import settings
        from groq import AsyncGroq
        import httpx

        # Fetch the image bytes first so we can pass as base64
        async with httpx.AsyncClient(timeout=15) as http:
            img_resp = await http.get(url)
            img_resp.raise_for_status()
            image_bytes = img_resp.content
            content_type = img_resp.headers.get("content-type", "image/jpeg").split(";")[0]

        b64 = base64.b64encode(image_bytes).decode()
        data_url = f"data:{content_type};base64,{b64}"

        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        completion = await client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                        {
                            "type": "text",
                            "text": "Analyse this kirana store image and return the JSON object.",
                        },
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
    """
    Sync wrapper — used for unit tests and one-off analysis from bytes.
    Runs an event loop internally.
    """
    import asyncio

    async def _run():
        try:
            from app.config import settings
            from groq import AsyncGroq

            b64 = base64.b64encode(image_bytes).decode()
            data_url = f"data:{media_type};base64,{b64}"

            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            completion = await client.chat.completions.create(
                model=GROQ_VISION_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": data_url},
                            },
                            {
                                "type": "text",
                                "text": "Analyse this kirana store image and return the JSON object.",
                            },
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