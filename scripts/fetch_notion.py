import html
import json
import os
import re
import urllib.parse
import urllib.request

NOTION_TOKEN = os.environ["NOTION_TOKEN"]
DATABASE_ID = os.environ["NOTION_DATABASE_ID"]
NOTION_VERSION = "2022-06-28"


def notion_request(url, method="GET", payload=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {NOTION_TOKEN}")
    req.add_header("Notion-Version", NOTION_VERSION)
    req.add_header("Content-Type", "application/json")

    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    with urllib.request.urlopen(req, data=data) as response:
        return json.loads(response.read().decode("utf-8"))


def query_database():
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    results = []
    next_cursor = None

    while True:
        payload = {}
        if next_cursor:
            payload["start_cursor"] = next_cursor

        data = notion_request(url, method="POST", payload=payload)
        results.extend(data.get("results", []))

        if not data.get("has_more"):
            break

        next_cursor = data.get("next_cursor")

    return results


def get_block_children(block_id):
    url = f"https://api.notion.com/v1/blocks/{block_id}/children?page_size=100"
    results = []
    next_cursor = None

    while True:
        final_url = url
        if next_cursor:
            final_url += f"&start_cursor={urllib.parse.quote(next_cursor)}"

        data = notion_request(final_url)
        results.extend(data.get("results", []))

        if not data.get("has_more"):
            break

        next_cursor = data.get("next_cursor")

    return results


def plain_text_from_rich_text(rich_text):
    if not isinstance(rich_text, list):
        return ""
    return "".join((part or {}).get("plain_text", "") for part in rich_text)


def rich_text_to_html(rich_text):
    parts = []

    for item in rich_text or []:
        if not isinstance(item, dict):
            continue

        text = html.escape(item.get("plain_text", ""))
        annotations = item.get("annotations") or {}

        if annotations.get("code"):
            text = f"<code>{text}</code>"
        if annotations.get("bold"):
            text = f"<strong>{text}</strong>"
        if annotations.get("italic"):
            text = f"<em>{text}</em>"
        if annotations.get("strikethrough"):
            text = f"<s>{text}</s>"
        if annotations.get("underline"):
            text = f"<u>{text}</u>"

        href = item.get("href")
        if href:
            text = (
                f'<a href="{html.escape(href)}" target="_blank" '
                f'rel="noopener noreferrer">{text}</a>'
            )

        parts.append(text)

    return "".join(parts)


def youtube_embed(url):
    if not url:
        return None

    patterns = [
        r"youtube\.com/watch\?v=([^&]+)",
        r"youtu\.be/([^?&]+)",
        r"youtube\.com/embed/([^?&]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            return f'''
<div class="ratio ratio-16x9 my-4">
  <iframe src="https://www.youtube.com/embed/{video_id}" title="YouTube video" allowfullscreen loading="lazy"></iframe>
</div>
'''.strip()

    return None


def miro_embed(url):
    safe_url = html.escape(url)
    return f'''
<div class="ratio ratio-16x9 my-4">
  <iframe src="{safe_url}" title="Miro embed" loading="lazy"></iframe>
</div>
'''.strip()


def block_to_html(block):
    if not isinstance(block, dict):
        return ""

    block_type = block.get("type")
    if not block_type:
        return ""

    value = block.get(block_type) or {}

    if block_type == "paragraph":
        return f"<p>{rich_text_to_html(value.get('rich_text') or [])}</p>"

    if block_type == "heading_1":
        return f"<h1>{rich_text_to_html(value.get('rich_text') or [])}</h1>"

    if block_type == "heading_2":
        return f"<h2>{rich_text_to_html(value.get('rich_text') or [])}</h2>"

    if block_type == "heading_3":
        return f"<h3>{rich_text_to_html(value.get('rich_text') or [])}</h3>"

    if block_type == "bulleted_list_item":
        return f"<li>{rich_text_to_html(value.get('rich_text') or [])}</li>"

    if block_type == "numbered_list_item":
        return f"<li>{rich_text_to_html(value.get('rich_text') or [])}</li>"

    if block_type == "image":
        image_data = value.get("file") or value.get("external") or {}
        url = image_data.get("url", "")
        caption = rich_text_to_html(value.get("caption") or [])
        if not url:
            return ""
        return f'''
<figure class="my-4">
  <img src="{html.escape(url)}" class="img-fluid rounded-4 w-100" alt="">
  {f"<figcaption class='small mt-2'>{caption}</figcaption>" if caption else ""}
</figure>
'''.strip()

    if block_type == "video":
        video_data = value.get("file") or value.get("external") or {}
        url = video_data.get("url", "")
        if not url:
            return ""
        return f'''
<div class="my-4">
  <video class="w-100 rounded-4" controls playsinline>
    <source src="{html.escape(url)}">
  </video>
</div>
'''.strip()

    if block_type == "embed":
        url = value.get("url", "")
        if not url:
            return ""

        yt = youtube_embed(url)
        if yt:
            return yt

        if "miro.com" in url:
            return miro_embed(url)

        return f'''
<p class="my-3">
  <a href="{html.escape(url)}" target="_blank" rel="noopener noreferrer">{html.escape(url)}</a>
</p>
'''.strip()

    if block_type == "bookmark":
        url = value.get("url", "")
        if not url:
            return ""
        return f'''
<p class="my-3">
  <a href="{html.escape(url)}" target="_blank" rel="noopener noreferrer">{html.escape(url)}</a>
</p>
'''.strip()

    if block_type == "divider":
        return "<hr>"

    return ""


def blocks_to_html(blocks):
    html_parts = []
    list_buffer = []
    list_type = None

    def flush_list():
        nonlocal list_buffer, list_type, html_parts
        if list_buffer:
            tag = "ul" if list_type == "bulleted_list_item" else "ol"
            html_parts.append(f"<{tag}>{''.join(list_buffer)}</{tag}>")
            list_buffer = []
            list_type = None

    for block in blocks or []:
        if not isinstance(block, dict):
            continue

        block_type = block.get("type")

        if block_type in ["bulleted_list_item", "numbered_list_item"]:
            if list_type and list_type != block_type:
                flush_list()

            list_type = block_type
            rendered = block_to_html(block)
            if rendered:
                list_buffer.append(rendered)
        else:
            flush_list()
            rendered = block_to_html(block)
            if rendered:
                html_parts.append(rendered)

    flush_list()
    return "\n".join(html_parts)


def get_property(props, name):
    value = props.get(name)
    return value if isinstance(value, dict) else {}


def get_title(props, name):
    prop = get_property(props, name)
    return plain_text_from_rich_text(prop.get("title") or [])


def get_rich_text(props, name):
    prop = get_property(props, name)
    return plain_text_from_rich_text(prop.get("rich_text") or [])


def get_checkbox(props, name):
    prop = get_property(props, name)
    return bool(prop.get("checkbox", False))


def get_date(props, name):
    prop = get_property(props, name)
    date_obj = prop.get("date") or {}
    if not isinstance(date_obj, dict):
        return None
    return date_obj.get("start")


def get_multi_select(props, name):
    prop = get_property(props, name)
    values = prop.get("multi_select") or []
    if not isinstance(values, list):
        return []

    result = []
    for item in values:
        if isinstance(item, dict):
            name_value = item.get("name")
            if name_value:
                result.append(name_value)
    return result


def get_files_first_url(props, name):
    prop = get_property(props, name)
    files = prop.get("files") or []
    if not isinstance(files, list) or not files:
        return None

    first = files[0] or {}
    if not isinstance(first, dict):
        return None

    file_obj = first.get("file") or {}
    external_obj = first.get("external") or {}

    return file_obj.get("url") or external_obj.get("url")


def extract_item(page):
    if not isinstance(page, dict):
        return {}

    props = page.get("properties") or {}

    title = get_title(props, "Title")
    slug = get_rich_text(props, "Slug")
    summary = get_rich_text(props, "Summary")
    date = get_date(props, "Dato")
    published = get_checkbox(props, "Published")
    topic = get_multi_select(props, "Topic")
    focus = get_multi_select(props, "Focus")
    cover = get_files_first_url(props, "Cover")

    page_id = page.get("id")
    content_blocks = get_block_children(page_id) if page_id else []
    content_html = blocks_to_html(content_blocks)

    return {
        "id": page_id,
        "title": title,
        "slug": slug,
        "summary": summary,
        "date": date,
        "published": published,
        "topic": topic,
        "focus": focus,
        "cover": cover,
        "content_html": content_html,
    }


def main():
    pages = query_database()
    items = [extract_item(page) for page in pages if isinstance(page, dict)]

    with open("insights.json", "w", encoding="utf-8") as f:
        json.dump({"results": items}, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()