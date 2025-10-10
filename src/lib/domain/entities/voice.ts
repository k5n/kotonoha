// Example:
// {
//   "baseUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/",
//   "voices": [
//     {
//       "name": "john",
//       "language": {
//         "family": "en",
//         "region": "US"
//       },
//       "quality": "medium",
//       "files": [
//         {
//           "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/john/medium/en_US-john-medium.onnx",
//           "bytes": 63531379,
//           "md5": "70480857f21f2560f3a232722023b36d"
//         }
//       ],
//       "speakers": [
//         {
//           "id": 0,
//           "name": "john",
//           "sampleUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/john/medium/samples/speaker_0.mp3"
//         }
//       ]
//     }
//   ]
// }

export type Speaker = {
  readonly id: number;
  readonly name: string;
  readonly sampleUrl: string;
};

export type FileInfo = {
  readonly url: string;
  readonly bytes: number;
  readonly md5: string;
};

export type Language = {
  readonly family: string;
  readonly region: string;
};

export type Voice = {
  readonly name: string;
  readonly language: Language;
  readonly quality: string;
  readonly files: readonly FileInfo[];
  readonly speakers: readonly Speaker[];
};

export type Voices = {
  readonly baseUrl: string;
  readonly voices: readonly Voice[];
};
