# app/utils/device.py
from fastapi import Request

def extract_ip(request: Request) -> str:
    # Try common reverse-proxy headers first, then fallback to client host
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        # X-Forwarded-For can contain a list of IPs
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip
    client = request.client
    if client:
        return client.host
    return "unknown"

def extract_device_info(request: Request) -> dict:
    """
    Very small UA parsing for device_name + device_os.
    If you want richer parsing, install `user-agents` or similar later.
    """
    ua = request.headers.get("user-agent", "unknown").lower()

    # Basic OS detection
    if "windows" in ua:
        os = "Windows"
    elif "macintosh" in ua or "mac os" in ua or "macos" in ua:
        os = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os = "iOS"
    elif "android" in ua:
        os = "Android"
    elif "linux" in ua:
        os = "Linux"
    else:
        os = "Unknown"

    # Basic browser/device
    if "chrome" in ua and "safari" in ua:
        device = "Chrome"
    elif "safari" in ua and "chrome" not in ua:
        device = "Safari"
    elif "firefox" in ua:
        device = "Firefox"
    elif "edg" in ua or "edge" in ua:
        device = "Edge"
    elif "curl" in ua:
        device = "Curl"
    else:
        device = "Browser"

    device_name = f"{device} on {os}"
    return {"device_name": device_name, "device_os": os, "user_agent": request.headers.get("user-agent", "")}
