# Blaine and Trae's Dialogue Generator

A web application that generates AI-powered dialogue between two characters using ElevenLabs' text-to-speech API.

## Features

- Generate dialogue between two characters with customizable voices
- Support for delivery style instructions (e.g., "excited", "whispered", "angry", "calm")
- Dynamic voice selection from ElevenLabs' available voices
- Audio playback and download capabilities
- Responsive design for various screen sizes

## Setup

1. Clone the repository
2. Replace `YOUR_API_KEY_HERE` in `app.js` with your ElevenLabs API key
3. Open `index.html` in a web browser

## Usage

1. Enter dialogue for each character in their respective text boxes
2. Select voices for both characters from the dropdown menus
3. Add delivery instructions in parentheses, brackets, or quotes at the end of lines:
   ```
   Hello there! (excited)
   What do you want? [angry]
   Come closer... "whispered"
   ```
4. Click "Generate" to create the audio
5. Use "Play" to hear the dialogue or "Save" to download the audio files

## Dependencies

- ElevenLabs Text-to-Speech API
- Web Audio API (built into modern browsers)

## Notes

- Requires an active ElevenLabs API key with sufficient credits
- Free tier usage may be limited by ElevenLabs' policies
- For best results, use a modern web browser with Web Audio API support