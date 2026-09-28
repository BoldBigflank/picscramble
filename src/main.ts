import './style.css'
import { createPuzzmoSDK, type Theme } from '@puzzmo/sdk'
import { initGame, startGame, pauseGame, resumeGame, retryGame, setSelectionColor, parseBoardState } from './game.ts'
import { parsePuzzle } from './levels.ts'
import { startStandalone } from './standalone.ts'

const WIN_REVEAL_DELAY_MS = 1200

const root = document.getElementById('app')!

const applyTheme = (theme: Theme) => {
    document.body.style.background = theme.g_bg
    setSelectionColor(theme.key)
}

const runPuzzmo = async () => {
    const sdk = createPuzzmoSDK()

    let ready
    try {
        ready = await sdk.gameReady()
    } catch (error) {
        console.warn('No Puzzmo host responded, falling back to the standalone puzzle list.', error)
        return startStandalone(root)
    }
    const { puzzleString, inputString, theme } = ready
    const puzzle = parsePuzzle(puzzleString)
    if (theme) applyTheme(theme)

    sdk.on('start', () => startGame())
    sdk.on('pause', () => pauseGame())
    sdk.on('resume', () => resumeGame())
    sdk.on('retry', () => retryGame())
    sdk.on('settingsUpdate', (data?: { theme?: Theme }) => {
        if (data?.theme) applyTheme(data.theme)
    })

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

const forceStandalone = new URLSearchParams(location.search).has('standalone')
const hasHost = !forceStandalone && (import.meta.env.DEV || window.parent !== window)

if (hasHost) runPuzzmo()
else startStandalone(root)
