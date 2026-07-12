# Gosei

Gosei is an AI-powered multi-perspective discussion and decision platform.

The application uses:

* Vue for the frontend.
* Django REST Framework for the backend API.
* PostgreSQL for application data.
* Gemma 3 12B for AI inference.
* vLLM for OpenAI-compatible model serving.
* AMD GPU infrastructure for model inference.
* Cloudflare Quick Tunnel for temporary remote access to the inference API.
* Docker Compose for local application orchestration.

---

# Running Gosei

Gosei uses an **AMD AI Notebook** to host Gemma 3 12B.

The AI setup commands in this guide must be run inside an AMD AI Notebook.

The Gosei frontend, backend, and PostgreSQL database are started separately using Docker Compose on the machine hosting the Gosei repository.

The complete startup order is:

```text
1. Open a blank AMD AI Notebook
2. Install the AI environment and dependencies
3. Authenticate with Hugging Face
4. Start Gemma 3 12B using vLLM
5. Start a Cloudflare Quick Tunnel
6. Retrieve the AI API URL and API key
7. Create the local Gosei .env file
8. Run docker compose up --build
9. Initialise the Django database
10. Find the host machine's IP address
11. Open the host IP address in a browser
```

---

# Part 1 — AMD AI Notebook Setup

> All commands in this section must be run inside an AMD AI Notebook terminal.

Start from a new AMD AI Notebook environment.

Open a terminal inside the notebook.

This guide assumes the AMD AI Notebook is blank and that no previous Gosei AI environment exists.

---

# 1. Verify the AMD GPU Environment

Run:

```bash
hostname

rocm-smi --showproductname --showmeminfo vram
```

The AMD GPU and available VRAM should be displayed.

Gemma 3 12B inference uses the ROCm-capable AMD GPU provided by the notebook environment.

---

# 2. Install the Required System Dependencies

Install the required system packages:

```bash
apt-get install -y \
  curl \
  ca-certificates \
  git
```

Install `uv`:

```bash
python3 -m pip install --upgrade uv
```

Create the Gosei AI directories:

```bash
mkdir -p \
  /opt/gosei-ai \
  /model-cache/huggingface
```

Move into the AI environment directory:

```bash
cd /opt/gosei-ai
```

Configure the `uv` directories:

```bash
export UV_PYTHON_INSTALL_DIR="/opt/gosei-ai/python"
export UV_PYTHON_BIN_DIR="/opt/gosei-ai/bin"
export UV_CACHE_DIR="/opt/gosei-ai/uv-cache"
```

Install Python 3.12:

```bash
uv python install 3.12
```

Create the Gosei virtual environment:

```bash
uv venv \
  --python 3.12 \
  /opt/gosei-ai/.venv
```

Activate the environment:

```bash
source /opt/gosei-ai/.venv/bin/activate
```

---

# 3. Install vLLM for AMD ROCm

With the virtual environment active, install the ROCm 7.2.1 vLLM nightly build:

```bash
uv pip install vllm \
  --pre \
  --extra-index-url https://wheels.vllm.ai/rocm/nightly/rocm721 \
  --upgrade
```

Install the Hugging Face command-line tools:

```bash
uv pip install --upgrade huggingface_hub
```

Verify the AI environment:

```bash
python - <<'PY'
import torch
import vllm

print("vLLM:", vllm.__version__)
print("PyTorch:", torch.__version__)
print("ROCm/HIP:", torch.version.hip)
print("GPU available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
PY
```

A successful environment should show:

```text
GPU available: True
```

---

# 4. Authenticate with Hugging Face

Gemma 3 12B is downloaded from Hugging Face.

The Hugging Face account used during setup must have access to:

```text
google/gemma-3-12b-it
```

Configure the model cache:

```bash
export HF_HOME="/model-cache/huggingface"
```

Authenticate with Hugging Face:

```bash
hf auth login
```

Paste the Hugging Face access token when prompted.

The Gemma model files will automatically be downloaded when vLLM starts for the first time.

---

# 5. Generate the vLLM API Key

Create a secure API key for the Gosei inference endpoint:

```bash
umask 077

python - <<'PY' > /opt/gosei-ai/vllm-api-key
import secrets
print(secrets.token_urlsafe(48))
PY
```

Load the generated API key:

```bash
export VLLM_API_KEY="$(
cat /opt/gosei-ai/vllm-api-key
)"
```

Confirm that the key was created:

```bash
echo "API key created."
```

---

# 6. Start Gemma 3 12B Using vLLM

Ensure the Python environment is active:

```bash
source /opt/gosei-ai/.venv/bin/activate
```

Configure the Hugging Face cache:

```bash
export HF_HOME="/model-cache/huggingface"
```

Load the generated vLLM API key:

```bash
export VLLM_API_KEY="$(
cat /opt/gosei-ai/vllm-api-key
)"
```

Start Gemma 3 12B:

```bash
vllm serve google/gemma-3-12b-it \
  --host 127.0.0.1 \
  --port 8001 \
  --dtype bfloat16 \
  --language-model-only \
  --max-model-len 16384 \
  --gpu-memory-utilization 0.90 \
  --served-model-name gosei-gemma \
  --generation-config vllm \
  --structured-outputs-config '{"backend":"xgrammar","disable_any_whitespace":true}' \
  --no-async-scheduling \
  --api-key "$VLLM_API_KEY"
```

Leave this AMD AI Notebook terminal running.

During the first startup, vLLM may need to download the Gemma model before the API becomes available.

Once startup is complete, the model is exposed inside the AMD AI Notebook at:

```text
http://127.0.0.1:8001/v1
```

---

# 7. Test the Local vLLM API

Open a **second terminal inside the AMD AI Notebook**.

Load the generated API key:

```bash
export VLLM_API_KEY="$(
cat /opt/gosei-ai/vllm-api-key
)"
```

Test the model endpoint:

```bash
curl -sS \
  http://127.0.0.1:8001/v1/models \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  | python -m json.tool
```

A successful response should contain:

```text
gosei-gemma
```

The Gemma inference API is now running correctly inside the AMD AI Notebook.

---

# 8. Install Cloudflare Tunnel

The vLLM server currently only listens inside the AMD AI Notebook.

A Cloudflare Quick Tunnel is used to temporarily make the vLLM endpoint accessible to the machine running Gosei.

In the second AMD AI Notebook terminal, install `cloudflared`:

```bash
curl -kL \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared
```

Make the binary executable:

```bash
chmod +x /usr/local/bin/cloudflared
```

Verify the installation:

```bash
cloudflared --version
```

The `-k` option is only used for this download because the AMD AI Notebook environment may present a self-signed certificate in its HTTPS certificate chain.

---

# 9. Start the Cloudflare Quick Tunnel

Run:

```bash
cloudflared tunnel \
  --loglevel info \
  --logfile /tmp/cloudflared.log \
  --url http://127.0.0.1:8001
```

Leave this AMD AI Notebook terminal running.

A temporary `trycloudflare.com` URL will be generated.

No Cloudflare account is required.

The terminal should report that the tunnel connection has been registered successfully.

---

# 10. Retrieve the AI API Configuration

Open a **third terminal inside the AMD AI Notebook**.

Retrieve the Gosei AI base URL:

```bash
echo "AI_BASE_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log | tail -n 1)/v1"
```

Example output:

```env
AI_BASE_URL=https://example-random-tunnel.trycloudflare.com/v1
```

Retrieve the generated API key:

```bash
echo "AI_API_KEY=$(cat /opt/gosei-ai/vllm-api-key)"
```

Example output:

```env
AI_API_KEY=generated-api-key
```

Copy both values.

They are required when creating the Gosei `.env` file.

> The Cloudflare Quick Tunnel URL changes when a new tunnel is created.

Always use the URL generated by the currently running tunnel.

---

# Part 2 — Create the Gosei Environment File

> The remaining commands are run on the machine containing the Gosei repository.

Open a terminal in the Gosei project directory.

Create a file named:

```text
.env
```

Add the following configuration:

```env
POSTGRES_DB=gosei_db
POSTGRES_USER=gosei_user
POSTGRES_PASSWORD=gosei_password
POSTGRES_HOST=gosei-db
POSTGRES_PORT=5432

DJANGO_SECRET_KEY=dev-secret-key-change-later
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=*

VITE_API_URL=http://localhost:8000/api

AI_BASE_URL=PASTE_THE_GENERATED_AI_BASE_URL_HERE
AI_API_KEY=PASTE_THE_GENERATED_AI_API_KEY_HERE
AI_MODEL=gosei-gemma
AI_TIMEOUT_SECONDS=300
AI_MAX_RETRIES=2
AI_TEMPERATURE=0.7
```

Replace:

```text
PASTE_THE_GENERATED_AI_BASE_URL_HERE
```

with the `AI_BASE_URL` printed inside the AMD AI Notebook.

Replace:

```text
PASTE_THE_GENERATED_AI_API_KEY_HERE
```

with the `AI_API_KEY` printed inside the AMD AI Notebook.

For example:

```env
AI_BASE_URL=https://example-random-tunnel.trycloudflare.com/v1
AI_API_KEY=example-generated-api-key
AI_MODEL=gosei-gemma
AI_TIMEOUT_SECONDS=300
AI_MAX_RETRIES=2
AI_TEMPERATURE=0.7
```

Do not add quotation marks around the environment variable values.

---

# Part 3 — Start Gosei Using Docker Compose

After the AMD AI API is running and the `.env` file has been created, run:

```bash
docker compose up --build
```

Leave this terminal running.

This starts:

* The Gosei Django API.
* The Gosei Vue frontend.
* PostgreSQL.
* Supporting Gosei containers.

The Gosei backend connects to Gemma 3 12B using the AI configuration stored in `.env`.

---

# Part 4 — First-Time Database Initialisation

When Gosei is started for the first time, the containers must be running before the Django database can be initialised.

Once:

```bash
docker compose up --build
```

is running, open a **second terminal on the Gosei host machine**.

Run:

```bash
docker exec -it gosei-api sh -c "
cd /config &&
python manage.py migrate &&
python manage.py check
"
```

This will:

* Apply all Django database migrations.
* Create the required PostgreSQL tables.
* Verify the Django project configuration.

After the command completes successfully, the application is ready to use.

---

# Part 5 — Find the Gosei Host Machine IP Address

Gosei is opened in a web browser using the IP address of the machine running Docker Compose.

This is the same machine where the following command was run:

```bash
docker compose up --build
```

> Do not use the AMD AI Notebook IP address.

The AMD AI Notebook only hosts the Gemma AI model.

The IP address required here belongs to the machine running the Gosei Docker containers.

Follow the instructions for the operating system being used.

---

## Windows

On Windows, open **Command Prompt** or **PowerShell**.

### Step 1 — Open a terminal

Press:

```text
Windows Key + R
```

Type:

```text
cmd
```

Press:

```text
Enter
```

A Command Prompt window will open.

---

### Step 2 — Display the network information

Run:

```powershell
ipconfig
```

A list of network adapters will be displayed.

The output may contain several sections such as:

```text
Ethernet adapter Ethernet
Wireless LAN adapter Wi-Fi
Ethernet adapter vEthernet
Ethernet adapter Docker
Tunnel adapter
```

Find the adapter currently being used to connect the machine to the network.

Normally this will be one of the following:

```text
Wireless LAN adapter Wi-Fi
```

or:

```text
Ethernet adapter Ethernet
```

---

### Step 3 — Find the IPv4 Address

Inside the active Wi-Fi or Ethernet adapter section, look for:

```text
IPv4 Address
```

For example:

```text
Wireless LAN adapter Wi-Fi:

   IPv4 Address. . . . . . . . . . . : 192.168.1.54
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

In this example, the Gosei host IP address is:

```text
192.168.1.54
```

Copy the value shown next to:

```text
IPv4 Address
```

---

### How to Identify the Correct Windows IP Address

The correct IP will normally begin with one of these private network ranges:

```text
192.168.x.x
10.x.x.x
172.16.x.x to 172.31.x.x
```

Common examples are:

```text
192.168.0.25
192.168.1.54
10.0.0.15
172.20.10.4
```

Do not use:

```text
127.0.0.1
```

This is the local loopback address.

Do not select an IP from an adapter named:

```text
Docker
vEthernet
WSL
VirtualBox
VMware
Tunnel
Tailscale
VPN
```

unless that virtual or VPN network is intentionally being used to access Gosei.

For a normal Wi-Fi connection, use the IPv4 address under:

```text
Wireless LAN adapter Wi-Fi
```

For a normal wired network connection, use the IPv4 address under:

```text
Ethernet adapter Ethernet
```

---

### Step 4 — Open Gosei

Open a web browser.

Enter:

```text
http://HOST_MACHINE_IP
```

Replace `HOST_MACHINE_IP` with the IPv4 address found above.

For example:

```text
http://192.168.1.54
```

Press:

```text
Enter
```

Gosei should open in the browser.

---

## Linux

On Linux, open a terminal.

### Step 1 — Find the Primary Network IP Address

Run:

```bash
ip route get 1.1.1.1
```

Example output:

```text
1.1.1.1 via 192.168.1.1 dev wlan0 src 192.168.1.54 uid 1000
```

Look for the value immediately after:

```text
src
```

In this example:

```text
src 192.168.1.54
```

The Gosei host IP address is therefore:

```text
192.168.1.54
```

For a command that prints only the IP address, run:

```bash
ip route get 1.1.1.1 | awk '{print $7; exit}'
```

Example output:

```text
192.168.1.54
```

Copy the displayed IP address.

---

### Alternative Linux Command

The following command can also be used:

```bash
hostname -I
```

Example:

```text
192.168.1.54 172.18.0.1 172.19.0.1
```

This command may display several IP addresses.

In this example:

```text
192.168.1.54
```

is the normal network IP.

The following addresses:

```text
172.18.0.1
172.19.0.1
```

are likely Docker network addresses and should not be used to open Gosei.

When several addresses are shown, prefer the IP returned by:

```bash
ip route get 1.1.1.1 | awk '{print $7; exit}'
```

---

### How to Identify the Correct Linux IP Address

The correct IP will normally begin with:

```text
192.168.x.x
10.x.x.x
172.16.x.x to 172.31.x.x
```

Do not use:

```text
127.0.0.1
```

Do not use Docker bridge addresses unless Docker networking is intentionally being accessed directly.

Common Docker network addresses may appear as:

```text
172.17.0.1
172.18.0.1
172.19.0.1
```

The correct address should belong to the machine's active Wi-Fi or Ethernet connection.

The active network interface may have a name such as:

```text
wlan0
wlp2s0
eth0
enp3s0
```

---

### Step 2 — Open Gosei

Open a web browser.

Enter:

```text
http://HOST_MACHINE_IP
```

Replace `HOST_MACHINE_IP` with the IP address found above.

For example:

```text
http://192.168.1.54
```

Press:

```text
Enter
```

Gosei should open in the browser.

---

# Quick IP Selection Guide

Use this checklist when selecting the host IP address.

The correct IP:

```text
- Belongs to the machine running docker compose up --build
- Is an IPv4 address
- Usually begins with 192.168, 10, or 172.16 to 172.31
- Belongs to the active Wi-Fi or Ethernet connection
```

Do not use:

```text
127.0.0.1
```

Do not use the AMD AI Notebook IP address.

Do not use a Docker adapter IP.

Do not use a WSL, VirtualBox, VMware, VPN, or tunnel adapter IP unless that network is intentionally being used.

The final browser address should look similar to:

```text
http://192.168.1.54
```

The IP address will be different depending on the machine and network being used.

---

# Complete First-Time Startup Summary

## AMD AI Notebook — Terminal 1

Install the complete AI environment:

```bash
apt-get update

apt-get install -y \
  curl \
  ca-certificates \
  git

python3 -m pip install --upgrade uv

mkdir -p \
  /opt/gosei-ai \
  /model-cache/huggingface

cd /opt/gosei-ai

export UV_PYTHON_INSTALL_DIR="/opt/gosei-ai/python"
export UV_PYTHON_BIN_DIR="/opt/gosei-ai/bin"
export UV_CACHE_DIR="/opt/gosei-ai/uv-cache"

uv python install 3.12

uv venv \
  --python 3.12 \
  /opt/gosei-ai/.venv

source /opt/gosei-ai/.venv/bin/activate

uv pip install vllm \
  --pre \
  --extra-index-url https://wheels.vllm.ai/rocm/nightly/rocm721 \
  --upgrade

uv pip install --upgrade huggingface_hub

export HF_HOME="/model-cache/huggingface"

hf auth login
```

Generate the API key:

```bash
umask 077

python - <<'PY' > /opt/gosei-ai/vllm-api-key
import secrets
print(secrets.token_urlsafe(48))
PY
```

Start Gemma 3 12B:

```bash
source /opt/gosei-ai/.venv/bin/activate

export HF_HOME="/model-cache/huggingface"

export VLLM_API_KEY="$(
cat /opt/gosei-ai/vllm-api-key
)"

vllm serve google/gemma-3-12b-it \
  --host 127.0.0.1 \
  --port 8001 \
  --dtype bfloat16 \
  --language-model-only \
  --max-model-len 16384 \
  --gpu-memory-utilization 0.90 \
  --served-model-name gosei-gemma \
  --generation-config vllm \
  --structured-outputs-config '{"backend":"xgrammar","disable_any_whitespace":true}' \
  --no-async-scheduling \
  --api-key "$VLLM_API_KEY"
```

Leave Terminal 1 running.

---

## AMD AI Notebook — Terminal 2

Install Cloudflare Tunnel:

```bash
curl -kL \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared

chmod +x /usr/local/bin/cloudflared

cloudflared --version
```

Start the Cloudflare Quick Tunnel:

```bash
cloudflared tunnel \
  --loglevel info \
  --logfile /tmp/cloudflared.log \
  --url http://127.0.0.1:8001
```

Leave Terminal 2 running.

---

## AMD AI Notebook — Terminal 3

Retrieve the AI environment values:

```bash
echo "AI_BASE_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log | tail -n 1)/v1"

echo "AI_API_KEY=$(cat /opt/gosei-ai/vllm-api-key)"
```

Copy both values.

---

## Gosei Host Machine

Create `.env`:

```env
POSTGRES_DB=gosei_db
POSTGRES_USER=gosei_user
POSTGRES_PASSWORD=gosei_password
POSTGRES_HOST=gosei-db
POSTGRES_PORT=5432

DJANGO_SECRET_KEY=dev-secret-key-change-later
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=*

VITE_API_URL=http://localhost:8000/api

AI_BASE_URL=PASTE_THE_GENERATED_AI_BASE_URL_HERE
AI_API_KEY=PASTE_THE_GENERATED_AI_API_KEY_HERE
AI_MODEL=gosei-gemma
AI_TIMEOUT_SECONDS=300
AI_MAX_RETRIES=2
AI_TEMPERATURE=0.7
```

Start Gosei:

```bash
docker compose up --build
```

Leave the Docker containers running.

Open another terminal and initialise the database:

```bash
docker exec -it gosei-api sh -c "
cd /config &&
python manage.py migrate &&
python manage.py check
"
```

Find the host machine IP address:

```bash
hostname -I | awk '{print $1}'
```

Example output:

```text
192.168.1.54
```

Open the following URL in a browser:

```text
http://192.168.1.54
```

Replace the example IP address with the IP printed by the host machine.

Gosei is now ready to use.

---

# Normal Startup

After the initial dependency and database setup has been completed:

1. Start vLLM inside the AMD AI Notebook.
2. Start the Cloudflare Quick Tunnel inside the AMD AI Notebook.
3. Retrieve the current Cloudflare tunnel URL.
4. Update `AI_BASE_URL` in `.env` if the tunnel URL has changed.
5. Start Gosei.
6. Find the Gosei host IP address.
7. Open the host IP address in a browser.

Start Gosei:

```bash
docker compose up
```

To rebuild the application images:

```bash
docker compose up --build
```

Find the host IP:

```bash
hostname -I | awk '{print $1}'
```

Then open:

```text
http://HOST_MACHINE_IP
```

in the browser.

---

# Testing the Remote AI API

After the Cloudflare tunnel is running, the remote inference endpoint can be tested from the Gosei host machine.

Replace the URL and API key with the values generated inside the AMD AI Notebook:

```bash
curl -sS \
  https://example-random-tunnel.trycloudflare.com/v1/models \
  -H "Authorization: Bearer example-generated-api-key" \
  | python -m json.tool
```

A successful response should contain:

```text
gosei-gemma
```

A chat completion can also be tested:

```bash
curl -sS \
  https://example-random-tunnel.trycloudflare.com/v1/chat/completions \
  -H "Authorization: Bearer example-generated-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gosei-gemma",
    "messages": [
      {
        "role": "user",
        "content": "Respond with the word ready."
      }
    ],
    "stream": false
  }' \
  | python -m json.tool
```

---

# Stopping Gosei

To stop the Docker containers, press:

```text
Ctrl + C
```

Then run:

```bash
docker compose down
```

To stop the Cloudflare Quick Tunnel, press:

```text
Ctrl + C
```

inside AMD AI Notebook Terminal 2.

To stop vLLM and Gemma 3 12B, press:

```text
Ctrl + C
```

inside AMD AI Notebook Terminal 1.

---

# Fresh Development Database

> Warning: This deletes the Docker PostgreSQL volume and all development data stored inside it.

Run:

```bash
docker compose down -v --remove-orphans
```

Start Gosei again:

```bash
docker compose up --build
```

Leave the containers running.

Open another terminal and initialise the new database:

```bash
docker exec -it gosei-api sh -c "
cd /config &&
python manage.py migrate &&
python manage.py check
"
```

The new PostgreSQL database will contain all required Django tables.

Find the host IP again:

```bash
hostname -I | awk '{print $1}'
```

Open the returned IP address in the browser:

```text
http://HOST_MACHINE_IP
```

Gosei is ready to use.
#   G o s e i  
 #   G o s e i  
 