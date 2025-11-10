import os
import json

# --- Helper: format fallback title from filename ---
def format_title(name):
    # Remove extension
    name = os.path.splitext(name)[0]
    # Replace underscores with spaces
    name = name.replace('_', ' ')
    # Capitalize each word
    return ' '.join(word.capitalize() for word in name.split())

# --- Paths ---
images_folder = "./images"   # folder with your images
json_file = "./images.json"   # output JSON file

# --- Load existing JSON if it exists ---
if os.path.exists(json_file):
    with open(json_file, "r", encoding="utf-8") as f:
        try:
            images = json.load(f)
        except json.JSONDecodeError:
            images = []
else:
    images = []

# Track existing files to avoid duplicates
existing_files = set(images)

# --- Scan folder ---
new_files_count = 0
for filename in os.listdir(images_folder):
    if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
        path = os.path.join(images_folder, filename)
        rel_path = os.path.relpath(path, start=os.path.dirname(json_file)).replace("\\", "/")
        if rel_path in existing_files:
            continue  # skip duplicates
        images.append(rel_path)
        new_files_count += 1

# --- Save JSON ---
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(images, f, indent=2, ensure_ascii=False)

print(f"✅ Processed {len(images)} images ({new_files_count} new).")
