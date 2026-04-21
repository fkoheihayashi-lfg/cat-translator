from __future__ import annotations

import os
import tempfile
import urllib.request
from dataclasses import dataclass
from typing import Any

import librosa
import numpy as np
from flask import Flask, jsonify, request


YAMNET_HANDLE = "https://tfhub.dev/google/yamnet/1"
CLASS_MAP_CSV = "https://storage.googleapis.com/audioset/yamnet/yamnet_class_map.csv"
TARGET_SAMPLE_RATE = 16000

app = Flask(__name__)


def clamp01(value: float) -> float:
    return float(max(0.0, min(1.0, value)))


@dataclass
class YAMNetSignals:
    meow_presence: float
    animal_vocalization: float
    vocalization_presence: float
    class_names: list[str]
    notes: list[str]


class YAMNetBridge:
    def __init__(self) -> None:
        self._model = None
        self._class_names = None
        self._load_error: str | None = None

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._class_names is not None:
            return
        if self._load_error is not None:
            raise RuntimeError(self._load_error)

        try:
            import tensorflow as tf  # type: ignore
            import tensorflow_hub as hub  # type: ignore
        except Exception as exc:  # pragma: no cover - dependency failure path
            self._load_error = f"tensorflow import failed: {exc}"
            raise RuntimeError(self._load_error) from exc

        try:
            self._model = hub.load(YAMNET_HANDLE)
            with urllib.request.urlopen(CLASS_MAP_CSV) as response:
                lines = response.read().decode("utf-8").splitlines()[1:]
            self._class_names = [line.split(",")[2] for line in lines if line]
        except Exception as exc:  # pragma: no cover - model download/load path
            self._load_error = f"yamnet load failed: {exc}"
            raise RuntimeError(self._load_error) from exc

    def analyze(self, waveform: np.ndarray) -> YAMNetSignals:
        self._ensure_loaded()
        assert self._model is not None
        assert self._class_names is not None

        import tensorflow as tf  # type: ignore

        scores, _, _ = self._model(tf.convert_to_tensor(waveform, dtype=tf.float32))
        mean_scores = np.mean(scores.numpy(), axis=0)

        matched_scores: dict[str, float] = {
            "meow_presence": 0.0,
            "animal_vocalization": 0.0,
            "vocalization_presence": 0.0,
        }
        matched_names: list[str] = []

        for index, class_name in enumerate(self._class_names):
            normalized = class_name.lower()
            score = float(mean_scores[index])

            if "meow" in normalized:
                matched_scores["meow_presence"] = max(matched_scores["meow_presence"], score)
                matched_names.append(class_name)
            if "animal" in normalized and (
                "vocal" in normalized or "pet" in normalized or "cat" in normalized
            ):
                matched_scores["animal_vocalization"] = max(
                    matched_scores["animal_vocalization"], score
                )
                matched_names.append(class_name)
            if "vocal" in normalized or "yowl" in normalized or "purr" in normalized:
                matched_scores["vocalization_presence"] = max(
                    matched_scores["vocalization_presence"], score
                )
                matched_names.append(class_name)

        return YAMNetSignals(
            meow_presence=clamp01(matched_scores["meow_presence"]),
            animal_vocalization=clamp01(matched_scores["animal_vocalization"]),
            vocalization_presence=clamp01(matched_scores["vocalization_presence"]),
            class_names=sorted(set(matched_names))[:8],
            notes=[],
        )


yamnet_bridge = YAMNetBridge()


def load_audio_waveform(file_path: str) -> np.ndarray:
    waveform, _ = librosa.load(file_path, sr=TARGET_SAMPLE_RATE, mono=True)
    if waveform.size == 0:
        raise ValueError("empty waveform")
    waveform = np.nan_to_num(waveform, nan=0.0, posinf=0.0, neginf=0.0)
    return waveform.astype(np.float32)


def build_response(signals: YAMNetSignals) -> dict[str, Any]:
    confidence = max(
        signals.meow_presence,
        signals.animal_vocalization * 0.9,
        signals.vocalization_presence * 0.7,
    )
    notes = list(signals.notes)
    if signals.class_names:
        notes.append("matched_classes=" + ", ".join(signals.class_names))

    return {
        "ok": True,
        "source": "yamnet_server",
        "scores": {
            "meow_presence": round(signals.meow_presence, 4),
            "animal_vocalization": round(signals.animal_vocalization, 4),
            "vocalization_presence": round(signals.vocalization_presence, 4),
        },
        "signalSummary": {
            "hasCatLikeVocalization": confidence >= 0.18,
            "confidence": round(clamp01(confidence), 4),
        },
        "notes": notes,
    }


@app.get("/health")
def health() -> Any:
    return jsonify({"ok": True, "service": "yamnet_server"})


@app.post("/analyze-audio")
def analyze_audio() -> Any:
    audio = request.files.get("audio")
    if audio is None:
        return jsonify({"ok": False, "error": "missing audio file"}), 400

    suffix = os.path.splitext(audio.filename or "")[1] or ".wav"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            temp_file.write(audio.read())

        waveform = load_audio_waveform(temp_path)
        signals = yamnet_bridge.analyze(waveform)
        return jsonify(build_response(signals))
    except Exception as exc:
        return (
            jsonify(
                {
                    "ok": False,
                    "source": "yamnet_server",
                    "error": str(exc),
                    "notes": [
                        "YAMNet inference unavailable or preprocessing failed.",
                        "The app should fall back to mock analysis.",
                    ],
                }
            ),
            500,
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
