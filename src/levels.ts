import Rand from 'rand-seed';
import { shuffleArray } from './utils';

// One entry per image row: which board row it sits in, and how far its cells are shifted.
export type BoardState = { row: number; offset: number }[];

export type Puzzle = {
    image: string;
    rows: number;
    cols: number;
    seed: string;
    startState: BoardState;
}

const scrambleFromSeed = (seed: string, rows: number, cols: number): BoardState => {
    const rand = new Rand(seed);
    const state = Array.from({ length: rows }, (_, i) => ({
        row: i,
        offset: Math.floor(rand.next() * cols),
    }));
    shuffleArray(state, rand.next.bind(rand));
    return state;
}

export const parsePuzzle = (puzzleString: string): Puzzle => {
    const data = JSON.parse(puzzleString)
    if (typeof data.image !== 'string') throw new Error('Puzzle is missing an image')
    if (!Number.isInteger(data.rows) || data.rows < 1) throw new Error('Puzzle has invalid rows')
    if (!Number.isInteger(data.cols) || data.cols < 1) throw new Error('Puzzle has invalid cols')
    if (typeof data.seed !== 'string' || !data.seed) throw new Error('Puzzle is missing a seed')
    return {
        image: data.image,
        rows: data.rows,
        cols: data.cols,
        seed: data.seed,
        startState: scrambleFromSeed(data.seed, data.rows, data.cols),
    }
}
