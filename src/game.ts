import { init, Sprite, GameLoop, getContext, initKeys, initPointer, track, onKey, pointerPressed, getPointer } from 'kontra';
import { loadImage, toGrayscale } from './utils';
import type { BoardState, Puzzle } from './levels';

export type GameCallbacks = {
    onStateChange: (state: BoardState) => void;
    onWin: (result: { moves: number; state: BoardState }) => void;
}

let puzzle: Puzzle;
let rowHeight = 0;
let colWidth = 0;
let callbacks: GameCallbacks;

const sprites: Sprite[] = [];

let selectedRow = 0
let selectedCol = 0
let pointerStart = undefined
let gameWon = false;
let started = false;
let paused = false;
let moves = 0;
let selectionColor = '#990033aa';

const canPlay = () => started && !paused && !gameWon;

const wrap = (value: number, size: number) => ((value % size) + size) % size;

export const parseBoardState = (inputString: string | null | undefined, p: Puzzle): BoardState | undefined => {
    if (!inputString) return undefined;
    try {
        const state = JSON.parse(inputString);
        if (!Array.isArray(state) || state.length !== p.rows) return undefined;
        const rows = new Set(state.map(entry => entry?.row));
        const valid = rows.size === p.rows && state.every(entry =>
            Number.isInteger(entry.row) && entry.row >= 0 && entry.row < p.rows &&
            Number.isInteger(entry.offset) && entry.offset >= 0 && entry.offset < p.cols
        );
        return valid ? state : undefined;
    } catch {
        return undefined;
    }
}

const cellSprites = () => sprites.filter(sprite => sprite.type === 'cell');

const getBoardState = (): BoardState => {
    const state: BoardState = [];
    cellSprites()
        .filter(cell => cell.imageCol === 0)
        .forEach(cell => { state[cell.imageRow] = { row: cell.row, offset: cell.col }; });
    return state;
}

const applyBoardState = (state: BoardState) => {
    cellSprites().forEach(cell => {
        cell.row = state[cell.imageRow].row;
        cell.col = (state[cell.imageRow].offset + cell.imageCol) % puzzle.cols;
    });
}

const isSolved = () => cellSprites().every(cell => cell.row === cell.correctRow && cell.col === cell.correctCol);

const recordMove = () => {
    moves += 1;
    const state = getBoardState();
    callbacks.onStateChange(state);
    checkGameWon(state);
}

const shiftSelectedRow = (direction: number) => {
    if (selectedRow === -1) return;
    if (selectedRow + direction < 0) return;
    if (selectedRow + direction > puzzle.rows - 1) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    const spritesInAdjacentRow = sprites.filter(sprite => sprite.row === selectedRow + direction);
    spritesInRow.forEach(sprite => {
        sprite.row = selectedRow + direction;
    });
    spritesInAdjacentRow.forEach(sprite => {
        sprite.row = selectedRow;
    });
    selectedRow += direction;

    // If the pointer is set, shift the y of i
    if (pointerStart) {
        pointerStart.y += direction * rowHeight;
    }
    
    recordMove();
}

const shiftColsInSelectedRow = (direction: number) => {
    if (selectedRow === -1) return;
    const spritesInRow = sprites.filter(sprite => sprite.row === selectedRow);
    spritesInRow.forEach(sprite => {
        sprite.col = wrap(sprite.col + direction, puzzle.cols);
    });
    recordMove();
}

onKey('z', () => {
    if (!canPlay()) return;
    selectedRow = Math.min(selectedRow + 1, puzzle.rows - 1);
})
onKey('a', () => {
    if (!canPlay()) return;
    selectedRow = Math.max(selectedRow - 1, 0);
})

onKey('arrowup', () => {
    // Swap rows with the row above the selected row
    if (!canPlay()) return;
    shiftSelectedRow(-1);
})

onKey('arrowdown', () => {
    if (!canPlay()) return;
    shiftSelectedRow(1);
})

onKey('arrowright', () => {
    // Move cells of the selected row right, wrapping
    if (!canPlay()) return;
    shiftColsInSelectedRow(1);
})

onKey('arrowleft', () => {
    // Move cells of the selected row left, wrapping
    if (!canPlay()) return;
    shiftColsInSelectedRow(-1);
})

const checkGameWon = (state: BoardState) => {
    if (gameWon) return;
    if (isSolved()) {
        gameWon = true;
        selectedRow = -1;
        callbacks.onWin({ moves, state });
    }
}

const CellSprite = (image: HTMLImageElement): Sprite => {
    return Sprite({
        x: 0,
        y: 0,
        image: image,
        grayImage: toGrayscale(image),
        offsetX: 0,
        offsetY: 0,
        desiredX: 0,
        desiredY: 0,
        imageRow: 0,
        imageCol: 0,
        row: 0,
        col: 0,
        speed: 32,
        type: 'cell',
        onDown: function(){
            console.log('onDown');
            if (!canPlay()) return;
            selectedRow = this.row;
            selectedCol = this.col;
            pointerStart = {...getPointer()};
        },
        onUp: function(){
            selectedRow = -1;
            pointerStart = undefined
        },
        // custom properties
        update: function() {
            if (this.x === undefined) this.x = 0;
            if (this.y === undefined) this.y = 0;
            this.desiredX = this.col * colWidth;
            this.desiredY = this.row * rowHeight;
            if (pointerStart && selectedRow === this.row) {
                const pointer = getPointer();
                const differenceX = pointer.x - pointerStart.x;
                const differenceY = pointer.y - pointerStart.y;
                console.log(pointer.x, pointer.y, differenceX, differenceY);
                this.desiredX += differenceX;
                this.desiredY += differenceY;
            }

            this.width = colWidth;
            this.height = rowHeight;

            // If x and desiredX are different, set dx to the direction of the difference
            if (Math.abs(this.desiredX - this.x) > this.speed) {
                const difference = this.desiredX - this.x;
                const sign = difference > 0 ? 1 : -1;
                this.dx = this.speed * sign;
            } else {
                this.x = this.desiredX;
                this.dx = 0;
            }
            if (Math.abs(this.desiredY - this.y) > this.speed) {
                const difference = this.desiredY - this.y;
                const sign = difference > 0 ? 1 : -1;
                this.dy = this.speed * sign;
            } else {
                this.y = this.desiredY;
                this.dy = 0;
            }
            this.advance()
        },
        render: function() {
            const ctx = getContext();
            if (!ctx) return;
            if (!this.image) return;
            if (!this.width || !this.height) return;
            ctx.save()
            ctx.drawImage(gameWon ? this.image : this.grayImage, 
                this.imageCol * colWidth, this.imageRow * rowHeight, this.width, this.height,
                0,0, this.width, this.height
            );
            ctx.restore()
        },
    })
}

const initGame = async (level: Puzzle, savedState: BoardState | undefined, gameCallbacks: GameCallbacks) => {
    puzzle = level;
    callbacks = gameCallbacks;
    rowHeight = 640 / puzzle.rows;
    colWidth = 640 / puzzle.cols;

    init('gameCanvas');
    initKeys()
    initPointer({radius: 1})

    // Image Sprites
    const image = await loadImage(`./${puzzle.image}`) as HTMLImageElement;
    for (let i = 0; i < puzzle.rows; i++) {
        for (let j = 0; j < puzzle.cols; j++) {
            let cellSprite = CellSprite(image);
            cellSprite.width = colWidth;
            cellSprite.height = rowHeight;
            cellSprite.imageRow = i;
            cellSprite.imageCol = j;
            cellSprite.correctRow = i;
            cellSprite.correctCol = j
            track(cellSprite)
            sprites.push(cellSprite);
        }
    }
    applyBoardState(savedState ?? puzzle.startState);
    // A restored save may already be solved; show it as won without reporting a new win.
    gameWon = isSolved();
    if (gameWon) selectedRow = -1;

    // UI Sprites
    const selectionSprite = Sprite({
        width: 640,
        height: rowHeight,
        x: 0,
        y: 0,
        update: function() {
            if (selectedRow === -1) return;
            this.y = selectedRow * rowHeight;
        },
        render: function() {
            if (selectedRow === -1 || gameWon) return;
            const ctx = getContext();
            if (!ctx) return;
            if (!this.width || !this.height) return;
            ctx.strokeStyle = selectionColor;
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
            if (!canPlay()) return;
            const pointer = getPointer()
            const pointerRow = Math.floor(pointer.y / rowHeight);
            const pointerCol = Math.floor(pointer.x / colWidth);
            if (selectedRow !== -1 && pointerRow !== selectedRow) {
                shiftSelectedRow(pointerRow - selectedRow);
            }
            if (selectedRow !== -1 && pointerCol !== selectedCol) {
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

const startGame = () => {
    started = true;
    paused = false;
}

const pauseGame = () => {
    paused = true;
}

const resumeGame = () => {
    paused = false;
}

const retryGame = () => {
    applyBoardState(puzzle.startState);
    moves = 0;
    gameWon = false;
    paused = false;
    selectedRow = 0;
    selectedCol = 0;
    callbacks.onStateChange(getBoardState());
}

const setSelectionColor = (color: string) => {
    selectionColor = color;
}

export { initGame, startGame, pauseGame, resumeGame, retryGame, setSelectionColor };
