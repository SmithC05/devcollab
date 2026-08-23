import os
import glob
import re

dir_path = 'frontend/src/components/project'

replacements = {
    r"'#080808'": "'var(--bg)'",
    r"'#0d0d0f'": "'var(--bg)'",
    r"'#0e0e10'": "'var(--bg)'",
    r"'#0e0e0e'": "'var(--surface-item)'",
    r"'#0c0c0e'": "'var(--surface-raised)'",
    r"'#1a1a1e'": "'var(--border-strong)'",
    r"'#2a2a2e'": "'var(--border-strong)'",
    r"bg-\[#0d0d0f\]": "bg-[var(--bg)]",
    r"bg-\[#0e0e0e\]": "bg-[var(--surface-item)]",
}

files = glob.glob(os.path.join(dir_path, '*.jsx'))

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in replacements.items():
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
