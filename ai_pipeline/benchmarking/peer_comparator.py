"""
Peer Comparator
Finds N nearest completed assessments within 2km radius and
computes a percentile rank for this store against its peers.
"""
import sys
import os
import logging
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

logger = logging.getLogger(__name__)


class PeerComparator:
    async def compare(self, lat: float, lng: float, signals: dict) -> dict:
        try:
            from app.db.repositories.assessment_repo import AssessmentRepository
            repo = AssessmentRepository()
            peers = await repo.find_nearby_completed(lat, lng, radius_m=2000, limit=10)
        except Exception as e:
            logger.warning(f"[peer_comparator] DB query failed: {e}")
            peers = []

        if not peers:
            return self._no_peers()

        # Filter out peers with missing/invalid signal values
        valid_peers = [
            p for p in peers
            if p.get("shelf_density_index") is not None
        ]

        if not valid_peers:
            return self._no_peers()

        peer_sdis = [float(p.get("shelf_density_index", 0.5)) for p in valid_peers]
        peer_footfalls = [float(p.get("geo_footfall_score", 50)) for p in valid_peers]

        this_sdi = float(signals.get("shelf_density_index", 0.5))
        this_footfall = float(signals.get("geo_footfall_score", 50))

        # Percentile rank by SDI
        below = sum(1 for s in peer_sdis if s < this_sdi)
        percentile = round((below / len(valid_peers)) * 100, 1)

        return {
            "percentile": percentile,
            "n_peers": len(valid_peers),
            "avg_sdi": round(sum(peer_sdis) / len(valid_peers), 3),
            "avg_footfall": round(sum(peer_footfalls) / len(valid_peers), 1),
        }

    @staticmethod
    def _no_peers() -> dict:
        return {
            "percentile": 50.0,
            "n_peers": 0,
            "avg_sdi": 0.0,
            "avg_footfall": 0.0,
        }