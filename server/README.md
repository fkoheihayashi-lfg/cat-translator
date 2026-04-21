# CAT Translator YAMNet Bridge

Minimal Flask server for Phase 1 real audio signal analysis.

## Setup

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

The server starts on `http://0.0.0.0:5001`.

Health check:

```bash
curl http://127.0.0.1:5001/health
```

API contract:
- Port: `5001`
- Health endpoint: `GET /health`
- Analysis endpoint: `POST /analyze-audio`
- Request format: `multipart/form-data`
- File field name: `audio`

## Expo App Config

Set these before starting Expo:

```bash
export EXPO_PUBLIC_AUDIO_ANALYSIS_PROVIDER=server
export EXPO_PUBLIC_AUDIO_ANALYSIS_URL=http://127.0.0.1:5001
```

Notes:
- iOS simulator: usually `http://127.0.0.1:5001`
- Android emulator: usually `http://10.0.2.2:5001`
- Physical iPhone / physical Android: use your Mac's LAN IP, for example `http://192.168.1.23:5001`
- Your phone and Mac must be on the same Wi-Fi network
- Flask must be running with host `0.0.0.0`, which this app already does
- If the server is unavailable, the app falls back to mock analysis automatically

Manual analysis check:

```bash
curl -X POST http://127.0.0.1:5001/analyze-audio \
  -F "audio=@/absolute/path/to/cat-audio.wav"
```

## What Is Real vs Mock

- Real:
  - file upload
  - 16 kHz mono preprocessing
  - YAMNet loading and inference when TensorFlow + TF Hub are available
  - weak signal output such as `meow_presence` and `animal_vocalization`
- Mock:
  - final intent-style interpretation shown in the app is still conservative app-side mapping
  - no hard claim like “hungry” or “angry” from the model alone

## Current Limitations

- YAMNet is a general audio model, not a cat-intent classifier
- First model load may be slow
- TensorFlow / TF Hub install is heavy for local development
- The endpoint is for local validation only and has no auth or production hardening

## Later For Production

- pinned local model assets instead of first-run model download
- tighter upload validation and rate limits
- background job / worker strategy for heavier inference
- better deployment story and monitoring
