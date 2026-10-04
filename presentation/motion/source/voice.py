"""Speaks the films' voice-over lines with Kokoro (open TTS model, Apache-2.0 weights, runs locally on the CPU).

    python voice.py lines.json outdir

lines.json: {"voice": "am_michael", "speed": 1.0, "lines": [{"id": "master-07", "text": "..."}, ...]}
Writes outdir/<id>.wav (24 kHz mono, leading/trailing silence trimmed) and prints {"<id>": seconds, ...} as JSON.

Needs `pip install kokoro-onnx soundfile` and the model files kokoro-v1.0.onnx + voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 in KOKORO_DIR (default ~/.cache/kokoro-onnx).
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


def trim(samples, sr, floor=0.008, pad=0.03):
    """Cut the silence around the speech, keeping a few milliseconds so consonants aren't clipped."""
    loud = np.where(np.abs(samples) > floor)[0]
    if not len(loud):
        return samples
    a = max(0, loud[0] - int(pad * sr))
    b = min(len(samples), loud[-1] + int(pad * sr))
    return samples[a:b]


def main():
    spec = json.load(open(sys.argv[1], encoding='utf8'))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    models = os.environ.get('KOKORO_DIR', os.path.expanduser('~/.cache/kokoro-onnx'))
    kokoro = Kokoro(os.path.join(models, 'kokoro-v1.0.onnx'), os.path.join(models, 'voices-v1.0.bin'))
    durations = {}
    for line in spec['lines']:
        samples, sr = kokoro.create(line['text'], voice=spec['voice'], speed=spec.get('speed', 1.0), lang='en-us')
        samples = trim(samples, sr)
        sf.write(os.path.join(out, line['id'] + '.wav'), samples, sr)
        durations[line['id']] = round(len(samples) / sr, 3)
        print(f"{line['id']}: {durations[line['id']]:.2f} s  {line['text']}", file=sys.stderr)
    print(json.dumps(durations))


if __name__ == '__main__':
    main()
