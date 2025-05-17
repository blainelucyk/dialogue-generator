// Initialize variables
let currentAudioUrls = [];
let audioContext = null;
let audioBuffers = [];

// API Key
const API_KEY = 'sk_7f665bc093a5d31459eceed870f6efc5dc9dc1165e3cd37d';

// DOM Elements
const dialogue1Input = document.getElementById('dialogue1');
const dialogue2Input = document.getElementById('dialogue2');
const voiceSelect1 = document.getElementById('voice-select1');
const voiceSelect2 = document.getElementById('voice-select2');
const stabilitySlider = document.getElementById('stability');
const similaritySlider = document.getElementById('similarity');
const generateBtn = document.getElementById('generate-btn');
const playBtn = document.getElementById('play-btn');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');
const stabilityValue = document.getElementById('stability-value');
const similarityValue = document.getElementById('similarity-value');

// Fetch available voices when the page loads
window.addEventListener('load', fetchVoices);

// Fetch available voices
async function fetchVoices() {
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'Accept': 'application/json',
                'xi-api-key': API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail?.message || 'Failed to fetch voices');
        }

        const data = await response.json();
        
        // Clear existing options
        voiceSelect1.innerHTML = '';
        voiceSelect2.innerHTML = '';
        
        // Add voices to both select elements
        data.voices.forEach(voice => {
            const option1 = document.createElement('option');
            option1.value = voice.voice_id;
            option1.textContent = voice.name;
            voiceSelect1.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = voice.voice_id;
            option2.textContent = voice.name;
            voiceSelect2.appendChild(option2);
        });
    } catch (error) {
        console.error('Error fetching voices:', error);
        updateStatus(`Error loading voices: ${error.message}`);
    }
}

// Update slider value displays
stabilitySlider.addEventListener('input', () => {
    stabilityValue.textContent = stabilitySlider.value;
});

similaritySlider.addEventListener('input', () => {
    similarityValue.textContent = similaritySlider.value;
});

// Generate audio function
// Generate audio function
async function generateAudio() {
    const text1 = dialogue1Input.value.trim();
    const text2 = dialogue2Input.value.trim();

    // Split dialogues into segments by newlines
    const segments1 = text1.split(/\n\s*\n/).map(segment => segment.trim()).filter(segment => segment.length > 0);
    const segments2 = text2.split(/\n\s*\n/).map(segment => segment.trim()).filter(segment => segment.length > 0);

    if (segments1.length === 0 && segments2.length === 0) {
        updateStatus('Please enter dialogue for at least one character.');
        return;
    }

    const voiceId1 = voiceSelect1.value;
    const voiceId2 = voiceSelect2.value;
    const stability = parseFloat(stabilitySlider.value);
    const similarity = parseFloat(similaritySlider.value);

    updateStatus('Generating audio...');
    generateBtn.disabled = true;
    currentAudioUrls = [];
    audioBuffers = [];

    try {
        // Interleave segments from both characters
        const maxSegments = Math.max(segments1.length, segments2.length);
        for (let i = 0; i < maxSegments; i++) {
            // Generate audio for character 1's segment if available
            if (i < segments1.length) {
                const audio1 = await generateSingleAudio(segments1[i], voiceId1, stability, similarity);
                currentAudioUrls.push(audio1.url);
                audioBuffers.push(audio1.buffer);
            }

            // Generate audio for character 2's segment if available
            if (i < segments2.length) {
                const audio2 = await generateSingleAudio(segments2[i], voiceId2, stability, similarity);
                currentAudioUrls.push(audio2.url);
                audioBuffers.push(audio2.buffer);
            }
        }

        // Enable play and save buttons
        playBtn.disabled = false;
        saveBtn.disabled = false;
        
        updateStatus('Audio generated successfully!');

    } catch (error) {
        console.error('Error generating audio:', error);
        updateStatus(`Error generating audio: ${error.message}`);
    } finally {
        generateBtn.disabled = false;
    }
}

// Helper function to parse delivery style from text
function parseDeliveryStyle(text) {
    // Match text followed by delivery style in parentheses or quotes
    const styleMatch = text.match(/(.+?)\s*[\(\["]([^\)\]"]+)[\)\]"]\s*$/);
    if (styleMatch) {
        return {
            text: styleMatch[1].trim(),
            style: styleMatch[2].trim()
        };
    }
    return { text, style: null };
}

// Helper function to adjust voice settings based on delivery style
function getVoiceSettings(style, baseStability, baseSimilarity) {
    const settings = {
        stability: baseStability,
        similarity_boost: baseSimilarity,
        style_exaggeration: 0
    };

    if (!style) return settings;

    // Adjust settings based on delivery style keywords
    const style_lower = style.toLowerCase();
    
    if (style_lower.includes('emphatic') || style_lower.includes('excited')) {
        settings.stability *= 0.8; // More variation
        settings.style_exaggeration = 0.75; // More expressive
    } else if (style_lower.includes('whisper') || style_lower.includes('quiet')) {
        settings.stability *= 1.2; // More stable
        settings.similarity_boost *= 1.2; // Clearer pronunciation
    } else if (style_lower.includes('angry') || style_lower.includes('shouting')) {
        settings.stability *= 0.7; // More variation
        settings.style_exaggeration = 0.9; // Very expressive
    } else if (style_lower.includes('calm') || style_lower.includes('gentle')) {
        settings.stability *= 1.1; // More stable
        settings.similarity_boost *= 1.1; // Clearer
    }

    return settings;
}

// Helper function to generate audio for a single character
async function generateSingleAudio(text, voiceId, baseStability, baseSimilarity) {
    const { text: cleanText, style } = parseDeliveryStyle(text);
    const voiceSettings = getVoiceSettings(style, baseStability, baseSimilarity);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': API_KEY
        },
        body: JSON.stringify({
            text: cleanText,
            voice_settings: voiceSettings
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to generate audio');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create AudioContext if it doesn't exist
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return { url: audioUrl, buffer: audioBuffer };
}

// Play audio function
async function playAudio() {
    if (!audioBuffers.length || !audioContext) {
        updateStatus('No audio available to play.');
        return;
    }

    updateStatus('Playing audio...');

    // Play each audio buffer in sequence
    for (let i = 0; i < audioBuffers.length; i++) {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[i];
        source.connect(audioContext.destination);
        
        // If it's not the first buffer, wait for the previous one to finish
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, audioBuffers[i-1].duration * 1000));
        }
        
        source.start(0);
    }
}

// Save audio function
function saveAudio() {
    if (!currentAudioUrls.length) {
        updateStatus('No audio available to save.');
        return;
    }

    currentAudioUrls.forEach((url, index) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-dialogue-${index + 1}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    updateStatus('Audio saved!');
}

// Update status message
function updateStatus(message) {
    statusMessage.textContent = message;
}

// Event listeners
generateBtn.addEventListener('click', generateAudio);
playBtn.addEventListener('click', playAudio);
saveBtn.addEventListener('click', saveAudio);
