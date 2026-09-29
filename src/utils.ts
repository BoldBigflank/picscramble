export const loadImage = (src: string) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        image.src = src;
    });
}

// Canvas `ctx.filter` isn't supported in Safari, so grayscale is baked into a copy of the pixels.
export const toGrayscale = (image: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = luma;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

export const shuffleArray = (array: any[], randFunc: Function = Math.random.bind(Math)) => {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(randFunc() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}