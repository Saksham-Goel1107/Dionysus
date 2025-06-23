import requests
import subprocess
import os
import sys

# === Get Mermaid code ===
def get_mermaid_code(username, repo, api_url="https://api.gitdiagram.com/generate/stream"):
    response = requests.post(api_url, json={"username": username, "repo": repo}, stream=True)
    if not response.ok:
        raise Exception(f"API request failed: {response.status_code} {response.text}")

    chunks = []
    for chunk in response.iter_lines():
        try:
            text = chunk.decode()
            if '"status": "diagram_chunk"' in text:
                start = text.find('"chunk": "') + len('"chunk": "')
                end = text.rfind('"')
                chunk_text = text[start:end].encode('utf-8').decode('unicode_escape')
                chunks.append(chunk_text)
        except Exception:
            continue

    mermaid_code = ''.join(chunks)
    print("=== Mermaid Code Start ===")
    print(mermaid_code)
    print("=== Mermaid Code End ===")

    if not mermaid_code.strip().startswith(("graph", "flowchart", "sequenceDiagram", "classDiagram")):
        print("Invalid Mermaid code:\n", mermaid_code)
        raise Exception("Invalid Mermaid code received")

    return mermaid_code

# === Convert to PNG ===
def mermaid_to_png(mermaid_code, output_png_path):
    temp_dir = os.getcwd()
    mmd_path = os.path.join(temp_dir, "temp.mmd")

    with open(mmd_path, 'w', encoding='utf-8') as f:
        f.write(mermaid_code)

    docker_cmd = [
        "docker", "run", "--rm",
        "-v", f"{temp_dir}:/data",
        "minlag/mermaid-cli",
        "-i", "/data/temp.mmd",
        "-o", f"/data/{output_png_path}",
        "--scale", "4",
        "--backgroundColor", "transparent"
    ]

    try:
        subprocess.check_call(docker_cmd)
    finally:
        if os.path.exists(mmd_path):
            os.remove(mmd_path)

# === MAIN ENTRY ===
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
