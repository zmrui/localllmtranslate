# localllmtranslate

Google-Translate-style local UI for LM Studio.

[https://localllmtranslate.pages.dev/](https://localllmtranslate.pages.dev/)

## Run

1. Start LM Studio local server at `http://100.119.189.17:1234`.
2. Load a model in LM Studio.
3. Open `index.html` in a browser (or serve this folder with a static server).
4. Choose a model from the **Model** dropdown (default: `qwen3-4b`).
5. If needed, change **LLM API Address** (for example: `http://100.119.189.17:1234`) and click **Apply API**.
6. Enter source text and click **Translate**.

## Notes

- Endpoints are derived from **LLM API Address**:
  - `{base}/v1/models`
  - `{base}/v1/chat/completions`
- No conversation history.
- No local storage (`localStorage`, `indexedDB`, cookies).
