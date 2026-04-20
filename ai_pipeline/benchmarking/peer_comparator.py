"""
Peer Comparator
Finds N nearest completed assessments within 2km radius and
computes a percentile rank for this store against its peers.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))


class PeerComparator:
    async def compare(self, lat: float, lng: float, signals: dict) -> dict:
        try:
            from app.db.repositories.assessment_repo import AssessmentRepository
            repo = AssessmentRepository()
            peers = await repo.find_nearby_completed(lat, lng, radius_m=2000, limit=10)
        except Exception as e:
            print(f"[peer_comparator] DB error: {e}")
            peers = []

        if not peers:
            return self._no_peers()

        peer_sdis = [p.get("shelf_density_index", 0.5) for p in peers]
        peer_footfalls = [p.get("geo_footfall_score", 50) for p in peers]

        this_sdi = signals.get("shelf_density_index", 0.5)
        this_footfall = signals.get("geo_footfall_score", 50)

        # Percentile rank by SDI
        below = sum(1 for s in peer_sdis if s < this_sdi)
        percentile = round((below / len(peers)) * 100, 1)

        return {
            "percentile": percentile,
            "n_peers": len(peers),
            "avg_sdi": round(sum(peer_sdis) / len(peers), 3),
            "avg_footfall": round(sum(peer_footfalls) / len(peers), 1),
        }

    @staticmethod
    def _no_peers() -> dict:
        return {
            "percentile": 50.0,
            "n_peers": 0,
            "avg_sdi": 0.0,
            "avg_footfall": 0.0,
        }