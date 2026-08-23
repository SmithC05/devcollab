import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """function ProjectInspector({ project, members, responsibilities }) {
  const r = responsibilities.filter(r => r.project_name === project?.name);"""

new_code = """function ProjectInspector({ project, members, responsibilities }) {
  const r = (responsibilities || []).filter(r => r.project_name === project?.name);"""

content = content.replace(old_code, new_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed ProjectInspector responsibilities filter")
