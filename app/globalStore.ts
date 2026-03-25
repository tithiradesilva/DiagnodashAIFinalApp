export const GlobalResultStore = {
  data: {
    imageUri: null as string | null,
    detectedClass: null as string | null,
    confidence: 0 as number,
    resultImage: null as string | null,
  },

  setResult(
    imageUri: string,
    detectedClass: string,
    confidence: number,
    resultImage: string,
  ) {
    this.data.imageUri = imageUri;
    this.data.detectedClass = detectedClass;
    this.data.confidence = confidence;
    this.data.resultImage = resultImage;
  },

  getResult() {
    return this.data;
  },

  clear() {
    this.data = {
      imageUri: null,
      detectedClass: null,
      confidence: 0,
      resultImage: null,
    };
  },
};
