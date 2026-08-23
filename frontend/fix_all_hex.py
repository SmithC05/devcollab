import os
import re

replacements = {
    'bg-[#000000]': 'bg-[var(--bg)]',
    'bg-[#000]': 'bg-[var(--bg)]',
    'bg-[#0a0a0a]': 'bg-[var(--surface)]',
    'bg-[#0A0A0A]': 'bg-[var(--surface)]',
    'bg-[#0b0b0b]': 'bg-[var(--surface-card)]',
    'bg-[#0B0B0B]': 'bg-[var(--surface-card)]',
    'bg-[#0d0d0d]': 'bg-[var(--surface-card)]',
    'bg-[#0D0D0D]': 'bg-[var(--surface-card)]',
    'bg-[#0f0f0f]': 'bg-[var(--surface)]',
    'bg-[#0F0F0F]': 'bg-[var(--surface)]',
    'bg-[#111111]': 'bg-[var(--surface-item)]',
    'bg-[#111]': 'bg-[var(--surface-item)]',
    'bg-[#151515]': 'bg-[var(--surface-hover)]',
    'bg-[#161616]': 'bg-[var(--surface-hover)]',
    'bg-[#171717]': 'bg-[var(--surface-card)]',
    'bg-[#1a1a1a]': 'bg-[var(--surface-hover)]',
    'bg-[#1A1A1A]': 'bg-[var(--surface-hover)]',
    'bg-[#242424]': 'bg-[var(--surface-hover)]',
    'bg-[#27272A]': 'bg-[var(--border-strong)]',
    'bg-[#292929]': 'bg-[var(--border-strong)]',
    'border-[#1e1e1e]': 'border-[var(--border-strong)]',
    'border-[#1f1f1f]': 'border-[var(--border-strong)]',
    'border-[#1F1F1F]': 'border-[var(--border-strong)]',
    'border-[#242424]': 'border-[var(--border-subtle)]',
    'border-[#27272A]': 'border-[var(--border-strong)]',
    'border-[#292929]': 'border-[var(--border-subtle)]',
    'border-[#2a2a2a]': 'border-[var(--border-subtle)]',
    'border-[#333]': 'border-[var(--border-strong)]',
    'border-[#404040]': 'border-[var(--border-focus)]',
    'border-[#444]': 'border-[var(--border-focus)]',
    'text-[#FFFFFF]': 'text-[var(--text-primary)]',
    'text-[#FAFAFA]': 'text-[var(--text-primary)]',
    'text-[#D4D4D4]': 'text-[var(--text-secondary)]',
    'text-[#A3A3A3]': 'text-[var(--text-secondary)]',
    'text-[#737373]': 'text-[var(--text-muted)]',
    'text-[#525252]': 'text-[var(--text-muted)]',
    'text-[#666666]': 'text-[var(--text-muted)]',
    'placeholder-[#737373]': 'placeholder:text-[var(--text-muted)]',
    'placeholder:text-[#666666]': 'placeholder:text-[var(--text-muted)]',
    'hover:text-[#a3a3a3]': 'hover:text-[var(--text-secondary)]',
    'hover:text-[#D4D4D4]': 'hover:text-[var(--text-secondary)]',
    'hover:bg-[#1a1a1a]': 'hover:bg-[var(--surface-hover)]',
    'hover:bg-[#151515]': 'hover:bg-[var(--surface-hover)]',
    'hover:bg-[#0f0f0f]': 'hover:bg-[var(--surface-hover)]',
    'hover:bg-[#111]': 'hover:bg-[var(--surface-item)]',
    'hover:border-[#333]': 'hover:border-[var(--border-strong)]',
    'hover:border-[#404040]': 'hover:border-[var(--border-focus)]',
    'hover:border-[#444]': 'hover:border-[var(--border-focus)]',
}

regex_replacements = {
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
}

for root, dirs, files in os.walk('src'):
    for filename in files:
        if filename.endswith('.jsx'):
            path = os.path.join(root, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = content
            
            # Apply exact replacements
            for k, v in replacements.items():
                new_content = new_content.replace(k, v)
                
            # Apply regex replacements for light:/dark: prefixes
            for pattern, replacement in regex_replacements.items():
                new_content = re.sub(pattern, replacement, new_content)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
