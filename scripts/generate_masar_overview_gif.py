#!/usr/bin/env python3
"""Render a lightweight, bilingual Masar Green overview GIF with ImageMagick and FFmpeg."""

import html
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/assets/masar-green-overview.gif"
WIDTH, HEIGHT = 960, 540
BG, INK, GREEN, LIME = "#F5F3EC", "#183B35", "#1B6654", "#D6ED74"
MUTED, BORDER, PALE, GOLD = "#64736D", "#DCE0D6", "#E8EFE6", "#F0E9D7"
MARK_PATH = "M138 328 C105 226 190 170 275 168 C330 166 356 133 366 109 C409 263 345 365 245 357 C198 354 175 341 167 326"
STEM_PATH = "M142 401 C162 310 212 257 304 222 M197 300 L190 251 M227 269 L281 282"


def text(x, y, content, size=22, color=INK, weight=400, anchor="start", family="Manrope, 'Noto Sans Arabic', 'DejaVu Sans', sans-serif"):
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{color}" '
        f'font-family="{family}" font-size="{size}" font-weight="{weight}">'
        f'{html.escape(content)}</text>'
    )


def mark(x, y, size=48):
    s = size / 512
    return (
        f'<g transform="translate({x} {y}) scale({s})">'
        f'<rect width="512" height="512" rx="150" fill="{GREEN}"/>'
        f'<path d="{MARK_PATH}" stroke="{LIME}" stroke-width="29" fill="none" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        f'<path d="{STEM_PATH}" stroke="{LIME}" stroke-width="26" fill="none" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        '</g>'
    )


def foundation(content, eyebrow):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
      <rect width="960" height="540" fill="{BG}"/>
      <circle cx="864" cy="76" r="157" fill="#E8EFE6"/>
      <circle cx="80" cy="484" r="119" fill="#EEECDD"/>
      <path d="M0 425 C150 407 268 439 396 419 S670 405 960 428" fill="none" stroke="#E2E8DC" stroke-width="2"/>
      {mark(58, 38, 44)}
      {text(114, 65, "MASAR GREEN", 16, INK, 750)}
      {text(114, 84, "مسار أخضر", 13, MUTED, 500, family="'Noto Sans Arabic', 'DejaVu Sans', sans-serif")}
      <rect x="792" y="47" width="110" height="30" rx="15" fill="{PALE}"/>
      {text(847, 67, eyebrow.upper(), 10, GREEN, 750, "middle")}
      <path d="M58 452 H902" stroke="{BORDER}" stroke-width="1.5"/>
      {text(58, 476, "CONCEPT DEMO · TRIPS AND REWARDS ARE SIMULATED · NOT AFFILIATED WITH RTA / NOL", 11, MUTED, 550)}
      {text(902, 501, "نموذج تجريبي · بيانات النقل والمكافآت افتراضية · غير تابع لـ RTA أو NOL", 11, MUTED, 500, "end", "'Noto Sans Arabic', 'DejaVu Sans', sans-serif")}
      {content}
    </svg>'''


def scene_brand():
    illustration = f'''<g transform="translate(692 274)">
      <circle r="117" fill="#E7EFE6"/><circle r="88" fill="none" stroke="#C8DACB" stroke-width="2"/>
      <circle r="59" fill="#F5F3EC" stroke="{GREEN}" stroke-width="3"/>
      <path d="M-112 11 C-61 10 -47 -44 0 -44 S54 32 112 30" fill="none" stroke="{GREEN}" stroke-width="4" stroke-dasharray="9 8"/>
      <circle cx="-112" cy="11" r="11" fill="{LIME}" stroke="{GREEN}" stroke-width="3"/>
      <circle cx="0" cy="-44" r="11" fill="{GREEN}"/><circle cx="112" cy="30" r="11" fill="{GOLD}" stroke="{GREEN}" stroke-width="3"/>
      <path d="{MARK_PATH}" transform="translate(-31 -31) scale(.12)" fill="none" stroke="{GREEN}" stroke-width="29" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="{STEM_PATH}" transform="translate(-31 -31) scale(.12)" fill="none" stroke="{GREEN}" stroke-width="26" stroke-linecap="round"/>
      <circle cx="92" cy="-93" r="5" fill="{GREEN}"/><circle cx="-94" cy="-83" r="4" fill="{LIME}"/>
    </g>'''
    copy = (
        text(68, 180, "Every journey", 48, INK, 760)
        + text(68, 237, "can move us forward.", 42, GREEN, 760)
        + text(70, 286, "Plan greener. Earn as you ride.", 21, MUTED, 520)
        + text(70, 326, "رحلات يومية أكثر استدامة.", 21, GREEN, 650, family="'Noto Sans Arabic', 'DejaVu Sans', sans-serif")
        + illustration
    )
    return foundation(copy, "YOUR EVERYDAY JOURNEY")


def scene_plan():
    copy = (
        text(64, 183, "Plan a", 47, INK, 760)
        + text(64, 239, "greener route.", 47, GREEN, 760)
        + text(66, 281, "Compare ways to travel", 20, MUTED, 520)
        + text(66, 308, "across your city.", 20, MUTED, 520)
        + text(66, 351, "خطّط لرحلة أكثر استدامة.", 20, GREEN, 630, family="'Noto Sans Arabic', 'DejaVu Sans', sans-serif")
        + f'''<rect x="457" y="111" width="435" height="286" rx="23" fill="#FFFFFF" stroke="{BORDER}" stroke-width="2"/>
        {text(487, 151, "PLAN A JOURNEY", 11, MUTED, 720)}
        {text(487, 192, "Your way across Dubai", 23, INK, 700)}
        <rect x="484" y="212" width="380" height="67" rx="13" fill="{BG}"/>
        <circle cx="511" cy="233" r="6" fill="{GREEN}"/><circle cx="511" cy="260" r="6" fill="{LIME}" stroke="{GREEN}" stroke-width="2"/>
        <path d="M511 240 V253" stroke="{GREEN}" stroke-width="2" stroke-dasharray="2 3"/>
        {text(530, 240, "From your location", 15, INK, 620)}
        {text(530, 266, "To your destination", 15, MUTED, 520)}
        <rect x="484" y="294" width="380" height="76" rx="15" fill="{PALE}"/>
        <circle cx="513" cy="331" r="17" fill="{GREEN}"/>
        {text(513, 337, "M", 15, "#FFFFFF", 760, "middle")}
        {text(540, 323, "Metro + walking", 17, INK, 700)}
        {text(540, 347, "A greener way to get there", 13, MUTED, 520)}
        <path d="M842 332 l6 6 l12 -14" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'''
    )
    return foundation(copy, "PLAN")


def scene_wallet():
    copy = (
        text(64, 184, "Earn as", 49, INK, 760)
        + text(64, 242, "you ride.", 49, GREEN, 760)
        + text(66, 289, "Greener trips earn", 20, MUTED, 520)
        + text(66, 316, "simulated Green Credits.", 20, MUTED, 520)
        + text(66, 357, "رحلاتك المستدامة تكسبك نقاطاً.", 18, GREEN, 630, family="'Noto Sans Arabic', 'DejaVu Sans', sans-serif")
        + f'''<rect x="471" y="109" width="421" height="285" rx="24" fill="{GREEN}"/>
        <circle cx="833" cy="153" r="22" fill="#FFFFFF" fill-opacity=".12"/>
        <path d="M825 157 C819 145 829 138 840 138 C838 151 834 158 826 157 M827 163 L836 150" fill="none" stroke="{LIME}" stroke-width="2.4" stroke-linecap="round"/>
        {text(510, 157, "GREEN WALLET", 12, "#D9E8D8", 730)}
        {text(510, 247, "100", 70, "#FFFFFF", 760)}
        {text(651, 244, "credits", 19, "#D9E8D8", 550)}
        <rect x="510" y="274" width="337" height="1" fill="#FFFFFF" fill-opacity=".22"/>
        <rect x="510" y="297" width="183" height="41" rx="12" fill="{LIME}"/>
        {text(601, 323, "AED 1 equivalent", 15, INK, 700, "middle")}
        {text(510, 369, "Illustrative rewards · no real funds move", 13, "#D9E8D8", 520)}'''
    )
    return foundation(copy, "GREEN CREDITS")


def scene_referrals():
    copy = (
        text(64, 185, "Invite a", 47, INK, 760)
        + text(64, 240, "friend. Grow", 43, GREEN, 760)
        + text(64, 291, "greener together.", 39, GREEN, 760)
        + text(66, 337, "Earn a one-time invite reward", 17, MUTED, 530)
        + text(66, 363, "after their first verified trip.", 17, MUTED, 530)
        + text(66, 393, "ادعُ صديقاً واكسب مكافأة.", 17, GREEN, 630, family="'Noto Sans Arabic', 'DejaVu Sans', sans-serif")
        + f'''<rect x="584" y="117" width="306" height="276" rx="22" fill="#FFFFFF" stroke="{BORDER}" stroke-width="2"/>
        <circle cx="647" cy="177" r="31" fill="{PALE}"/>
        <path d="M637 180 q10 -18 20 0 M632 193 q15 -20 30 0" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="818" cy="177" r="31" fill="#F1ECDF"/>
        <circle cx="818" cy="170" r="8" fill="{GREEN}"/>
        <path d="M803 192 q15 -20 30 0" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linecap="round"/>
        <path d="M690 178 H771 M760 168 L773 178 L760 188" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        {text(737, 231, "FIRST VERIFIED TRIP", 11, MUTED, 720, "middle")}
        <rect x="610" y="251" width="253" height="72" rx="15" fill="{PALE}"/>
        <circle cx="646" cy="287" r="19" fill="{LIME}"/>
        <path d="M646 276 v22 M636 287 h20" stroke="{GREEN}" stroke-width="3" stroke-linecap="round"/>
        {text(675, 289, "+100 credits", 25, INK, 760)}
        {text(737, 349, "Simulated reward · AED 1 equivalent", 13, MUTED, 520, "middle")}
        {text(737, 374, "Reward goes to the inviter.", 13, GREEN, 650, "middle")}'''
    )
    return foundation(copy, "REFER A FRIEND")


def build():
    converter = shutil.which("magick") or shutil.which("convert")
    ffmpeg = shutil.which("ffmpeg")
    if not converter or not ffmpeg:
        raise RuntimeError("Rendering requires ImageMagick (convert) and FFmpeg.")

    frames = [
        scene_brand(),
        scene_plan(),
        scene_wallet(),
        scene_referrals(),
        scene_brand(),
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="masar-gif-") as temporary:
        temp = Path(temporary)
        paths = []
        for index, svg in enumerate(frames):
            svg_path = temp / f"scene-{index}.svg"
            png_path = temp / f"scene-{index}.png"
            svg_path.write_text(svg, encoding="utf-8")
            subprocess.run(
                [converter, "-background", BG, str(svg_path), "-resize", f"{WIDTH}x{HEIGHT}!", "-depth", "8", str(png_path)],
                check=True,
            )
            paths.append(png_path)

        # The outro uses the same brand card as the opener, so looping is seamless.
        # Keep each card on screen long enough to read its copy.
        slides = paths
        fps, hold, fade = 12, 2.1, 0.36
        command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y"]
        for slide in slides:
            command += ["-loop", "1", "-framerate", str(fps), "-t", str(hold), "-i", str(slide)]

        filters = [f"[{i}:v]fps={fps},format=yuv444p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v{i}]" for i in range(len(slides))]
        prior = "v0"
        offset = hold - fade
        for i in range(1, len(slides)):
            out = f"x{i}"
            filters.append(f"[{prior}][v{i}]xfade=transition=fade:duration={fade}:offset={offset:.3f}[{out}]")
            prior = out
            offset += hold - fade
        filters.append(
            f"[{prior}]fps={fps},scale=800:-1:flags=lanczos,split[gif][palettein];"
            "[palettein]palettegen=max_colors=128:stats_mode=diff[palette];"
            "[gif][palette]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[out]"
        )
        command += ["-filter_complex", ";".join(filters), "-map", "[out]", "-loop", "0", str(OUTPUT)]
        subprocess.run(command, check=True)

    print(f"Created {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes).")


if __name__ == "__main__":
    build()
