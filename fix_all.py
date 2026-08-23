import os
import glob
import re

directories = [
    'frontend/src/components/board',
    'frontend/src/components/project',
    'frontend/src/components/workspace'
]

replacements = {
    # Kanban & Others
    r"'#0c0c0c'": "'var(--surface-item)'",
    r"'#1e1e1e'": "'var(--border-strong)'",
    r"'#2a2a2a'": "'var(--border-subtle)'",
    r"'#1a1a1a'": "'var(--border-strong)'",
    r"'#141414'": "'var(--surface-hover)'",
    r"'#3a3a3a'": "'var(--border-strong)'",
    r"'#555'": "'var(--text-muted)'",
    r"'#252525'": "'var(--border-strong)'",
    r"'#666'": "'var(--text-secondary)'",
    r"'rgba\(255,255,255,0\.05\)'": "'var(--surface-raised)'",
    r"'rgba\(255,255,255,0\.02\)'": "'var(--surface-hover)'",
    
    # Specific Buttons to Black (var(--text-primary) background, var(--bg) text)
    # 1. DC Logo
    r"background: 'linear-gradient\(135deg,#6366f1 0%,#8b5cf6 100%\)'": "background: 'var(--text-primary)'",
    r"color: '#fff', fontWeight: 800": "color: 'var(--bg)', fontWeight: 800",
    
    # 2. Invite People, Create First Page, Save Snippet, etc. 
    r"background: 'linear-gradient\(135deg,#6366f1,#8b5cf6\)'": "background: 'var(--text-primary)'",
    r"color: '#fff', border: 'none', cursor: 'pointer'": "color: 'var(--bg)', border: 'none', cursor: 'pointer'",
    r"color: '#fff', border: 'none', cursor: saving \? 'wait' : 'pointer'": "color: 'var(--bg)', border: 'none', cursor: saving ? 'wait' : 'pointer'",
}

for dir_path in directories:
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
