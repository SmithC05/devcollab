import os
import re

directories_to_fix = [
    'frontend/src/components/auth',
    'frontend/src/components/workspace',
    'frontend/src/components/project',
    'frontend/src/components/dashboard'
]

# Match `import something from "../something';`
# Replace with `import something from "../something";`
pattern = re.compile(r'(from\s+"[^"]+)\';')
pattern2 = re.compile(r'(from\s+"[^"]+)\'\n')

for dir_path in directories_to_fix:
    if not os.path.exists(dir_path):
        continue
    for filename in os.listdir(dir_path):
        if not filename.endswith('.jsx') and not filename.endswith('.js'):
            continue
        
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = pattern.sub(r'\1";', content)
        new_content = pattern2.sub(r'\1"\n', new_content)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed quotes in {filepath}")
