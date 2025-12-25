declare module 'soundtouchjs' {
    export class PitchShifter {
        constructor(context: AudioContext | OfflineAudioContext, buffer: AudioBuffer, bufferSize?: number);
        pitch: number;
        sampleRate: number;
        connect(node: AudioNode): void;
        disconnect(): void;
        on(event: string, callback: (data: any) => void): void;
    }
}
