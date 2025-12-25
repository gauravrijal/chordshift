export async function decodeAudio(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Decode the audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Clean up
    await audioContext.close();

    return audioBuffer;
}
