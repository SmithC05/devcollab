import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """function MemberIntelligenceCard({ member, responsibilities, onClick }) {
  const criticalResps = responsibilities.filter(
    r => r.owner === member.name && (r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE')
  );"""

new_code = """function MemberIntelligenceCard({ member, responsibilities, onClick }) {
  const criticalResps = (responsibilities || []).filter(
    r => r.owner === member.name && (r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE')
  );"""

content = content.replace(old_code, new_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed MemberIntelligenceCard")
