import { init, Sprite, GameLoop, getContext, initKeys, onKey } from 'kontra';
import { loadImage, shuffleArray } from './utils';
import { levels } from './levels';

const currentLevel = levels[0];
const rowHeight = 320 / currentLevel.rows;
const colWidth = 320 / currentLevel.cols;

const sprites: Sprite[] = [];

let selectedRow = 0
let gameWon = false;

initKeys()
onKey('z', () => {
    selectedRow += 1;
    if (selectedRow > currentLevel.rows - 1) {
        selectedRow = currentLevel.rows - 1;
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
    if (selectedRow >= currentLevel.rows - 1) return;
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
        sprite.col = (sprite.col + 1) % currentLevel.cols;
    });
    checkGameWon();
})

onKey('arrowleft', () => {
    // Move cells of the selected row left, wrapping
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = (sprite.col - 1 + currentLevel.cols) % currentLevel.cols;
    });
    checkGameWon();
})

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
            this.x = this.col * colWidth;
            this.y = this.row * rowHeight;
            this.width = colWidth;
            this.height = rowHeight;
        },
        render: function() {
            const ctx = getContext();
            if (!ctx) return;
            if (!this.image) return;
            if (!this.width || !this.height) return;

            ctx.drawImage(this.image, 
                this.imageCol * (320 / currentLevel.cols), this.imageRow * (320 / currentLevel.rows), this.width, this.height,
                0, 0, this.width, this.height
            );
        },
    })
}

const initGame = async () => {
    init('gameCanvas');
    // Shuffled initial board state
    const shuffledBoardState = Array.from({ length: currentLevel.rows }, (_, i) => ({
        row: i,
        offset: Math.floor(Math.random() * currentLevel.cols),
    }));
    shuffleArray(shuffledBoardState);

    // Image Sprites
    const hamsterImage = await loadImage(`./${currentLevel.image}`);
    for (let i = 0; i < currentLevel.rows; i++) {
        for (let j = 0; j < currentLevel.cols; j++) {
            let cellSprite = CellSprite(hamsterImage as HTMLImageElement);
            cellSprite.width = 320 / currentLevel.cols;
            cellSprite.height = 320 / currentLevel.rows;
            cellSprite.imageRow = i;
            cellSprite.imageCol = j;
            cellSprite.row = shuffledBoardState[i].row;
            cellSprite.col = (shuffledBoardState[i].offset + j) % currentLevel.cols;
            cellSprite.correctRow = i;
            cellSprite.correctCol = j
            sprites.push(cellSprite);
        }
    }

    // UI Sprites
    const selectionSprite = Sprite({
        width: 320,
        height: 320 / currentLevel.rows,
        color: 'red',
        x: 0,
        y: 0,
        update: function() {
            this.y = selectedRow * (320 / currentLevel.rows);
        },
        render: function() {
            const ctx = getContext();
            if (!ctx) return;
            if (!this.width || !this.height) return;
            ctx.strokeStyle = this.color || 'red';
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