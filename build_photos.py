import random
import yaml
from pathlib import Path

from bs4 import BeautifulSoup
from PIL import Image, ImageOps


THUMB_SIZE_PX = 800

ASSETS_DIR = Path("photos/assets/")
HTML_DIR = Path("photos/html/")
THUMBS_DIR = Path("photos/thumbnails/")

TPL_DIR = Path("_templates/")
PHOTO_TPL_PATH = TPL_DIR / "photo.tpl"
MAIN_TPL_PATH = TPL_DIR / "photography.tpl"
MAIN_HTML_PATH = Path("photography.html")

PHOTO_TPL = PHOTO_TPL_PATH.read_text()
MAIN_TPL = MAIN_TPL_PATH.read_text()

PHOTO_ID_KEY = r"{PHOTO_ID}"
PHOTO_FILE_KEY = r"{PHOTO_FILE}"
TITLE_KEY = r"{TITLE}"
THUMB_FILE_KEY = r"{THUMB_FILE}"
THUMB_WIDTH_KEY = r"{THUMB_WIDTH}"
THUMB_HEIGHT_KEY = r"{THUMB_HEIGHT}"
LONG_DESC_KEY = r"{LONG_DESC}"

PHOTO_PILE_ITEMS_KEY = r"{PHOTO_PILE_ITEMS}"
SCROLL_TRACK_ITEMS_KEY = r"{SCROLL_TRACK_ITEMS}"

seen_ids = set()
photo_pile_items = []
scroll_track_items = []
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
    desc_html = "<p>" + "</p>\n<p>".join(description.split("\n \n")) + "</p>"

    # Make low-resolution thumbnail for display on main page
    thumb_path = THUMBS_DIR / f"{photo_id}_thumb.jpg"
    if thumb_path.is_file():
        print("Overwriting thumbnail for", fi)
    else:
        print("Writing thumbnail for", fi)
    img = Image.open(photo_jpeg)
    ImageOps.exif_transpose(img)
    img.thumbnail((THUMB_SIZE_PX, THUMB_SIZE_PX))
    img.save(thumb_path, quality=85)

    # Format webpage for this photo
    photo_html = (
        PHOTO_TPL
        .replace(PHOTO_ID_KEY, photo_id)
        .replace(PHOTO_FILE_KEY, photo_jpeg.name)
        .replace(TITLE_KEY, title)
        .replace(THUMB_FILE_KEY, thumb_path.name)
        .replace(THUMB_WIDTH_KEY, str(img.width))
        .replace(THUMB_HEIGHT_KEY, str(img.height))
        .replace(LONG_DESC_KEY, desc_html)
    )

    # Randomly remove all leaves from the tree except one
    soup = BeautifulSoup(photo_html, "html.parser")
    tree_svg = soup.find("svg", class_="tree")
    leaves = [
        rect for rect in tree_svg.find_all("rect")
        if "leaf" in rect.get("class", [])
    ]
    keep = random.choice(leaves)
    for leaf in leaves:
        if leaf is not keep:
            leaf.parent.decompose()
    photo_html = str(soup)

    # Write html page for this photo
    photo_html_path = HTML_DIR / f"{photo_id}.html"
    if photo_html_path.is_file():
        print("Overwriting", photo_html_path)
    else:
        print("Writing", photo_html_path)
    photo_html_path.write_text(photo_html)

    # Generate corresponding scroll track and photo pile items
    photo_pile_items.append(
        f'<div id="{photo_id}" class="photo-wrapper">'
        f'<a class="photo" href="photos/{photo_html_path.name}">'
        f'<img src="{thumb_path}"/>'
        '</a>'
        '</div>'
    )
    scroll_track_items.append(
        f'<div class="photo-trigger" data-photo="{photo_id}"></div>'
    )

main_html = (
    MAIN_TPL
    .replace(PHOTO_PILE_ITEMS_KEY, "\n".join(photo_pile_items))
    .replace(SCROLL_TRACK_ITEMS_KEY, "\n".join(scroll_track_items))
)
if MAIN_HTML_PATH.is_file():
    print("Overwriting", MAIN_HTML_PATH)
else:
    print("Writing", MAIN_HTML_PATH)
MAIN_HTML_PATH.write_text(main_html)
