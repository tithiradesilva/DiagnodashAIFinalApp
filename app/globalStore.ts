export const GlobalResultStore = {
  // This store holds the latest AI detection result
  data: {
    imageUri: null as string | null,
    detectedClass: null as string | null,
    confidence: 0 as number,
    box: null as number[] | null,
  },

  // Method to update the store with new results
  setResult(
    imageUri: string,
    detectedClass: string,
    confidence: number,
    box: number[] | null,
  ) {
    this.data.imageUri = imageUri;
    this.data.detectedClass = detectedClass;
    this.data.confidence = confidence;
    this.data.box = box;
  },

  // Method to retrieve the result
  getResult() {
    return this.data;
  },

  // Method to clear the store
  clear() {
    this.data = {
      imageUri: null,
      detectedClass: null,
      confidence: 0,
      box: null,
    };
  },
};
