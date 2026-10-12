from pathlib import Path
import re, json
root=Path('src')
# Semantic names preserve the existing palette, including module-specific accents.
groups={
'Texto': {'text-primary':'#1f2937','text-secondary':'#475569','text-muted':'#64748b','text-subtle':'#6b7280','text-heading-color':'#111827','text-body':'#334155','text-strong':'#1e293b','text-soft':'#4b5563','text-disabled':'#9ca3af','text-placeholder':'#94a3b8','text-hint':'#596577','text-inverse':'#ffffff'},
'Fondos y superficies': {'surface':'#ffffff','surface-page':'#f5f6f8','surface-muted':'#f8fafc','surface-subtle':'#f9fafb','surface-neutral':'#f1f5f9','surface-table':'#f3f4f6','surface-disabled':'#e5e7eb'},
'Bordes': {'border-default':'#e5e7eb','border-subtle':'#e2e8f0','border-control':'#d1d5db','border-strong':'#cbd5e1','border-panel':'#dbe2ea'},
'Acciones, enlaces y foco': {'action-primary':'#1d4ed8','action-neutral':'#1f2937','action-neutral-hover':'#374151','link-color':'#1d4ed8','focus-ring':'#2563eb','focus-ring-soft':'#60a5fa','focus-ring-border':'#93c5fd','action-on-primary':'#ffffff'},
'Estados': {'success-text':'#166534','success-bg':'#dcfce7','success-text-strong':'#065f46','success-bg-soft':'#ecfdf5','danger-text':'#991b1b','danger-strong':'#b91c1c','danger-bg':'#fee2e2','danger-bg-soft':'#fef2f2','danger-border':'#fecaca','warning-text':'#92400e','warning-bg':'#fffbeb','warning-bg-strong':'#fef3c7','info-bg':'#eff6ff','info-border':'#bfdbfe','info-text':'#1e3a8a','info-guide-border':'#93b4e4'},
'Navegacion': {'sidebar-bg':'var(--action-neutral)','sidebar-text':'#d1d5db','sidebar-muted':'#b8c5d6','sidebar-hover':'#374151','sidebar-active':'#4b5563','overlay-bg':'rgb(15 23 42 / 55%)'},
'Graficas': {'chart-text':'#172b4d','chart-primary':'#0891b2','chart-secondary':'#0d9488','chart-hover':'#1e3a5f','chart-negative':'#dc2626','chart-target':'#d97706','chart-target-text':'#b45309','chart-grid':'#edf2f7','chart-accent-bg':'#f0fdfa','chart-accent-text':'#0f766e'},
'Acentos existentes de departamentos y organigrama': {'org-text':'#233449','org-text-muted':'#617185','org-text-action':'#24465c','org-primary':'#176f68','org-border':'#dce3ea','org-input-border':'#bfcbd7','org-button-border':'#bbc9d5','org-table-border':'#e2e8ee','org-table-bg':'#f4f7fa','org-danger':'#a22a31','org-warning-bg':'#fff2ed','org-success-bg':'#e9f5ee','org-success-text':'#21653e','org-focus':'#e5b444','org-line':'#b9cbd9','org-node-border':'#dbe3ec'},
'Acceso e inicio': {'login-bg':'#f4f6f9','login-text-muted':'#666','login-border':'#ccc','login-action':'#222','login-danger':'#c62828','login-danger-bg':'#fdecea','dashboard-accent-bg':'#eef4fa','dashboard-accent-border':'#dbe5ef'},
'Sombras': {'shadow-color-soft':'rgba(0, 0, 0, 0.06)','shadow-color-medium':'rgba(0, 0, 0, 0.08)','shadow-color-strong':'rgba(0, 0, 0, 0.1)','shadow-color-card':'#0f172a0a','shadow-color-chart':'#19365b06','shadow-color-primary':'#1d4ed820','shadow-color-primary-soft':'#1d4ed80a'}
}
values={k:v for g in groups.values() for k,v in g.items()}
pattern=re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|(?<![\w-])(?:white|black)(?![\w-])',re.I)
def normalize(s):
 s=s.lower()
 if s=='white': return '#ffffff'
 if s=='black': return '#000000'
 if re.fullmatch(r'#[0-9a-f]{3}',s): return '#'+''.join(c*2 for c in s[1:])
 return re.sub(r'\s+','',s)
lookup={normalize(v):k for k,v in values.items() if not v.startswith('var(')}
# Shared values use a role based on the CSS property, not only the literal color.
def choose(color,prop,path):
 c=normalize(color)
 background=prop in ('background','background-color')
 if c=='#ffffff': return 'surface' if background else 'text-inverse'
 if c=='#1f2937': return 'sidebar-bg' if 'sidebar' in path and background else 'action-neutral' if background else 'text-primary'
 if c=='#475569': return 'text-secondary'
 if c=='#374151': return 'sidebar-hover' if 'sidebar' in path and background else 'action-neutral-hover' if background else 'text-soft-dark'
 if c=='#4b5563': return 'sidebar-active' if 'sidebar' in path and background else 'text-soft'
 if c=='#d1d5db': return 'sidebar-text' if prop=='color' else 'border-control'
 if c=='#e5e7eb': return 'surface-disabled' if background else 'border-default'
 if c=='#1d4ed8': return 'action-primary' if background else 'link-color'
 return lookup[c]
groups['Texto']['text-soft-dark']='#374151';values['text-soft-dark']='#374151'
originals={str(p):p.read_text(encoding='utf-8-sig') for p in root.rglob('*.css')}
unknown=set()
for path,s in originals.items():
 for m in pattern.finditer(s):
  if normalize(m[0]) not in lookup: unknown.add(m[0])
if unknown: raise SystemExit('Colores sin clasificar: '+str(unknown))
updated={}
for path,s in originals.items():
 if path.replace('\\','/')=='src/styles.css':
  s=re.sub(r'\s*--text-(?:primary|secondary):\s*[^;]+;', '', s)
 # Only replace literal tokens inside declarations, leaving selectors and comments intact.
 def declaration(m):
  prop=m[1]; val=m[2]
  return prop+':'+pattern.sub(lambda c:'var(--'+choose(c[0],prop,path)+')',val)
 s=re.sub(r'([\w-]+)\s*:([^;{}]+)',declaration,s)
 if path.replace('\\','/')=='src/styles.css':
  tokens='\n  /* Colores globales: cambia aqui los valores; componentes usan var(--nombre). */\n'
  for title,items in groups.items():
   tokens+='\n  /* '+title+' */\n'+''.join('  --'+k+': '+v+';\n' for k,v in items.items())
  i=s.index('}',s.index(':root'))
  s=s[:i]+tokens+s[i:]
 updated[path]=s
# Check exact color equivalence after resolving variables, independent of whitespace/hex shorthand.
def expanded(s):
 s=re.sub(r':root\s*\{[^}]*\}', '', s)
 for _ in range(4):
  s=re.sub(r'var\(--([\w-]+)\)',lambda m:values.get(m[1],m[0]),s)
 s=pattern.sub(lambda m:normalize(m[0]),s)
 return re.sub(r'\s+','',s).lstrip('\ufeff')
for p,s in updated.items():
 if expanded(s)!=expanded(originals[p]): raise SystemExit('Diferencia inesperada: '+p)
Path('.angular/color-migration-before.json').write_text(json.dumps(originals,ensure_ascii=False),encoding='utf-8')
changed=[]
for p,s in updated.items():
 if s!=originals[p]: Path(p).write_text(s,encoding='utf-8'); changed.append(p)
print(json.dumps({'archivosActualizados':len(changed),'variablesColor':len(values),'equivalenciaColores':'correcta'},ensure_ascii=False))
