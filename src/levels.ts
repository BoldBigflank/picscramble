
type Level = {
    date: string;
    image: string;
    rows: number;
    cols: number;
    seed: string;
}

const levels: Level[] = []

levels.push({
    date: '2026-09-26',
    image: 'hamster.png',
    rows: 8,
    cols: 8,
    seed: '1234567890',
})

levels.push({
    date: '2026-09-27',
    image: 'hamster.png',
    rows: 8,
    cols: 8,
    seed: '9876543210',
})

export const getLevel = (date: string) => {
    if (!date) return levels[0]
    return levels.find(level => level.date === date)
}