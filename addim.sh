#!/usr/bin/env bash


# ═══════════════════════════════════════════════════════════════════════════════
# CAMBRA Image Embedder
# Converts all PNG images to base64 and injects them into App.jsx
# ═══════════════════════════════════════════════════════════════════════════════

set -eo pipefail

APP_FILE="cambra-tool-ui/src/App.jsx"
IMG_DIR="cambra-tool-ui/public/images"
BACKUP_FILE="${APP_FILE}.bak.$(date +%s)"

# Check files exist
if [ ! -f "$APP_FILE" ]; then
    echo "❌ App.jsx not found at $APP_FILE"
    exit 1
fi

if [ ! -d "$IMG_DIR" ]; then
    echo "❌ Images directory not found at $IMG_DIR"
    exit 1
fi

# Backup
cp "$APP_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 1: Convert all images to base64 data URIs
# ═══════════════════════════════════════════════════════════════════════════════

echo "🖼  Converting images to base64..."

declare -A IMG_B64 2>/dev/null || true

for img in "$IMG_DIR"/*.png; do
    filename=$(basename "$img" .png)
    # Base64 encode
    b64=$(base64 < "$img" | tr -d '\n')
    IMG_B64["$filename"]="data:image/png;base64,$b64"
    echo "   ✓ $filename ($(wc -c < "$img" | tr -d ' ') bytes)"
done

echo "   Total: ${#IMG_B64[@]} images converted"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 2: Build the image constants block to inject
# ═══════════════════════════════════════════════════════════════════════════════

echo "📝 Building image constants block..."

IMAGES_BLOCK='
// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDED IMAGES (base64) — auto-generated, do not edit manually
// ═══════════════════════════════════════════════════════════════════════════════
const CAMBRA_IMAGES = {'

for key in $(echo "${!IMG_B64[@]}"); do
    IMAGES_BLOCK+="
  \"$key\": \"${IMG_B64[$key]}\","
done

IMAGES_BLOCK+='
};

// Reusable image component — responsive, transparent-friendly
const CImg = ({ name, alt = "", className = "", style = {} }) => (
  <img
    src={CAMBRA_IMAGES[name]}
    alt={alt}
    draggable={false}
    className={className}
    style={{ objectFit: "contain", userSelect: "none", pointerEvents: "none", ...style }}
  />
);
'

# ═══════════════════════════════════════════════════════════════════════════════
# Step 3: Write the modified App.jsx using a Python helper
#         (bash alone can't handle the multiline replacements safely)
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔧 Injecting images into App.jsx..."

python3 << 'PYEOF'
import re, sys, os

app_path = os.environ.get("APP_FILE", "cambra-tool-ui/src/App.jsx")

with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

# ─── Read the images block from env (written to a temp file) ───
images_block_path = "/tmp/_cambra_images_block.js"
with open(images_block_path, "r", encoding="utf-8") as f:
    images_block = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# INJECTION POINT: Right after the GLOBAL STYLES section closing brace
# We look for the line: // UTILITIES
# and inject our images block right before it
# ─────────────────────────────────────────────────────────────────────────────

marker = "// UTILITIES"
if marker not in code:
    print("❌ Could not find injection marker: " + marker)
    sys.exit(1)

# Remove any previously injected block
code = re.sub(
    r'// ═+ *\n// EMBEDDED IMAGES.*?const CImg.*?\);\n',
    '',
    code,
    flags=re.DOTALL
)

# Inject before UTILITIES
idx = code.index(marker)
# Find the start of that comment line (including the // ═══ decoration above it)
# Look backwards for the decoration line
search_area = code[:idx]
deco_match = search_area.rfind("// ═")
if deco_match >= 0 and (idx - deco_match) < 200:
    inject_point = deco_match
else:
    inject_point = idx

code = code[:inject_point] + images_block + "\n" + code[inject_point:]

# ─────────────────────────────────────────────────────────────────────────────
# IMAGE PLACEMENT: Replace/augment specific UI locations
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. WELCOME / HERO ──
# Replace the "C" logo box in Welcome with the hero image behind it
old_welcome_logo = '''<div className="c-fade-up">
                    <div className="w-14 h-14 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#475569] c-drift">
                        <span className="text-white font-black text-2xl tracking-tighter" style={{fontFamily:'Georgia,serif'}}>C</span>
                    </div>
                </div>'''

new_welcome_logo = '''<div className="c-fade-up relative">
                    <CImg name="ui_hero_single_20" alt="CAMBRA" className="w-28 h-28 sm:w-36 sm:h-36 mx-auto c-drift opacity-90" />
                </div>'''

code = code.replace(old_welcome_logo, new_welcome_logo)

# ── 2. LOADING SCREEN ──
old_loading = '''<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"/></div>'''

new_loading = '''<div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <CImg name="ui_loading_single_18" alt="Loading" className="w-20 h-20 sm:w-24 sm:h-24 c-drift opacity-80" />
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"/>
    </div>'''

code = code.replace(old_loading, new_loading)

# ── 3. TAB ICONS ──
# Replace lucide icons in the tab bar with images
# Tab mapping: patient->13, disease->14, protective->12, results->11
tab_icon_map = {
    "User": ("ui_tab_patient_single_13", "Patient"),
    "AlertCircle": ("ui_tab_disease_single_14", "Disease"),
    "Shield": ("ui_tab_protective_single_12", "Protective"),
    "PieChart": ("ui_tab_results_single_11", "Results"),
}

# The tabs definition:
# {id:'patient',icon:User,label:t.tabPatient},
# Replace the icon rendering in the tab bar
# Original: <tb.icon className={`w-3 h-3 ${tab===tb.id?'text-slate-900':'text-slate-300'}`}/>
old_tab_icon = '''<tb.icon className={`w-3 h-3 ${tab===tb.id?'text-slate-900':'text-slate-300'}`}/>'''
new_tab_icon = '''{tb.img
                            ? <CImg name={tb.img} alt={tb.label} className={`w-5 h-5 sm:w-6 sm:h-6 transition-opacity ${tab===tb.id?'opacity-100':'opacity-30'}`} />
                            : <tb.icon className={`w-3 h-3 ${tab===tb.id?'text-slate-900':'text-slate-300'}`}/>}'''
code = code.replace(old_tab_icon, new_tab_icon)

# Add img property to tab definitions
code = code.replace(
    "{id:'patient',icon:User,label:t.tabPatient}",
    "{id:'patient',icon:User,img:'ui_tab_patient_single_13',label:t.tabPatient}"
)
code = code.replace(
    "{id:'disease',icon:AlertCircle,label:t.tabDisease}",
    "{id:'disease',icon:AlertCircle,img:'ui_tab_disease_single_14',label:t.tabDisease}"
)
code = code.replace(
    "{id:'protective',icon:Shield,label:t.tabProtective}",
    "{id:'protective',icon:Shield,img:'ui_tab_protective_single_12',label:t.tabProtective}"
)
code = code.replace(
    "{id:'results',icon:PieChart,label:t.tabResults}",
    "{id:'results',icon:PieChart,img:'ui_tab_results_single_11',label:t.tabResults}"
)

# ── 4. SECTION HEADERS — Disease, Risk, Protective ──
# Disease indicators header
old_disease_header = '''<div className="px-4 py-2.5 border-b border-red-100 bg-red-50/50">
                            <h2 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">{t.diseaseIndicators}</h2>
                            <p className="text-[10px] text-red-400 mt-0.5">{t.diseaseIndSubtitle}</p>
                        </div>'''

new_disease_header = '''<div className="px-4 py-2.5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
                            <CImg name="ui_header_disease_single_23" alt="" className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
                            <div>
                                <h2 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">{t.diseaseIndicators}</h2>
                                <p className="text-[10px] text-red-400 mt-0.5">{t.diseaseIndSubtitle}</p>
                            </div>
                        </div>'''
code = code.replace(old_disease_header, new_disease_header)

# Risk factors header
old_risk_header = '''<div className="px-4 py-2.5 border-b border-amber-100 bg-amber-50/50">
                            <h2 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t.riskFactors}</h2>
                            <p className="text-[10px] text-amber-400 mt-0.5">{t.riskFactSubtitle}</p>
                        </div>'''

new_risk_header = '''<div className="px-4 py-2.5 border-b border-amber-100 bg-amber-50/50 flex items-center gap-3">
                            <CImg name="ui_header_risk_single_21" alt="" className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
                            <div>
                                <h2 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t.riskFactors}</h2>
                                <p className="text-[10px] text-amber-400 mt-0.5">{t.riskFactSubtitle}</p>
                            </div>
                        </div>'''
code = code.replace(old_risk_header, new_risk_header)

# Protective factors header
old_prot_header = '''<div className="px-4 py-2.5 border-b border-emerald-100 bg-emerald-50/50">
                            <h2 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t.protectiveFactors}</h2>
                            <p className="text-[10px] text-emerald-400 mt-0.5">{t.protFactSubtitle}</p>
                        </div>'''

new_prot_header = '''<div className="px-4 py-2.5 border-b border-emerald-100 bg-emerald-50/50 flex items-center gap-3">
                            <CImg name="ui_header_protective_single_22" alt="" className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
                            <div>
                                <h2 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t.protectiveFactors}</h2>
                                <p className="text-[10px] text-emerald-400 mt-0.5">{t.protFactSubtitle}</p>
                            </div>
                        </div>'''
code = code.replace(old_prot_header, new_prot_header)

# ── 5. OUTCOME IMAGES on the result verdict banner ──
# Add outcome image next to the verdict text
# We need to map finalCat to image names:
# lowRisk -> ui_outcome_low_single_16
# moderateRisk -> ui_outcome_moderate_single_15
# highRisk -> ui_outcome_high_single_17
# extremeRisk -> ui_outcome_extreme_single_19

# First, add the mapping constant right after CAMBRA_IMAGES
outcome_map = '''
const OUTCOME_IMAGES = {
  lowRisk: "ui_outcome_low_single_16",
  moderateRisk: "ui_outcome_moderate_single_15",
  highRisk: "ui_outcome_high_single_17",
  extremeRisk: "ui_outcome_extreme_single_19",
};
'''

# Insert after CImg component
cimg_end = "/>\\n);"
code = code.replace(
    '''  />
  />
);
''',
    '''  />
);
''' + outcome_map,
    1
)

# Actually let's be more precise - insert after the CImg definition
# Find the closing of CImg
cimg_pattern = """const CImg = ({ name, alt = "", className = "", style = {} }) => (
  <img
    src={CAMBRA_IMAGES[name]}
    alt={alt}
    draggable={false}
    className={className}
    style={{ objectFit: "contain", userSelect: "none", pointerEvents: "none", ...style }}
  />
);"""

if cimg_pattern in code:
    code = code.replace(cimg_pattern, cimg_pattern + "\n" + outcome_map)

# Now add the outcome image to the verdict banner
# Find the verdict text area and add image
old_verdict_inner = '''<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                                    {/* Verdict text */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">'''

new_verdict_inner = '''<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                                    {/* Verdict text */}
                                    <div className="flex items-start gap-4">
                                        <CImg
                                            name={OUTCOME_IMAGES[results.finalCat]}
                                            alt=""
                                            className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 drop-shadow-lg"
                                        />
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">'''

code = code.replace(old_verdict_inner, new_verdict_inner)

# Close the extra div we opened
old_override_end = '''{results.orthoOverride&&<span className="bg-white/15 text-white/90 text-[9px] font-semibold px-2 py-0.5 rounded-md">{t.orthoOverride}</span>}
                                        </div>
                                    </div>'''

new_override_end = '''{results.orthoOverride&&<span className="bg-white/15 text-white/90 text-[9px] font-semibold px-2 py-0.5 rounded-md">{t.orthoOverride}</span>}
                                        </div>
                                    </div>
                                    </div>'''

code = code.replace(old_override_end, new_override_end)

# ── 6. BALANCE IMAGE — in the score breakdown area ──
# Add the balance image as a decorative element above the 3-column grid
old_breakdown = '''<div className="c-fade-up c-d1 grid grid-cols-3 gap-2">'''

new_breakdown = '''<div className="c-fade-up c-d1 flex justify-center mb-2">
                        <CImg name="ui_balance_single_25" alt="" className="w-14 h-14 sm:w-16 sm:h-16 opacity-60" />
                    </div>
                    <div className="c-fade-up c-d1 grid grid-cols-3 gap-2">'''

code = code.replace(old_breakdown, new_breakdown, 1)

# ── 7. EMPTY STATE IMAGE — for when no factors are selected in a section ──
# Add empty state to each factor list when nothing is checked
# We'll add it to the score breakdown items list
old_no_items_disease = '''items:dInd.map((c,i)=>c?t[`di_${i+1}`]:null).filter(Boolean)}'''
# We won't change this, but instead add the empty image inline where items are rendered

# ── 8. HEADER LOGO — replace the "C" logo in the sticky header ──
old_header_logo = '''<div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs" style={{fontFamily:'Georgia,serif'}}>C</span>
                </div>'''

new_header_logo = '''<div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                    <CImg name="ui_hero_single_20" alt="C" className="w-6 h-6" style={{filter:'brightness(10)'}} />
                </div>'''

# Actually keep the text C for header, it's clean. Let's skip this one.
# code = code.replace(old_header_logo, new_header_logo)

# ── 9. EMPTY STATE — add to protective tab when nothing selected ──
# We add a subtle empty illustration in each section's factor list
# This is done by modifying the section rendering

# For disease indicators section, after the divide-y div, add conditional empty
old_disease_factors_end = '''                        {Array.from({length:st.diseaseCount}).map((_,i)=>(
                                <FactorRow key={`d${i}`} label={t[`di_${i+1}`]} hint={t[`di_${i+1}_hint`]} desc={t[`di_${i+1}_desc`]}
                                    checked={dInd[i]} onToggle={()=>tog(setDInd,i)} color="red" weight={st.diseaseWeight} lang={lang}
                                    descOpen={openDI===i} onDescToggle={()=>setOpenDI(v=>v===i?null:i)}/>
                            ))}
                        </div>
                    </div>'''

# Keep factor lists as-is, empty state images feel forced there.
# Better: add empty image to score breakdown columns when count is 0

# ── 10. Patient info section header ──
old_patient_header = '''<div className="px-4 py-2.5 border-b border-slate-100"><h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.patientInfo}</h2></div>'''

new_patient_header = '''<div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-3">
                            <CImg name="ui_empty_single_24" alt="" className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 opacity-70" />
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.patientInfo}</h2>
                        </div>'''

code = code.replace(old_patient_header, new_patient_header)

# ─────────────────────────────────────────────────────────────────────────────
# Write output
# ─────────────────────────────────────────────────────────────────────────────
with open(app_path, "w", encoding="utf-8") as f:
    f.write(code)

print("✅ App.jsx updated successfully!")
PYEOF

# Write the images block to temp file for Python to read
cat > /tmp/_cambra_images_block.js << 'BLOCKEOF'
BLOCKEOF

# Actually we need to write the block properly
# Let's write the full images block to the temp file

echo "📦 Writing images block to temp file..."

{
    echo ""
    echo "// ═══════════════════════════════════════════════════════════════════════════════"
    echo "// EMBEDDED IMAGES (base64) — auto-generated, do not edit manually"
    echo "// ═══════════════════════════════════════════════════════════════════════════════"
    echo "const CAMBRA_IMAGES = {"
    
    for key in "${!IMG_B64[@]}"; do
        echo "  \"$key\": \"${IMG_B64[$key]}\","
    done
    
    echo "};"
    echo ""
    echo "// Reusable image component — responsive, transparent-friendly"
    echo "const CImg = ({ name, alt = \"\", className = \"\", style = {} }) => ("
    echo "  <img"
    echo "    src={CAMBRA_IMAGES[name]}"
    echo "    alt={alt}"
    echo "    draggable={false}"
    echo "    className={className}"
    echo '    style={{ objectFit: "contain", userSelect: "none", pointerEvents: "none", ...style }}'
    echo "  />"
    echo ");"
} > /tmp/_cambra_images_block.js

# Now run the Python script
export APP_FILE

python3 << 'PYEOF'
import re, sys, os

app_path = os.environ.get("APP_FILE", "cambra-tool-ui/src/App.jsx")

with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

with open("/tmp/_cambra_images_block.js", "r", encoding="utf-8") as f:
    images_block = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# Remove any previously injected image block
# ─────────────────────────────────────────────────────────────────────────────
code = re.sub(
    r'\n// ═+\n// EMBEDDED IMAGES \(base64\).*?^\);$',
    '',
    code,
    flags=re.DOTALL | re.MULTILINE
)
code = re.sub(
    r'\nconst OUTCOME_IMAGES = \{.*?^\};$',
    '',
    code,
    flags=re.DOTALL | re.MULTILINE
)

# ─────────────────────────────────────────────────────────────────────────────
# INJECT images block before // UTILITIES
# ─────────────────────────────────────────────────────────────────────────────
util_marker = "// ═══════════════════════════════════════════════════════════════════════════════\n// UTILITIES"
if util_marker not in code:
    # Try partial
    util_marker = "// UTILITIES"
    
if util_marker not in code:
    print("❌ Cannot find UTILITIES marker")
    sys.exit(1)

idx = code.index(util_marker)
# Go back to find the decoration line
search_back = code[:idx]
deco_pos = search_back.rfind("\n// ═")
if deco_pos >= 0 and (idx - deco_pos) < 200:
    inject_at = deco_pos
else:
    inject_at = idx

code = code[:inject_at] + "\n" + images_block + "\n\n" + code[inject_at:]

# ─────────────────────────────────────────────────────────────────────────────
# Add OUTCOME_IMAGES map after CImg
# ─────────────────────────────────────────────────────────────────────────────
outcome_map = '''
const OUTCOME_IMAGES = {
  lowRisk: "ui_outcome_low_single_16",
  moderateRisk: "ui_outcome_moderate_single_15",
  highRisk: "ui_outcome_high_single_17",
  extremeRisk: "ui_outcome_extreme_single_19",
};
'''

cimg_end_marker = '    style={{ objectFit: "contain", userSelect: "none", pointerEvents: "none", ...style }}\n  />\n);'
if cimg_end_marker in code:
    code = code.replace(cimg_end_marker, cimg_end_marker + "\n" + outcome_map, 1)
else:
    print("⚠ Could not find CImg closing, inserting OUTCOME_IMAGES after images block")
    # fallback: put it right after CAMBRA_IMAGES closing
    cambra_close = "const CImg"
    ci = code.index(cambra_close)
    # find the ");" after it
    ci2 = code.index(");", ci) + 2
    code = code[:ci2] + "\n" + outcome_map + code[ci2:]

# ─────────────────────────────────────────────────────────────────────────────
# WELCOME HERO — replace "C" logo with hero image
# ─────────────────────────────────────────────────────────────────────────────
code = code.replace(
    '''<div className="c-fade-up">
                    <div className="w-14 h-14 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#475569] c-drift">
                        <span className="text-white font-black text-2xl tracking-tighter" style={{fontFamily:'Georgia,serif'}}>C</span>
                    </div>
                </div>''',
    '''<div className="c-fade-up relative flex justify-center">
                    <CImg name="ui_hero_single_20" alt="CAMBRA" className="w-28 h-28 sm:w-36 sm:h-36 c-drift drop-shadow-xl" />
                </div>'''
)

# ─────────────────────────────────────────────────────────────────────────────
# LOADING SCREEN — add loading image
# ─────────────────────────────────────────────────────────────────────────────
code = code.replace(
    '''<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"/></div>''',
    '''<div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <CImg name="ui_loading_single_18" alt="Loading" className="w-20 h-20 sm:w-24 sm:h-24 c-drift opacity-80" />
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"/>
    </div>'''
)

# ─────────────────────────────────────────────────────────────────────────────
# TAB ICONS — add img property and use CImg
# ─────────────────────────────────────────────────────────────────────────────
code = code.replace(
    "{id:'patient',icon:User,label:t.tabPatient}",
    "{id:'patient',icon:User,img:'ui_tab_patient_single_13',label:t.tabPatient}"
)
code = code.replace(
    "{id:'disease',icon:AlertCircle,label:t.tabDisease}",
    "{id:'disease',icon:AlertCircle,img:'ui_tab_disease_single_14',label:t.tabDisease}"
)
code = code.replace(
    "{id:'protective',icon:Shield,label:t.tabProtective}",
    "{id:'protective',icon:Shield,img:'ui_tab_protective_single_12',label:t.tabProtective}"
)
code = code.replace(
    "{id:'results',icon:PieChart,label:t.tabResults}",
    "{id:'results',icon:PieChart,img:'ui_tab_results_single_11',label:t.tabResults}"
)

# Replace tab icon rendering
code = code.replace(
    '''<tb.icon className={`w-3 h-3 ${tab===tb.id?'text-slate-900':'text-slate-300'}`}/>''',
    '''{tb.img
                            ? <CImg name={tb.img} alt={tb.label} className={`w-5 h-5 sm:w-6 sm:h-6 transition-opacity duration-200 ${tab===tb.id?'opacity-100':'opacity-30'}`} />
                            : <tb.icon className={`w-3 h-3 ${tab===tb.id?'text-slate-900':'text-slate-300'}`}/>}'''
)

# ─────────────────────────────────────────────────────────────────────────────
# SECTION HEADERS — Disease, Risk, Protective
# ─────────────────────────────────────────────────────────────────────────────

# Disease
code = code.replace(
    '''<div className="px-4 py-2.5 border-b border-red-100 bg-red-50/50">
                            <h2 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">{t.diseaseIndicators}</h2>
                            <p className="text-[10px] text-red-400 mt-0.5">{t.diseaseIndSubtitle}</p>
                        </div>''',
    '''<div className="px-4 py-2.5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
                            <CImg name="ui_header_disease_single_23" alt="" className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 drop-shadow-sm" />
                            <div>
                                <h2 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">{t.diseaseIndicators}</h2>
                                <p className="text-[10px] text-red-400 mt-0.5">{t.diseaseIndSubtitle}</p>
                            </div>
                        </div>'''
)

# Risk
code = code.replace(
    '''<div className="px-4 py-2.5 border-b border-amber-100 bg-amber-50/50">
                            <h2 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t.riskFactors}</h2>
                            <p className="text-[10px] text-amber-400 mt-0.5">{t.riskFactSubtitle}</p>
                        </div>''',
    '''<div className="px-4 py-2.5 border-b border-amber-100 bg-amber-50/50 flex items-center gap-3">
                            <CImg name="ui_header_risk_single_21" alt="" className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 drop-shadow-sm" />
                            <div>
                                <h2 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t.riskFactors}</h2>
                                <p className="text-[10px] text-amber-400 mt-0.5">{t.riskFactSubtitle}</p>
                            </div>
                        </div>'''
)

# Protective
code = code.replace(
    '''<div className="px-4 py-2.5 border-b border-emerald-100 bg-emerald-50/50">
                            <h2 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t.protectiveFactors}</h2>
                            <p className="text-[10px] text-emerald-400 mt-0.5">{t.protFactSubtitle}</p>
                        </div>''',
    '''<div className="px-4 py-2.5 border-b border-emerald-100 bg-emerald-50/50 flex items-center gap-3">
                            <CImg name="ui_header_protective_single_22" alt="" className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 drop-shadow-sm" />
                            <div>
                                <h2 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t.protectiveFactors}</h2>
                                <p className="text-[10px] text-emerald-400 mt-0.5">{t.protFactSubtitle}</p>
                            </div>
                        </div>'''
)

# ─────────────────────────────────────────────────────────────────────────────
# PATIENT INFO HEADER
# ─────────────────────────────────────────────────────────────────────────────
code = code.replace(
    '''<div className="px-4 py-2.5 border-b border-slate-100"><h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.patientInfo}</h2></div>''',
    '''<div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-3">
                            <CImg name="ui_empty_single_24" alt="" className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 opacity-60" />
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.patientInfo}</h2>
                        </div>'''
)

# ─────────────────────────────────────────────────────────────────────────────
# RESULT VERDICT — outcome image
# ─────────────────────────────────────────────────────────────────────────────
code = code.replace(
    '''<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                                    {/* Verdict text */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/50 c-pulse-dot"/>''',
    '''<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                                    {/* Verdict text + outcome image */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <CImg
                                            name={OUTCOME_IMAGES[results.finalCat]}
                                            alt=""
                                            className="w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 drop-shadow-lg c-drift"
                                        />
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/50 c-pulse-dot"/>'''
)

# Close the extra wrapper div for the outcome image
# Find the closing of override tags and the parent div
code = code.replace(
    '''{results.orthoOverride&&<span className="bg-white/15 text-white/90 text-[9px] font-semibold px-2 py-0.5 rounded-md">{t.orthoOverride}</span>}
                                        </div>
                                    </div>''',
    '''{results.orthoOverride&&<span className="bg-white/15 text-white/90 text-[9px] font-semibold px-2 py-0.5 rounded-md">{t.orthoOverride}</span>}
                                        </div>
                                    </div>
                                    </div>'''
)

# ─────────────────────────────────────────────────────────────────────────────
# BALANCE IMAGE — above score breakdown
# ─────────────────────────────────────────────────────────────────────────────
code = code.replace(
    '''                    {/* ── Score breakdown bars ── */}
                    <div className="c-fade-up c-d1 grid grid-cols-3 gap-2">''',
    '''                    {/* ── Score breakdown bars ── */}
                    <div className="c-fade-up c-d1 flex justify-center">
                        <CImg name="ui_balance_single_25" alt="" className="w-12 h-12 sm:w-14 sm:h-14 opacity-50" />
                    </div>
                    <div className="c-fade-up c-d1 grid grid-cols-3 gap-2">'''
)

# ─────────────────────────────────────────────────────────────────────────────
# Write
# ─────────────────────────────────────────────────────────────────────────────
with open(app_path, "w", encoding="utf-8") as f:
    f.write(code)

print("✅ All images embedded and placed successfully!")
print(f"   File: {app_path}")
PYEOF

# ═══════════════════════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════════════════════
rm -f /tmp/_cambra_images_block.js

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ DONE! All 15 images embedded into App.jsx"
echo ""
echo "Image placements:"
echo "  🖼  ui_hero_single_20         → Welcome screen hero"
echo "  🖼  ui_loading_single_18      → Loading spinner screen"
echo "  🖼  ui_tab_patient_single_13  → Patient tab icon"
echo "  🖼  ui_tab_disease_single_14  → Disease tab icon"
echo "  🖼  ui_tab_protective_single_12 → Protective tab icon"
echo "  🖼  ui_tab_results_single_11  → Results tab icon"
echo "  🖼  ui_header_disease_single_23 → Disease section header"
echo "  🖼  ui_header_risk_single_21  → Risk section header"
echo "  🖼  ui_header_protective_single_22 → Protective section header"
echo "  🖼  ui_outcome_low_single_16  → Low risk result banner"
echo "  🖼  ui_outcome_moderate_single_15 → Moderate risk result"
echo "  🖼  ui_outcome_high_single_17 → High risk result"
echo "  🖼  ui_outcome_extreme_single_19 → Extreme risk result"
echo "  🖼  ui_balance_single_25      → Score breakdown decoration"
echo "  🖼  ui_empty_single_24        → Patient info header"
echo ""
echo "Backup: $BACKUP_FILE"
echo "═══════════════════════════════════════════════════════════════════"
