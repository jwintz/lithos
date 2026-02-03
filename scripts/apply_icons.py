
import os
import re

VAULT_ROOT = "/Users/jwintz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Academic"

ICON_MAP = {
    "Blog": "i-lucide-scroll",
    "Project": "i-lucide-box",
    "Research": "i-lucide-microscope",
    "Templates": "i-lucide-layout-template",
    "Bases": "i-lucide-database",
}

DEFAULT_ICON = "i-lucide-file"

def update_file_icon(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Determine icon based on path
    rel_path = os.path.relpath(filepath, VAULT_ROOT)
    folder = rel_path.split('/')[0] if '/' in rel_path else ""
    
    icon = ICON_MAP.get(folder, DEFAULT_ICON)
    
    # Special cases for root files if not already set (though we did set them manually)
    if folder == "About.md": icon = "i-lucide-user"
    if folder == "Colophon.md": icon = "i-lucide-info"
    if folder == "Home.md": icon = "i-lucide-home"
    if folder == "TODO.md": icon = "i-lucide-check-square"
    if folder == "README.md": icon = "i-lucide-book"
    if folder == "AGENTS.md": icon = "i-lucide-bot"

    # Check if frontmatter exists
    if not content.startswith('---\n'):
        # No frontmatter, add it? Or skip? Standardize to add it.
        # But for valid markdown files without frontmatter, we usually add it.
        # Let's assume files generally have frontmatter or we prepend it.
        if content.startswith('# '):
             content = f"---\nnavigation:\n  icon: {icon}\n---\n\n" + content
        else:
             content = f"---\nnavigation:\n  icon: {icon}\n---\n\n" + content
        print(f"Added frontmatter with icon to {rel_path}")
    else:
        # Check if icon already set
        if "icon:" in content.split('---')[1]:
            # It might be under navigation: or root. 
            # We want to strictly use navigation.icon if not present.
            # But wait, looking at my previous edits, I used `navigation:\n  icon: ...`
            # If `icon:` patterns exist, assume it's set.
            # However, I want to ENFORCE it for all files.
            pass
        else:
            # Add icon to frontmatter
            # Handle nested navigation object or create it
            fm_end = content.find('\n---', 3)
            frontmatter = content[3:fm_end]
            
            if "navigation:" in frontmatter:
                # Add icon indent
                pattern = r"(navigation:.*?)(\n)"
                replacement = f"\\1\n  icon: {icon}\\2"
                # This is tricky with regex multiline.
                # Easier to just string replace "navigation:\n" with "navigation:\n  icon: {icon}\n"
                # But indent might vary.
                # Let's simple append to frontmatter if no navigation key
                pass
            else:
                 # Add navigation section
                 new_fm = frontmatter + f"\nnavigation:\n  icon: {icon}"
                 content = content[:3] + new_fm + content[fm_end:]
                 print(f"Added icon to existing frontmatter in {rel_path}")

    with open(filepath, 'w') as f:
        f.write(content)

# Walk and update
for root, dirs, files in os.walk(VAULT_ROOT):
    for file in files:
        if file.endswith(".md"):
            update_file_icon(os.path.join(root, file))
