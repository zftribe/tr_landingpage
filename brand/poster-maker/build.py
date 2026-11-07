"""Inline the poster engine, logo library and sample images into self-contained artifact pages.

Usage: python build.py <before_dir_or_-> <out_dir>
"""
import base64, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOGOS = os.path.join(HERE, "..", "logos")


def uri(path, mime=None):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = mime or {"svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}[ext]
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def assets():
    o = os.path.join(LOGOS, "ours")
    a = {
        "zftWhite": uri(os.path.join(o, "zft", "zft-wordmark-white.svg")),
        "zftBlack": uri(os.path.join(o, "zft", "zft-wordmark-black.svg")),
        "trWhite": uri(os.path.join(o, "trading-republic", "tr-mark-white.svg")),
        "trBlack": uri(os.path.join(o, "trading-republic", "tr-mark-black.svg")),
        "trGold": uri(os.path.join(o, "trading-republic", "tr-mark-gold.svg")),
        "zftCapsule": uri(os.path.join(o, "zft", "zft-capsule-gold.svg")),
    }
    pdir = os.path.join(LOGOS, "partners")
    for name in sorted(os.listdir(pdir)):
        for fn in sorted(os.listdir(os.path.join(pdir, name))):
            if fn.endswith((".png", ".svg")):
                a["p_" + name] = uri(os.path.join(pdir, name, fn))
                break
    # ZFT photo library (Codex renders), resized for the page
    ph = os.environ.get("PM_PHOTOS", "D:/Media/Claude Renders/poster-maker/photos")
    if os.path.isdir(ph):
        from PIL import Image
        import io
        for fn in sorted(os.listdir(ph)):
            if fn.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                im = Image.open(os.path.join(ph, fn)).convert("RGB"); im.thumbnail((1280, 1280))
                buf = io.BytesIO(); im.save(buf, "JPEG", quality=80, optimize=True)
                a["ph_" + os.path.splitext(fn)[0]] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    return a


def build(src, out, before_dir):
    html = open(os.path.join(HERE, "src", src), encoding="utf-8").read()
    js = open(os.path.join(HERE, "src", "pick-engine-v1.js" if src == "pick.html" else "posters.js"), encoding="utf-8").read()
    html = html.replace("/*GIF_JS*/", open(os.path.join(HERE, "src", "gif.js"), encoding="utf-8").read())
    html = html.replace("/*POSTERS_JS*/", js).replace("/*ASSETS_JSON*/", json.dumps(assets()))
    if "/*BEFORE_JSON*/" in html:
        before = {}
        for fn in os.listdir(before_dir):
            if fn.endswith(".jpg"):
                before[fn[:-4]] = uri(os.path.join(before_dir, fn))
        html = html.replace("/*BEFORE_JSON*/", json.dumps(before))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(html)
    print(out, round(len(html) / 1024), "KB")


SKELETON = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<meta name="robots" content="noindex,nofollow"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')


def build_standalone(out):
    """The same tool as a normal web page (for zeefreaks.io/posters, served by index.php after sign-in)."""
    tmp = out + ".tmp"
    build("studio.html", tmp, None)
    html = open(tmp, encoding="utf-8").read(); os.remove(tmp)
    open(out, "w", encoding="utf-8").write(SKELETON + html + "</body></html>\n")
    print(out, "standalone")


if __name__ == "__main__":
    if sys.argv[1] == "--standalone":
        build_standalone(sys.argv[2]); sys.exit(0)
    before_dir, out_dir = sys.argv[1], sys.argv[2]
    for src in sys.argv[3:] or ["pick.html"]:
        build(src, os.path.join(out_dir, src), before_dir)
