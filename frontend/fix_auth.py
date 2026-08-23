import os
import re

replacements = {
    # Replace light:, dark: and hardcoded hex with var classes
    r'light:bg-\[[^\]]+\]': '',
    r'light:text-\[[^\]]+\]': '',
    r'light:border-\[[^\]]+\]': '',
    r'light:placeholder-\[[^\]]+\]': '',
    r'light:hover:bg-\[[^\]]+\]': '',
    r'light:hover:text-\[[^\]]+\]': '',
    r'light:hover:border-\[[^\]]+\]': '',
    r'light:bg-[a-z]+': '',
    r'light:text-[a-z]+': '',
    r'dark:bg-\[[^\]]+\]': '',
    r'dark:text-\[[^\]]+\]': '',
    r'dark:border-\[[^\]]+\]': '',
    r'dark:placeholder-\[[^\]]+\]': '',
    r'dark:hover:bg-\[[^\]]+\]': '',
    r'dark:hover:text-\[[^\]]+\]': '',
    r'dark:hover:border-\[[^\]]+\]': '',
    r'bg-[#000000]': 'bg-[var(--bg)]',
    r'bg-[#000]': 'bg-[var(--bg)]',
    r'bg-[#0a0a0a]': 'bg-[var(--surface)]',
    r'bg-[#0A0A0A]': 'bg-[var(--surface)]',
    r'bg-[#111111]': 'bg-[var(--surface-item)]',
    r'bg-[#111]': 'bg-[var(--surface-item)]',
    r'bg-[#151515]': 'bg-[var(--surface-hover)]',
    r'bg-[#1a1a1a]': 'bg-[var(--surface-hover)]',
    r'border-[#1e1e1e]': 'border-[var(--border-strong)]',
    r'border-[#242424]': 'border-[var(--border-subtle)]',
    r'border-[#292929]': 'border-[var(--border-subtle)]',
    r'border-[#333]': 'border-[var(--border-strong)]',
    r'border-[#444]': 'border-[var(--border-focus)]',
    r'text-[#FFFFFF]': 'text-[var(--text-primary)]',
    r'text-[#A3A3A3]': 'text-[var(--text-secondary)]',
    r'text-[#737373]': 'text-[var(--text-muted)]',
    r'text-[#525252]': 'text-[var(--text-muted)]',
    r'text-[#666666]': 'text-[var(--text-muted)]',
    r'placeholder:text-[#666666]': 'placeholder-[var(--text-muted)]',
    r'hover:text-[#a3a3a3]': 'hover:text-[var(--text-secondary)]',
    r'hover:bg-[#1a1a1a]': 'hover:bg-[var(--surface-hover)]',
    r'hover:bg-[#151515]': 'hover:bg-[var(--surface-hover)]',
    r'hover:border-[#444]': 'hover:border-[var(--border-focus)]',
    r'bg-[#242424]': 'bg-[var(--border-subtle)]',
}

# Apply to all files in src/components/auth
directory = 'src/components/auth'
for filename in os.listdir(directory):
    if filename.endswith('.jsx'):
        path = os.path.join(directory, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for pattern, replacement in replacements.items():
            new_content = re.sub(pattern, replacement, new_content)
            
        # Also clean up multiple spaces created by empty replacements
        new_content = re.sub(r' +', ' ', new_content)
            
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filename}')
