export const loadImage = (src: string) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        image.src = src;
    });
}

export const shuffleArray = (array: any[], randFunc: Function = Math.random.bind(Math)) => {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(randFunc() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}