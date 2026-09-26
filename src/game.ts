import { init, Sprite, GameLoop, getContext, initKeys, onKey } from 'kontra';
import { levels } from './levels';
import { loadImage, shuffleArray } from './utils';

const sprites: Sprite[] = [];

let selectedRow = 0
let gameWon = false;

initKeys()
onKey('z', () => {
    selectedRow += 1;
    if (selectedRow > 4) {
        selectedRow = 4;
    }
})
onKey('a', () => {
    selectedRow -= 1;
    if (selectedRow < 0) {
        selectedRow = 0;
    }
})

onKey('arrowup', () => {
    // Swap rows with the row above the selected row
    if (selectedRow <= 0) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    const spritesInAboveRow = sprites.filter(sprite => sprite.row === selectedRow - 1);
    spritesInRow.forEach(sprite => {
        sprite.row = selectedRow - 1;
    });
    spritesInAboveRow.forEach(sprite => {
        sprite.row = selectedRow;
    });
    selectedRow -= 1;
    checkGameWon();
})

onKey('arrowdown', () => {
    if (selectedRow >= 4) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    const spritesInBelowRow = sprites.filter(sprite => sprite.row === selectedRow + 1);
    spritesInRow.forEach(sprite => {
        sprite.row = selectedRow + 1;
    });
    spritesInBelowRow.forEach(sprite => {
        sprite.row = selectedRow;
    });
    selectedRow += 1;
    checkGameWon();
})

onKey('arrowright', () => {
    // Move cells of the selected row right, wrapping
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = (sprite.col + 1) % 5;
    });
    checkGameWon();
})

onKey('arrowleft', () => {
    // Move cells of the selected row left, wrapping
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = (sprite.col - 1 + 5) % 5;
    });
    checkGameWon();
})

type Cell = {
    width: number;
    height: number;
    image: HTMLImageElement;
    imageX: number;
    imageY: number;
    x: number;
    y: number;
}

type Row = {
    cells: Cell[]
}

type GameState = {
    image: HTMLImageElement;
    board: {
        rows: Row[]
    }
}

const checkGameWon = () => {
    const cells = sprites.filter(sprite => sprite.type === 'cell');
    const complete = cells.every(cell => cell.row === cell.correctRow && cell.col === cell.correctCol);
    if (!gameWon && complete) {
        gameWon = true;
        alert('Congratulations! You won!');
    }
}

const CellSprite = (image: HTMLImageElement): Sprite => {
    return Sprite({
        width: 64,
        height: 64,
        color: 'blue',
        image: image,
        imageRow: 0,
        imageCol: 0,
        row: 0,
        col: 0,
        type: 'cell',
        // custom properties
        update: function() {
            this.x = this.col * 64;
            this.y = this.row * 64;
        },
        render: function() {
            const ctx = getContext();
            ctx.drawImage(this.image, 
                this.imageCol * 64, this.imageRow * 64, this.width, this.height,
                0, 0, this.width, this.height
            );
        },
    })
}

const initGame = async () => {
    let { canvas } = init('gameCanvas');
    // Shuffled initial board state
    const shuffledBoardState = [
        {row: 0, offset: Math.floor(Math.random() * 5)},
        {row: 1, offset: Math.floor(Math.random() * 5)},
        {row: 2, offset: Math.floor(Math.random() * 5)},
        {row: 3, offset: Math.floor(Math.random() * 5)},
        {row: 4, offset: Math.floor(Math.random() * 5)},
    ]
    shuffleArray(shuffledBoardState);

    // Image Sprites
    const hamsterImage = await loadImage('./hamster.png');
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let cellSprite = CellSprite(hamsterImage as HTMLImageElement);
            cellSprite.imageRow = i;
            cellSprite.imageCol = j;
            cellSprite.row = shuffledBoardState[i].row;
            cellSprite.col = (shuffledBoardState[i].offset + j) % 5;
            cellSprite.correctRow = i;
            cellSprite.correctCol = j
            sprites.push(cellSprite);
        }
    }

    // UI Sprites
    const selectionSprite = Sprite({
        width: 320,
        height: 64,
        color: 'red',
        x: 0,
        y: 0,
        update: function() {
            this.y = selectedRow * 64;
        },
        render: function() {
            const ctx = getContext();
            ctx.strokeStyle = this.color;
            ctx.strokeRect(0, 0, this.width, this.height);
        }
    })
    sprites.push(selectionSprite);

    // Set up Game
    let loop = GameLoop({  // create the main game loop
    update: function() { // update the game state
        sprites.forEach(sprite => sprite.update());
    },
    render: function() { // render the game state
        sprites.forEach(sprite => sprite.render());
    }
    });

    loop.start();    // start the game
    return loop;
}

export { initGame };