import os
import json
from html.parser import HTMLParser

# --- Simple HTML title extractor ---
class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = ""

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data.strip()

# --- Helper: format fallback filename into proper title ---
def format_title(name):
    # Remove .html extension
    name = os.path.splitext(name)[0]
    # Replace underscores with spaces
    name = name.replace('_', ' ')
    # Capitalize each word
    name = ' '.join(word.capitalize() for word in name.split())
    return name

# --- Paths ---
folder_path = "../saved-files"   # folder with your .html files
json_file = "./newsletters.json"  # output JSON

# --- Load existing JSON if it exists ---
if os.path.exists(json_file):
    with open(json_file, "r", encoding="utf-8") as f:
        try:
            newsletters = json.load(f)
        except json.JSONDecodeError:
            newsletters = []
else:
    newsletters = []

# Track existing filenames to avoid duplicates
existing_files = {n["filename"] for n in newsletters}

# --- Scan folder ---
new_files_count = 0
for filename in os.listdir(folder_path):
    if filename.lower().endswith(".html"):
        filepath = os.path.join(folder_path, filename)
        if filepath in existing_files:
            continue  # skip if already in JSON

        # Extract title from HTML
        with open(filepath, "r", encoding="utf-8") as f:
            html_content = f.read()
        parser = TitleParser()
        parser.feed(html_content)
        title = parser.title.strip() if parser.title.strip() else format_title(filename)

        newsletters.append({
            "title": title,
            "filename": filepath
        })
        new_files_count += 1

# --- Save JSON ---
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(newsletters, f, indent=2, ensure_ascii=False)

print(f"✅ Processed {len(newsletters)} newsletters ({new_files_count} new).")
