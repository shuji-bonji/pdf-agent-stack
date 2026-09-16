#!/usr/bin/env python3
"""Build fixtures/incoming/scan-no-text-layer.pdf.

pdf-writer cannot emit a page with no text-showing operators and an image
(UC07 / stack #40). This script draws Japanese dummy terms onto a bitmap and
wraps the JPEG as the only page content (`/Im0 Do`). There is no BT/ET/Tj/TJ.

Requires: Pillow, and a CJK font (Noto Serif CJK or Noto Sans CJK).
"""
from __future__ import annotations

import argparse
import random
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONTS = [
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc",
    "/System/Library/Fonts/Hiragino Serif.ttc",
    "/Library/Fonts/NotoSerifCJKjp-Regular.otf",
    "/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-writer-mcp/NotoSansJP-Regular.otf",
]


def pick_font(size: int) -> ImageFont.FreeTypeFont:
    last = None
    for path in FONTS:
        p = Path(path)
        if not p.exists():
            continue
        for index in (2, 0, 1):
            try:
                return ImageFont.truetype(str(p), size, index=index)
            except OSError as exc:
                last = exc
    raise SystemExit(f"CJK font not found. Tried: {FONTS!r}. Last error: {last}")


def render_page() -> Image.Image:
    width, height = 744, 1052
    img = Image.new("RGB", (width, height), (242, 239, 230))
    draw = ImageDraw.Draw(img)
    rng = random.Random(40)
    pixels = img.load()
    assert pixels is not None
    for _ in range(1800):
        x, y = rng.randint(0, width - 1), rng.randint(0, height - 1)
        tone = 220 + rng.randint(-18, 12)
        pixels[x, y] = (tone, max(0, tone - 3), max(0, tone - 10))

    title = pick_font(36)
    body = pick_font(22)
    small = pick_font(16)
    margin = 64
    y = 80
    draw.text((margin, y), "スキャン相当（テキスト層なし）", font=title, fill=(28, 28, 28))
    y += 70
    draw.line((margin, y, width - margin, y), fill=(40, 40, 40), width=2)
    y += 36
    for line in (
        "このページは画素だけである。",
        "Tj / TJ / ' / \" はコンテンツストリームに無い。",
        "支払条件は月末締めの翌月末払いである。",
        "再委託は原則禁止である。",
        "検収日は納品の翌営業日から十日以内である。",
        "OCR はしない。読むなら render_page の画像から視覚読みする。",
    ):
        draw.text((margin, y), line, font=body, fill=(32, 32, 32))
        y += 40
    y += 24
    draw.text(
        (margin, y),
        "UC07 / stack #40  —  writer では作らない標本",
        font=small,
        fill=(80, 80, 80),
    )
    return img.rotate(0.4, resample=Image.Resampling.BICUBIC, fillcolor=(242, 239, 230))


def jpeg_bytes(img: Image.Image) -> bytes:
    buf = BytesIO()
    img.save(buf, "JPEG", quality=62, optimize=True)
    return buf.getvalue()


def wrap_hex(data: bytes) -> bytes:
    encoded = data.hex().encode("ascii")
    return b"\n".join(encoded[i : i + 80] for i in range(0, len(encoded), 80)) + b">\n"


def build_pdf(jpeg: bytes, image_size: tuple[int, int]) -> bytes:
    iw, ih = image_size
    page_w, page_h = 595.28, 841.89
    wrapped = wrap_hex(jpeg)
    contents = f"q\n{page_w:.2f} 0 0 {page_h:.2f} 0 0 cm\n/Im0 Do\nQ\n".encode("ascii")
    objects = {
        1: b"<< /Type /Catalog /Pages 2 0 R >>",
        2: b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        3: (
            b"<< /Type /Page /Parent 2 0 R "
            b"/MediaBox [0 0 595.28 841.89] "
            b"/Resources << /XObject << /Im0 4 0 R >> >> "
            b"/Contents 5 0 R >>"
        ),
        4: (
            f"<< /Type /XObject /Subtype /Image /Width {iw} /Height {ih} "
            f"/ColorSpace /DeviceRGB /BitsPerComponent 8 "
            f"/Filter [/ASCIIHexDecode /DCTDecode] /Length {len(wrapped)} >>\n"
            f"stream\n"
        ).encode("ascii")
        + wrapped
        + b"endstream",
        5: f"<< /Length {len(contents)} >>\nstream\n".encode("ascii") + contents + b"endstream",
    }
    out = bytearray(b"%PDF-1.4\n% scan-no-text-layer specimen for UC07\n")
    offsets: dict[int, int] = {}
    for number in range(1, 6):
        offsets[number] = len(out)
        out += f"{number} 0 obj\n".encode("ascii") + objects[number] + b"\nendobj\n"
    startxref = len(out)
    out += b"xref\n0 6\n0000000000 65535 f \n"
    for number in range(1, 6):
        out += f"{offsets[number]:010d} 00000 n \n".encode("ascii")
    out += (
        f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{startxref}\n%%EOF\n"
    ).encode("ascii")
    text = bytes(out)
    if b"Tj" in text or b"TJ" in text or b"BT" in text:
        raise RuntimeError("text-showing operator leaked into the specimen")
    text.decode("ascii")
    return text


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "fixtures" / "incoming" / "scan-no-text-layer.pdf",
    )
    args = parser.parse_args()
    image = render_page()
    pdf = build_pdf(jpeg_bytes(image), image.size)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(pdf)
    print(f"wrote {args.output} ({len(pdf)} bytes)")


if __name__ == "__main__":
    main()
