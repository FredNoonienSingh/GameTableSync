import os
import hashlib
import requests
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

# Matches S3_ENDPOINT in docker-compose.yaml (with S3_ENDPOINT_URL fallback)
S3_ENDPOINT = (
    os.environ.get("S3_ENDPOINT")
    or os.environ.get("S3_ENDPOINT_URL")
    or "http://seaweedfs:8333"
)
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY", "gts_admin_key")
S3_SECRET_KEY = os.environ.get(
    "S3_SECRET_KEY",
    "5842e55aa3b78d83ac1a0131051ccc141ffca36d6c640ad404544c7ac16d8cf3",
)
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "gts-media")
S3_REGION = os.environ.get("S3_REGION", "us-east-1")

# By default, serve via "/api/media" so it works automatically through Next.js rewrites and Nginx
S3_PUBLIC_URL = os.environ.get("S3_PUBLIC_URL", "/api/media").rstrip("/")


def get_s3_client():
    """Returns a configured boto3 S3 client for SeaweedFS."""
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            connect_timeout=5,
            read_timeout=10,
        ),
    )


def ensure_bucket_exists(s3_client=None) -> bool:
    """Ensures the 'gts-media' bucket exists in SeaweedFS."""
    client = s3_client or get_s3_client()
    try:
        client.head_bucket(Bucket=S3_BUCKET_NAME)
        return True
    except ClientError:
        try:
            client.create_bucket(Bucket=S3_BUCKET_NAME)
            return True
        except Exception as e:
            print(f"WARN [SeaweedFS S3]: Could not create bucket '{S3_BUCKET_NAME}': {e}")
            return False


def upload_bytes_to_s3(data: bytes, object_key: str, content_type: str = "image/png") -> str | None:
    """Uploads raw bytes to SeaweedFS S3 and returns the public browser URL."""
    client = get_s3_client()
    ensure_bucket_exists(client)
    clean_key = object_key.lstrip("/")
    try:
        client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=clean_key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000",
        )
        return f"{S3_PUBLIC_URL}/{clean_key}"
    except Exception as e:
        print(f"ERROR [SeaweedFS S3]: Failed to upload '{clean_key}': {e}")
        return None


def get_object_from_s3(object_key: str) -> tuple[bytes | None, str | None]:
    """Fetches an object from SeaweedFS S3 (used by the /api/media/<path> route)."""
    client = get_s3_client()
    clean_key = object_key.lstrip("/")
    try:
        resp = client.get_object(Bucket=S3_BUCKET_NAME, Key=clean_key)
        body = resp["Body"].read()
        content_type = resp.get("ContentType", "application/octet-stream")
        return body, content_type
    except Exception:
        return None, None


def mirror_remote_image_to_s3(source_url: str, key_prefix: str) -> str | None:
    """
    Downloads an external image (e.g., from Discord CDN) and stores it permanently in SeaweedFS.
    Falls back to the original source_url if SeaweedFS is temporarily unreachable.
    """
    if not source_url:
        return None

    try:
        resp = requests.get(source_url, timeout=8)
        if not resp.ok or not resp.content:
            return source_url

        content_type = resp.headers.get("Content-Type", "image/png").split(";")[0].strip()
        ext = "png"
        if "gif" in content_type or ".gif" in source_url:
            ext = "gif"
            content_type = "image/gif"
        elif "webp" in content_type or ".webp" in source_url:
            ext = "webp"
            content_type = "image/webp"
        elif "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"
            content_type = "image/jpeg"

        digest = hashlib.sha256(resp.content).hexdigest()[:12]
        object_key = f"{key_prefix.strip('/')}/{digest}.{ext}"

        s3_url = upload_bytes_to_s3(resp.content, object_key, content_type=content_type)
        return s3_url or source_url
    except Exception as e:
        print(f"WARN [SeaweedFS S3]: Mirroring failed for '{source_url}', falling back to CDN URL: {e}")
        return source_url