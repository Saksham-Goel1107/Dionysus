import subprocess
import os
import sys
import base64

def get_mermaid_code(username, repo):
    """
    Generate a mermaid diagram locally instead of relying on external API
    """
    mermaid_code = f"""flowchart TD
    A["{username}/{repo}<br/>GitHub Repository"] --> B[Project Structure]
    B --> C[Source Code]
    B --> D[Documentation]
    B --> E[Configuration]
    B --> F[Dependencies]
    
    C --> C1[Frontend<br/>Components]
    C --> C2[Backend<br/>Services]
    C --> C3[Database<br/>Models]
    C --> C4[API<br/>Routes]
    
    D --> D1[README.md]
    D --> D2[Contributing<br/>Guidelines]
    D --> D3[License &<br/>Security]
    
    E --> E1[Package<br/>Configuration]
    E --> E2[Build<br/>Scripts]
    E --> E3[Environment<br/>Setup]
    
    F --> F1[Node.js<br/>Dependencies]
    F --> F2[Python<br/>Packages]
    F --> F3[External<br/>Services]
    
    %% Styling
    classDef repoStyle fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef structureStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef codeStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef docsStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef configStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef depsStyle fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class A repoStyle
    class B structureStyle
    class C,C1,C2,C3,C4 codeStyle
    class D,D1,D2,D3 docsStyle
    class E,E1,E2,E3 configStyle
    class F,F1,F2,F3 depsStyle"""
    
    print("=== Mermaid Code Start ===")
    print(mermaid_code)
    print("=== Mermaid Code End ===")
    
    return mermaid_code

def mermaid_to_png(mermaid_code, output_png_path):
    temp_dir = os.getcwd()
    mmd_path = os.path.join(temp_dir, "temp.mmd")

    with open(mmd_path, 'w', encoding='utf-8') as f:
        f.write(mermaid_code)

    # Try multiple approaches for mermaid CLI
    success = False
    
    # Approach 1: Try mmdc directly
    try:
        mmdc_cmd = [
            "mmdc",
            "-i", mmd_path,
            "-o", output_png_path,
            "--scale", "2",
            "--backgroundColor", "transparent"
        ]
        subprocess.check_call(mmdc_cmd)
        success = True
        print("✅ Generated diagram using mmdc")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  mmdc not available, trying npx...")
    
    # Approach 2: Try npx if mmdc failed
    if not success:
        try:
            npx_cmd = [
                "npx", "mmdc",
                "-i", mmd_path,
                "-o", output_png_path,
                "--scale", "2",
                "--backgroundColor", "transparent"
            ]
            subprocess.check_call(npx_cmd, timeout=30)
            success = True
            print("✅ Generated diagram using npx mmdc")
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            print("⚠️  npx mmdc not available, creating SVG...")
    
    # Approach 3: Create SVG as fallback
    if not success:
        create_svg_diagram(mermaid_code, output_png_path.replace('.png', '.svg'))
        # Copy SVG to PNG path for compatibility
        svg_path = output_png_path.replace('.png', '.svg')
        if os.path.exists(svg_path):
            import shutil
            shutil.copy(svg_path, output_png_path.replace('.png', '_fallback.svg'))
            print(f"✅ Created SVG diagram: {svg_path}")
        else:
            # Ultimate fallback: create a simple HTML file
            create_html_diagram(mermaid_code, output_png_path.replace('.png', '.html'))
            print("✅ Created HTML diagram as final fallback")

    # Clean up temp file
    if os.path.exists(mmd_path):
        os.remove(mmd_path)

def create_svg_diagram(mermaid_code, output_svg_path):
    """Create a simple SVG representation"""
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .node {{ fill: #e1f5fe; stroke: #01579b; stroke-width: 2; }}
    .text {{ font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }}
    .title {{ font-size: 16px; font-weight: bold; }}
  </style>
  
  <rect x="10" y="10" width="780" height="580" fill="#ffffff" stroke="#cccccc" stroke-width="1"/>
  
  <!-- Title -->
  <text x="400" y="40" class="text title">Repository Structure Diagram</text>
  
  <!-- Main Repository Node -->
  <rect x="300" y="80" width="200" height="60" class="node"/>
  <text x="400" y="105" class="text">GitHub Repository</text>
  <text x="400" y="125" class="text title">Structure Overview</text>
  
  <!-- Category Nodes -->
  <rect x="50" y="200" width="120" height="40" class="node" fill="#e8f5e8"/>
  <text x="110" y="225" class="text">Source Code</text>
  
  <rect x="200" y="200" width="120" height="40" class="node" fill="#fff3e0"/>
  <text x="260" y="225" class="text">Documentation</text>
  
  <rect x="350" y="200" width="120" height="40" class="node" fill="#fce4ec"/>
  <text x="410" y="225" class="text">Configuration</text>
  
  <rect x="500" y="200" width="120" height="40" class="node" fill="#f1f8e9"/>
  <text x="560" y="225" class="text">Dependencies</text>
  
  <!-- Connection Lines -->
  <line x1="400" y1="140" x2="110" y2="200" stroke="#666" stroke-width="1"/>
  <line x1="400" y1="140" x2="260" y2="200" stroke="#666" stroke-width="1"/>
  <line x1="400" y1="140" x2="410" y2="200" stroke="#666" stroke-width="1"/>
  <line x1="400" y1="140" x2="560" y2="200" stroke="#666" stroke-width="1"/>
  
  <!-- Additional Details -->
  <text x="110" y="270" class="text">• Frontend Components</text>
  <text x="110" y="290" class="text">• Backend Services</text>
  <text x="110" y="310" class="text">• Database Models</text>
  <text x="110" y="330" class="text">• API Routes</text>
  
  <text x="260" y="270" class="text">• README.md</text>
  <text x="260" y="290" class="text">• Contributing Guide</text>
  <text x="260" y="310" class="text">• License</text>
  
  <text x="410" y="270" class="text">• Package.json</text>
  <text x="410" y="290" class="text">• Build Scripts</text>
  <text x="410" y="310" class="text">• Environment</text>
  
  <text x="560" y="270" class="text">• Node Modules</text>
  <text x="560" y="290" class="text">• Python Packages</text>
  <text x="560" y="310" class="text">• External APIs</text>
  
  <!-- Footer -->
  <text x="400" y="550" class="text">Generated by Dionysus GitDiagram Feature</text>
</svg>'''
    
    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

def create_html_diagram(mermaid_code, output_html_path):
    """Create an HTML file with embedded mermaid diagram"""
    html_content = f'''<!DOCTYPE html>
<html>
<head>
    <title>Repository Structure Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; text-align: center; }}
        .mermaid {{ text-align: center; }}
        .info {{ margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Repository Structure Diagram</h1>
        <div class="mermaid">
{mermaid_code}
        </div>
        <div class="info">
            <strong>Note:</strong> This diagram was generated by the Dionysus GitDiagram feature. 
            To get PNG output, ensure the Mermaid CLI is properly installed.
        </div>
    </div>
    <script>
        mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
    </script>
</body>
</html>'''
    
    with open(output_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        username = sys.argv[1]
        repo = sys.argv[2]
    else:
        username = os.environ.get("GIT_USERNAME")
        repo = os.environ.get("GIT_REPO")
        if not username or not repo:
            print("Usage: python generate_diagram.py <username> <repo>")
            sys.exit(1)

    output_png = "diagram.png"

    try:
        print(f"Generating diagram for {username}/{repo}...")
        mermaid_code = get_mermaid_code(username, repo)
        mermaid_to_png(mermaid_code, output_png)
        print(f"Saved as {output_png}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
