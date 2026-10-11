import random
import subprocess
import yaml
from fractions import Fraction
from pathlib import Path

from bs4 import BeautifulSoup
from PIL import Image
from PIL.ExifTags import Base, IFD


THUMB_SIZE_PX = 1200

ASSETS_DIR = Path("photos/assets/")
HTML_DIR = Path("photos/html/")
THUMBS_DIR = Path("photos/thumbnails/")

TPL_DIR = Path("_templates/")
PHOTO_TPL_PATH = TPL_DIR / "photo.tpl"
PHOTO_TPL = PHOTO_TPL_PATH.read_text()
MAIN_TPL_PATH = TPL_DIR / "photography.tpl"
MAIN_TPL = MAIN_TPL_PATH.read_text()
MAIN_LIST_TPL_PATH = TPL_DIR / "photos.tpl"
MAIN_LIST_TPL = MAIN_LIST_TPL_PATH.read_text()

MAIN_HTML_PATH = Path("photography.html")
MAIN_LIST_HTML_PATH = Path("photos.html")

PHOTO_ID_KEY = r"{PHOTO_ID}"
PHOTO_FILE_KEY = r"{PHOTO_FILE}"
TITLE_KEY = r"{TITLE}"
THUMB_FILE_KEY = r"{THUMB_FILE}"
THUMB_WIDTH_KEY = r"{THUMB_WIDTH}"
THUMB_HEIGHT_KEY = r"{THUMB_HEIGHT}"
METADATA_KEY = r"{METADATA}"
LONG_DESC_KEY = r"{LONG_DESC}"

PHOTO_PILE_ITEMS_KEY = r"{PHOTO_PILE_ITEMS}"
SCROLL_TRACK_ITEMS_KEY = r"{SCROLL_TRACK_ITEMS}"

PHOTO_LIST_KEY = r"{PHOTO_LIST}"

_KEEP_EXIF_TAGS = {
    # Orientation
    Base.Orientation,

    # Camera
    Base.Make,
    Base.Model,
    Base.LensModel,

    # Dates
    Base.DateTimeOriginal,

    # Exposure
    Base.ExposureTime,
    Base.FNumber,
    Base.ISOSpeedRatings,
    Base.FocalLength,
    Base.Flash,
    Base.ExposureBiasValue,
    Base.FocalLengthIn35mmFilm,

    # Colour information
    Base.ColorSpace,
    Base.WhiteBalance,
    Base.LightSource,
}

# Strip unimportant EXIF tags
print("Sanitizing EXIF tags using exiftool")
subprocess.run([
    "exiftool",
    "-r",
    "-overwrite_original",
    "-all=",
    "--icc_profile:all",
    "-tagsFromFile", "@",
    "-ColorSpaceTags",
    "-Orientation",
    "-Make",
    "-Model",
    "-DateTimeOriginal",
    "-ExposureTime",
    "-FNumber",
    "-ISO",
    "-FocalLength",
    "-LensModel",
    "photos/",
], check=True)

html_str_paths = []

seen_ids = set()
photo_pile_items = []
scroll_track_items = []
photo_list_items = []
for fi in ASSETS_DIR.iterdir():
    if not fi.suffix == ".yaml":
        continue

    photo_id = fi.stem
    if photo_id in seen_ids:
        raise KeyError(f"duplicate photos with ID {photo_id}")
    seen_ids.add(photo_id)

    photo_jpeg = [
        path for path in ASSETS_DIR.glob(f"{photo_id}.*")
        if path.suffix.lower() in {".jpg", ".jpeg"}
    ][0]

    with open(fi) as f:
        photo_yaml = yaml.safe_load(f)

    title = photo_yaml.get("title", "untitled")
    description = photo_yaml.get("description", "")
    desc_html = "<p>" + "</p>\n<p>".join(description.split("\n\n")) + "</p>"

    # Strip unimportant EXIF tags
    exif_tags = {}
    with Image.open(photo_jpeg) as img:
        exif = img.getexif()
        for tag, value in list(exif.items()):
            if tag in _KEEP_EXIF_TAGS:
                exif_tags[tag] = value
            elif tag != Base.ExifOffset:
                del exif[tag]
        camera_exif = exif.get_ifd(IFD.Exif)
        for tag, value in list(camera_exif.items()):
            if tag in _KEEP_EXIF_TAGS:
                exif_tags[tag] = value
            else:
                del camera_exif[tag]

        # Make low-resolution thumbnail for display on main page
        thumb_path = THUMBS_DIR / f"{photo_id}_thumb.jpg"
        if thumb_path.is_file():
            print("Overwriting thumbnail for", fi)
        else:
            print("Writing thumbnail for", fi)
        
        icc_profile = img.info.get("icc_profile")
        img.thumbnail((THUMB_SIZE_PX, THUMB_SIZE_PX))
        img.save(
            thumb_path,
            quality=85,
            icc_profile=icc_profile,
            exif=exif.tobytes(),
        )

    camera = exif_tags.get(Base.Model, '(unknown camera)').strip(' ')
    focal_length_mm = round(exif_tags.get(Base.FocalLength, 0))
    f_number = exif_tags.get(Base.FNumber, 0)
    exposure_time = Fraction(exif_tags.get(Base.ExposureTime, 0)).limit_denominator(50000)
    film_speed = exif_tags.get(Base.ISOSpeedRatings, 0)
    date_str = exif_tags.get(Base.DateTimeOriginal, "-/-/-").split(' ')[0].replace(':', '/')

    metadata = (
        f"[{date_str}]<br>\n"
        f"{camera} &mdash; {focal_length_mm}mm &mdash; <i>f</i>/{f_number} &mdash; {exposure_time}s &mdash; ISO {film_speed}"
    )

    # Format webpage for this photo
    photo_html = (
        PHOTO_TPL
        .replace(PHOTO_ID_KEY, photo_id)
        .replace(PHOTO_FILE_KEY, photo_jpeg.name)
        .replace(TITLE_KEY, title)
        .replace(THUMB_FILE_KEY, thumb_path.name)
        .replace(THUMB_WIDTH_KEY, str(img.width))
        .replace(THUMB_HEIGHT_KEY, str(img.height))
        .replace(METADATA_KEY, metadata)
        .replace(LONG_DESC_KEY, desc_html)
    )

    # Randomly remove all leaves from the tree except one
    soup = BeautifulSoup(photo_html, "html.parser")
    tree_svg = soup.find("svg", class_="tree")
    leaves = [
        rect for rect in tree_svg.find_all("rect")
        if "leaf" in rect.get("class", [])
    ]
    keep_leaf = random.choice(leaves)
    for leaf in leaves:
        if leaf is not keep_leaf:
            leaf.parent.decompose()
    photo_html = str(soup)
    photo_html_path = HTML_DIR / f"{photo_id}.html"
    html_str_paths.append((photo_html, photo_html_path))

    # Generate corresponding list items for main pages
    photo_pile_items.append(
        f'<div id="{photo_id}" class="photo-wrapper">'
        f'<a class="photo" href="photos/{photo_html_path.name}">'
        f'<img src="{thumb_path}"/>'
        '<div class="photo-back"></div>'
        '</a>'
        '</div>'
    )
    scroll_track_items.append(
        f'<div class="photo-trigger" data-photo="{photo_id}"></div>'
    )
    photo_list_items.append(
        f'<li><a href="photos/{photo_html_path.name}">{date_str}: {title} ({photo_id})</a></li>'
    )

main_html = (
    MAIN_TPL
    .replace(PHOTO_PILE_ITEMS_KEY, "\n".join(photo_pile_items))
    .replace(SCROLL_TRACK_ITEMS_KEY, "\n".join(scroll_track_items))
)
html_str_paths.append((main_html, MAIN_HTML_PATH))

main_list_html = MAIN_LIST_TPL.replace(
    PHOTO_LIST_KEY, "\n".join(sorted(photo_list_items, reverse=True))
)
html_str_paths.append((main_list_html, MAIN_LIST_HTML_PATH))

# Write HTML files
for html_str, html_path in html_str_paths:
    if html_path.is_file():
        print("Overwriting", html_path)
    else:
        print("Writing", html_path)
    html_path.write_text(html_str)
