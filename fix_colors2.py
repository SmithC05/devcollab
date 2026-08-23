import os
import glob
import re

dir_path = 'frontend/src/components/project'

replacements = {
    r"'#141416'": "'var(--surface-item)'",
    r"'#1f1f24'": "'var(--border-strong)'",
    r"'#1a1a1e'": "'var(--border-strong)'",
    r"'#2a2a2e'": "'var(--border-subtle)'",
    r"'#1c1c1c'": "'var(--surface-raised)'",
    r"'#141414'": "'var(--surface-hover)'",
    r"'#111'": "'var(--surface-item)'",
    r"'#333'": "'var(--border-strong)'",
    r"'#444'": "'var(--text-muted)'",
    r"'#ccc'": "'var(--text-secondary)'",
    r"'#d5d5d5'": "'var(--text-primary)'",
    r"color: '#080808'": "color: 'var(--bg)'",
    r"background: '#080808'": "background: 'var(--bg)'",
    r"background: '#0c0c0e'": "background: 'var(--surface-raised)'",
    r"linear-gradient\(to top, #0c0c0e, transparent\)": "linear-gradient(to top, var(--surface-raised), transparent)",
    r"border: '1px solid #1a1a1e'": "border: '1px solid var(--border-strong)'",
    r"borderBottom: '1px solid #1a1a1e'": "borderBottom: '1px solid var(--border-strong)'",
    r"borderTop: '1px solid #1a1a1e'": "borderTop: '1px solid var(--border-strong)'",
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
