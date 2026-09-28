import './style.css'
import { createPuzzmoSDK, type Theme } from '@puzzmo/sdk'
import { initGame, startGame, pauseGame, resumeGame, retryGame, setSelectionColor, parseBoardState } from './game.ts'
import { parsePuzzle } from './levels.ts'

const WIN_REVEAL_DELAY_MS = 1200

const sdk = createPuzzmoSDK()

const applyTheme = (theme: Theme) => {
    document.body.style.background = theme.g_bg
    setSelectionColor(theme.key)
}

const run = async () => {
    const { puzzleString, inputString, theme } = await sdk.gameReady()
    const puzzle = parsePuzzle(puzzleString)
    if (theme) applyTheme(theme)

    await initGame(puzzle, parseBoardState(inputString, puzzle), {
        onStateChange: (state) => {
            sdk.updateGameState(JSON.stringify(state))
        },
        onWin: ({ moves, state }) => {
            sdk.gameCompleted(
                { inputString: JSON.stringify(state), pointsAwarded: 0, completed: true },
                { deeds: [{ id: 'moves', value: moves }] },
            )
            setTimeout(() => {
                sdk.showCompletionScreen([
                    { type: 'md', text: `**Unscrambled!** Solved in ${moves} ${moves === 1 ? 'move' : 'moves'}.` },
                ])
            }, WIN_REVEAL_DELAY_MS)
        },
    })

    sdk.gameLoaded()
}

sdk.on('start', () => startGame())
sdk.on('pause', () => pauseGame())
sdk.on('resume', () => resumeGame())
sdk.on('retry', () => retryGame())
sdk.on('settingsUpdate', (data?: { theme?: Theme }) => {
    if (data?.theme) applyTheme(data.theme)
})

run()
