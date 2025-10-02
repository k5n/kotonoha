export interface MediaPlayer {
  get currentTime(): number;
  get isPlaying(): boolean;
  get hasStarted(): boolean;
  get isReady(): boolean;
  open(path: string): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  listen(): Promise<() => void>;
}
