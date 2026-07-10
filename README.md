# Kaiwa - Japanese Conversation Practice

> Kaiwa 不负责教你日语，它负责让你每天愿意开口说日语。

## Quick Start

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的 API Key：
```
VITE_MIMO_API_KEY=your_mimo_api_key_here
VITE_TTS_API_KEY=your_tts_api_key_here
```

3. 安装依赖并启动：
```bash
npm install
npm run dev
```

Open http://localhost:3000 in Chrome/Edge.

## Features

- 🎤 Voice input (hold to speak)
- 🤖 AI conversation partner
- 💡 Hints with pronunciation
- 📊 Feedback after conversation

## Tech Stack

- Vue3 + Vite + Tailwind CSS
- MiMo mimo-v2.5 (multimodal LLM) - 对话和发音评估
- 豆包TTS 2.0 (text-to-speech) - 日语语音合成

## API Keys

你需要获取以下 API Key：

1. **MiMo API Key** - 从 [小米MiMo控制台](https://platform.xiaomimimo.com/console/plan-manage) 获取
2. **豆包TTS API Key** - 从 [火山方舟控制台](https://console.volcengine.com/speech/new/setting/apikeys) 获取

## Security

API Key 存储在 `.env` 文件中，该文件已被 `.gitignore` 忽略，不会上传到仓库。
