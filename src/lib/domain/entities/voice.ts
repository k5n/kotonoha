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
//           "path": "en/en_US/john/medium/en_US-john-medium.onnx",
//           "bytes": 63531379,
//           "md5": "70480857f21f2560f3a232722023b36d"
//         }
//       ]
//     }
//   ]
// }

export type FileInfo = {
  readonly path: string;
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
};

export type Voices = {
  readonly baseUrl: string;
  readonly voices: readonly Voice[];
};
