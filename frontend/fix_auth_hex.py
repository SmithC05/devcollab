import os

replacements = {
    'bg-[#000000]': 'bg-[var(--bg)]',
    'bg-[#000]': 'bg-[var(--bg)]',
    'bg-[#0a0a0a]': 'bg-[var(--surface)]',
    'bg-[#0A0A0A]': 'bg-[var(--surface)]',
    'bg-[#111111]': 'bg-[var(--surface-item)]',
    'bg-[#111]': 'bg-[var(--surface-item)]',
    'bg-[#151515]': 'bg-[var(--surface-hover)]',
    'bg-[#1a1a1a]': 'bg-[var(--surface-hover)]',
    'border-[#1e1e1e]': 'border-[var(--border-strong)]',
    'border-[#242424]': 'border-[var(--border-subtle)]',
    'border-[#292929]': 'border-[var(--border-subtle)]',
    'border-[#333]': 'border-[var(--border-strong)]',
    'border-[#444]': 'border-[var(--border-focus)]',
    'text-[#FFFFFF]': 'text-[var(--text-primary)]',
    'text-[#A3A3A3]': 'text-[var(--text-secondary)]',
    'text-[#737373]': 'text-[var(--text-muted)]',
    'text-[#525252]': 'text-[var(--text-muted)]',
    'text-[#666666]': 'text-[var(--text-muted)]',
    'placeholder:text-[#666666]': 'placeholder:text-[var(--text-muted)]',
    'hover:text-[#a3a3a3]': 'hover:text-[var(--text-secondary)]',
    'hover:bg-[#1a1a1a]': 'hover:bg-[var(--surface-hover)]',
    'hover:bg-[#151515]': 'hover:bg-[var(--surface-hover)]',
    'hover:border-[#444]': 'hover:border-[var(--border-focus)]',
    'bg-[#242424]': 'bg-[var(--border-subtle)]',
}

directory = 'src/components/auth'
for filename in os.listdir(directory):
    if filename.endswith('.jsx'):
        path = os.path.join(directory, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for k, v in replacements.items():
            new_content = new_content.replace(k, v)
            
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filename}')
