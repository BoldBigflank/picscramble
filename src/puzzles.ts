export type PuzzleEntry = {
    id: string;
    category: string;
    name: string;
    puzzleString: string;
}

const CATEGORY_ORDER = ['easy', 'medium', 'hard'];

const files = import.meta.glob<string>('/fixtures/puzzles/**/*.json', { query: '?raw', import: 'default', eager: true });

const categoryRank = (category: string) => {
    const rank = CATEGORY_ORDER.indexOf(category);
    return rank === -1 ? CATEGORY_ORDER.length : rank;
}

export const puzzleEntries: PuzzleEntry[] = Object.entries(files)
    .map(([path, puzzleString]) => {
        const id = path.replace('/fixtures/puzzles/', '').replace(/\.json$/, '');
        const parts = id.split('/');
        const name = parts[parts.length - 1];
        const category = parts.length > 1 ? parts[0] : 'other';
        return { id, category, name, puzzleString };
    })
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category)
        || a.category.localeCompare(b.category)
        || a.name.localeCompare(b.name));

export const findPuzzleEntry = (id: string | null) => puzzleEntries.find(entry => entry.id === id);
