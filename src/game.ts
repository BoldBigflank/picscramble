import { init, Sprite, GameLoop, getContext, initKeys, initPointer, track, onKey, pointerPressed, getPointer } from 'kontra';
import { loadImage, shuffleArray } from './utils';
import { levels } from './levels';

const currentLevel = levels[0];
const rowHeight = 320 / currentLevel.rows;
const colWidth = 320 / currentLevel.cols;

const sprites: Sprite[] = [];

let selectedRow = 0
let selectedCol = 0
let gameWon = false;

const shiftSelectedRow = (direction: number) => {
    if (selectedRow === -1) return;
    if (selectedRow + direction < 0) return;
    if (selectedRow + direction > currentLevel.rows - 1) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    const spritesInAdjacentRow = sprites.filter(sprite => sprite.row === selectedRow + direction);
    spritesInRow.forEach(sprite => {
        sprite.row = selectedRow + direction;
    });
    spritesInAdjacentRow.forEach(sprite => {
        sprite.row = selectedRow;
    });
    selectedRow += direction;
    checkGameWon();
}

const shiftColsInSelectedRow = (direction: number) => {
    if (selectedRow === -1) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = (sprite.col + direction + currentLevel.cols) % currentLevel.cols;
    });
    checkGameWon();
}

onKey('z', () => {
    if (gameWon) return;
    selectedRow += 1;
    if (selectedRow > currentLevel.rows - 1) {
        selectedRow = currentLevel.rows - 1;
    }
})
onKey('a', () => {
    if (gameWon) return;
    selectedRow -= 1;
    if (selectedRow < 0) {
        selectedRow = 0;
    }
})

onKey('arrowup', () => {
    // Swap rows with the row above the selected row
    if (gameWon) return;
    shiftSelectedRow(-1);
})

onKey('arrowdown', () => {
    if (gameWon) return;
    shiftSelectedRow(1);
})

onKey('arrowright', () => {
    // Move cells of the selected row right, wrapping
    if (gameWon) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = (sprite.col + 1) % currentLevel.cols;
    });
    checkGameWon();
})

onKey('arrowleft', () => {
    // Move cells of the selected row left, wrapping
    if (gameWon) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = (sprite.col - 1 + currentLevel.cols) % currentLevel.cols;
    });
    checkGameWon();
})

const checkGameWon = () => {
    if (gameWon) return;
    const cells = sprites.filter(sprite => sprite.type === 'cell');
    const complete = cells.every(cell => cell.row === cell.correctRow && cell.col === cell.correctCol);
    if (!gameWon && complete) {
        gameWon = true;
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
        onDown: function(){
            if (gameWon) return;
            selectedRow = this.row;
            selectedCol = this.col;
        },
        onUp: function(){
            selectedRow = -1;
        },
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
            ctx.save()
            ctx.filter = gameWon ? 'none' : 'grayscale(100%)';
            ctx.drawImage(this.image, 
                this.imageCol * (320 / currentLevel.cols), this.imageRow * (320 / currentLevel.rows), this.width, this.height,
                0, 0, this.width, this.height
            );
            ctx.restore()
        },
    })
}

const initGame = async () => {
    init('gameCanvas');
    initKeys()
    initPointer({radius: 1})

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
            track(cellSprite)
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
            if (selectedRow === -1) return;
            this.y = selectedRow * (320 / currentLevel.rows);
        },
        render: function() {
            if (selectedRow === -1 || gameWon) return;
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
        // Pointer stuff
        if (pointerPressed('left')) {
            if (gameWon) return;
            const pointer = getPointer()
            const pointerRow = Math.floor(pointer.y / rowHeight);
            const pointerCol = Math.floor(pointer.x / colWidth);
            if (pointerRow !== selectedRow) {
                shiftSelectedRow(pointerRow - selectedRow);
            }
            if (pointerCol !== selectedCol) {
                shiftColsInSelectedRow(pointerCol - selectedCol);
                selectedCol = pointerCol;
            }
        }


    },
    render: function() { // render the game state
        sprites.forEach(sprite => sprite.render());
    }
    });

    loop.start();    // start the game
    return loop;
}

export { initGame };