import os

replacements = {
    'border-[#1a1a1a]': 'border-[var(--border-subtle)]',
    'border-[#2a2a2e]': 'border-[var(--border-subtle)]',
    'border-[#222]': 'border-[var(--border-strong)]',
    'border-[#2A2A2A]': 'border-[var(--border-subtle)]',
    'border-[#333333]': 'border-[var(--border-strong)]',
}

for root, dirs, files in os.walk('src'):
    for filename in files:
        if filename.endswith('.jsx'):
            path = os.path.join(root, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = content
            for k, v in replacements.items():
                new_content = new_content.replace(k, v)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
