import { initGame, startGame, retryGame, parseBoardState } from './game.ts'
import { parsePuzzle, type BoardState } from './levels.ts'
import { puzzleEntries, findPuzzleEntry, type PuzzleEntry } from './puzzles.ts'

const stateKey = (id: string) => `picscramble:${id}`
const solvedKey = (id: string) => `picscramble:solved:${id}`

const puzzleHref = (id: string) => `?standalone&puzzle=${encodeURIComponent(id)}`
const LIST_HREF = '?standalone'

const solvedMoves = (id: string) => {
    const value = localStorage.getItem(solvedKey(id))
    return value === null ? undefined : Number(value)
}

const isSolvedState = (state: BoardState) => state.every((entry, i) => entry.row === i && entry.offset === 0)

const movesText = (moves: number) => `${moves} ${moves === 1 ? 'move' : 'moves'}`

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text) node.textContent = text
    return node
}

const allPuzzlesLink = () => {
    const link = el('a', 'puzzle-back', 'All puzzles')
    link.href = LIST_HREF
    return link
}

export const showPuzzleList = (root: HTMLElement) => {
    document.getElementById('gameCanvas')?.remove()

    const list = el('div', 'puzzle-list')
    list.appendChild(el('h1', undefined, 'Pic Scramble'))

    const categories = [...new Set(puzzleEntries.map(entry => entry.category))]
    for (const category of categories) {
        const section = el('section', 'puzzle-category')
        section.appendChild(el('h2', undefined, category))
        const items = el('ul')
        for (const entry of puzzleEntries.filter(e => e.category === category)) {
            const item = el('li')
            const link = el('a', 'puzzle-link')
            link.href = puzzleHref(entry.id)
            link.appendChild(el('span', 'puzzle-name', entry.name))
            try {
                const puzzle = parsePuzzle(entry.puzzleString)
                link.appendChild(el('span', 'puzzle-size', `${puzzle.rows} x ${puzzle.cols}`))
            } catch {
                link.appendChild(el('span', 'puzzle-size', 'invalid'))
            }
            if (solvedMoves(entry.id) !== undefined) link.appendChild(el('span', 'puzzle-solved', 'solved'))
            item.appendChild(link)
            items.appendChild(item)
        }
        section.appendChild(items)
        list.appendChild(section)
    }
    root.appendChild(list)
}

const playLocal = async (root: HTMLElement, entry: PuzzleEntry) => {
    const puzzle = parsePuzzle(entry.puzzleString)
    const savedState = parseBoardState(localStorage.getItem(stateKey(entry.id)), puzzle)

    const canvas = document.getElementById('gameCanvas')
    root.insertBefore(allPuzzlesLink(), canvas)

    const winMessage = el('div', 'win-message')
    winMessage.hidden = true
    root.appendChild(winMessage)

    const showWin = (moves: number | undefined) => {
        winMessage.replaceChildren()
        winMessage.appendChild(el('p', undefined, moves === undefined ? 'Unscrambled!' : `Unscrambled in ${movesText(moves)}!`))
        const again = el('button', undefined, 'Play again')
        again.addEventListener('click', () => {
            winMessage.hidden = true
            retryGame()
        })
        winMessage.append(again, allPuzzlesLink())
        winMessage.hidden = false
    }

    await initGame(puzzle, savedState, {
        onStateChange: (state) => {
            localStorage.setItem(stateKey(entry.id), JSON.stringify(state))
        },
        onWin: ({ moves }) => {
            localStorage.setItem(solvedKey(entry.id), String(moves))
            showWin(moves)
        },
    })
    startGame()

    if (savedState && isSolvedState(savedState)) showWin(solvedMoves(entry.id))
}

export const startStandalone = (root: HTMLElement) => {
    const entry = findPuzzleEntry(new URLSearchParams(location.search).get('puzzle'))
    if (entry) return playLocal(root, entry)
    showPuzzleList(root)
}
