export const GlobalResultStore = {
  data: {
    imageUri: null as string | null,
    detectedClass: null as string | null,
    confidence: 0 as number,
    box: null as number[] | null, // Box coordinates
  },

  setResult(
    imageUri: string,
    detectedClass: string,
    confidence: number,
    box: number[] | null, // Box array from the server
  ) {
    this.data.imageUri = imageUri;
    this.data.detectedClass = detectedClass;
    this.data.confidence = confidence;
    this.data.box = box;
  },

  getResult() {
    return this.data;
  },

  clear() {
    this.data = {
      imageUri: null,
      detectedClass: null,
      confidence: 0,
      box: null,
    };
  },
};
