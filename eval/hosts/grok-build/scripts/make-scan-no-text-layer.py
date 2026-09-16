#!/usr/bin/env python3
"""Place fixtures/incoming/scan-no-text-layer.pdf.

pdf-writer cannot emit a page with no text-showing operators and an image
(UC07 / stack #40). The committed specimen is an image XObject only (`/Im0 Do`).
There is no BT/ET/Tj/TJ.

Default: copy the committed specimen next to this recipe if needed.
Rebuild from pixels: pip3 install pillow  &&  python3 this.py --rebuild
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPECIMEN = ROOT / "fixtures" / "incoming" / "scan-no-text-layer.pdf"


def copy_committed(dest: Path) -> None:
    if not SPECIMEN.exists():
        raise SystemExit(
            f"committed specimen missing: {SPECIMEN}\n"
            "git pull, or rebuild with: pip3 install pillow && python3 "
            f"{Path(__file__).name} --rebuild"
        )
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.resolve() != SPECIMEN.resolve():
        shutil.copy2(SPECIMEN, dest)
        print(f"copied {SPECIMEN} -> {dest} ({dest.stat().st_size} bytes)")
        return
    print(f"using committed specimen {dest} ({dest.stat().st_size} bytes)")


def rebuild(dest: Path) -> None:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        raise SystemExit(
            "Pillow is not installed. The committed specimen does not need it:\n"
            f"  {SPECIMEN}\n"
            "To rebuild the pixels: pip3 install pillow"
        ) from None

    import random
    from io import BytesIO

    fonts = [
        "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc",
        "/System/Library/Fonts/Hiragino Serif.ttc",
        "/Library/Fonts/NotoSerifCJKjp-Regular.otf",
        str(Path.home() / "workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-writer-mcp/NotoSansJP-Regular.otf"),
    ]

    def pick_font(size: int):
        last = None
        for path in fonts:
            p = Path(path)
            if not p.exists():
                continue
            for index in (2, 0, 1):
                try:
                    return ImageFont.truetype(str(p), size, index=index)
                except OSError as exc:
                    last = exc
        raise SystemExit(f"CJK font not found. Tried: {fonts!r}. Last error: {last}")

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
    img = img.rotate(0.4, resample=Image.Resampling.BICUBIC, fillcolor=(242, 239, 230))
    buf = BytesIO()
    img.save(buf, "JPEG", quality=62, optimize=True)
    jpeg = buf.getvalue()
    iw, ih = img.size
    page_w, page_h = 595.28, 841.89
    encoded = jpeg.hex().encode("ascii")
    wrapped = b"\n".join(encoded[i : i + 80] for i in range(0, len(encoded), 80)) + b">\n"
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
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(text)
    print(f"rebuilt {dest} ({len(text)} bytes)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=SPECIMEN,
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="redraw the page with Pillow (not required for the eval)",
    )
    args = parser.parse_args()
    if args.rebuild:
        rebuild(args.output)
    else:
        copy_committed(args.output)


if __name__ == "__main__":
    main()
