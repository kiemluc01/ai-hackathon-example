import re
import unicodedata


def slugify(value: str, fallback: str = "item") -> str:
    """Turn an arbitrary label into a filesystem- and URL-safe slug."""
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_only).strip("-").lower()
    return re.sub(r"-{2,}", "-", slug) or fallback
