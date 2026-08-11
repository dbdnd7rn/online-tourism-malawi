import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { env } from 'node:process'

const repairedCollectionStyles = `
.map-feature h2 { margin-bottom: 25px; font-size: clamp(50px, 6vw, 80px); line-height: .95; }
.map-feature p { max-width: 520px; color: #aaa69e; }
.malawi-map-display { position: relative; height: 650px; display: grid; place-items: center; isolation: isolate; }
.malawi-map-display::before, .malawi-map-display::after { content: ''; position: absolute; z-index: -1; border: 1px solid rgba(201, 154, 69, .18); border-radius: 50%; }
.malawi-map-display::before { width: 500px; height: 500px; }
.malawi-map-display::after { width: 370px; height: 370px; }
.malawi-map-display > img { width: 220px; height: 570px; object-fit: contain; filter: brightness(0) invert(1); opacity: .88; }
.map-pin { position: absolute; z-index: 2; min-width: 120px; padding: 10px 12px; border-left: 2px solid var(--gold); color: var(--ivory); background: rgba(10, 14, 12, .76); backdrop-filter: blur(8px); font-family: var(--sans); font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.map-pin small { display: block; margin-top: 4px; color: #96928b; font-size: 8px; font-weight: 500; letter-spacing: .06em; }
.map-pin--north { top: 18%; right: 5%; }
.map-pin--centre { top: 47%; left: 2%; }
.map-pin--south { right: 8%; bottom: 14%; }

.museum-intro__grid { display: grid; grid-template-columns: 1fr .85fr; align-items: end; gap: 100px; }
.museum-intro h2 { margin: 0; font-size: clamp(50px, 6vw, 78px); line-height: .96; }
.museum-intro p { margin: 0; color: #605d56; }
.museum-list { border-top: 1px solid var(--dark-line); }
.museum-row { display: grid; grid-template-columns: 50px 230px 1fr 52px; align-items: center; gap: 30px; min-height: 270px; padding: 26px 0; border-bottom: 1px solid var(--dark-line); }
.museum-row__index { align-self: start; padding-top: 6px; color: var(--gold-dark); font-family: var(--sans); font-size: 9px; }
.museum-row > .picture { height: 215px; }
.museum-row__copy small, .museum-row__copy > span { display: flex; align-items: center; gap: 7px; color: #777168; font-family: var(--sans); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
.museum-row__copy h3 { margin: 10px 0 9px; font-size: 35px; line-height: 1.05; }
.museum-row__copy p { max-width: 650px; margin: 0 0 16px; color: #68645d; font-size: 12px; }
.round-arrow { width: 48px; height: 48px; display: grid; place-items: center; border: 1px solid rgba(116, 90, 42, .45); border-radius: 50%; cursor: pointer; color: var(--ink); background: transparent; }
.round-arrow:hover { color: var(--ivory); background: var(--gold-dark); }
.object-feature { padding: 110px 0; color: var(--ivory); background: #121714; }
.object-feature__inner { display: grid; grid-template-columns: 1fr .9fr; align-items: center; gap: 100px; }
.object-feature__inner > .picture { height: 660px; }
.object-feature__tag { display: inline-flex; margin: 20px 0 6px; padding: 7px 9px; border: 1px solid rgba(201, 154, 69, .35); color: var(--gold-bright); font-family: var(--sans); font-size: 8px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.object-feature h2 { margin: 15px 0 20px; font-size: clamp(50px, 6vw, 78px); line-height: .95; }
.object-feature p { max-width: 540px; margin-bottom: 30px; color: #aaa69e; }

.performance-browser__grid { display: grid; grid-template-columns: .8fr 1.2fr; min-height: 650px; border: 1px solid var(--line); }
.performance-tabs { border-right: 1px solid var(--line); }
.performance-tabs button { width: 100%; min-height: 145px; display: grid; grid-template-columns: 40px 1fr auto; align-items: center; gap: 12px; padding: 22px; border: 0; border-bottom: 1px solid var(--line); cursor: pointer; text-align: left; color: #9d9991; background: transparent; transition: .2s; }
.performance-tabs button:hover, .performance-tabs button.active { padding-left: 30px; color: var(--ivory); background: rgba(201, 154, 69, .07); }
.performance-tabs button > span { color: var(--gold-dark); font-family: var(--sans); font-size: 9px; }
.performance-tabs strong { display: block; font-family: var(--serif); font-size: 25px; font-weight: 500; }
.performance-tabs small { grid-column: 2; color: #77736c; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
.performance-tabs button > svg { grid-column: 3; grid-row: 1 / span 2; color: var(--gold); }
.performance-focus { position: relative; min-height: 650px; display: flex; align-items: end; overflow: hidden; }
.performance-focus > .picture, .performance-focus__shade { position: absolute; inset: 0; }
.performance-focus__shade { background: linear-gradient(0deg, rgba(4, 6, 5, .94), rgba(4, 6, 5, .08) 72%); }
.performance-focus__body { position: relative; z-index: 2; max-width: 650px; padding: 42px; }
.performance-focus__body > span { color: var(--gold-bright); font-family: var(--sans); font-size: 9px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
.performance-focus h3 { margin: 8px 0 10px; font-size: 52px; }
`

function repairLegacyStyles() {
  return {
    name: 'repair-legacy-styles',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/styles.css') || !code.includes('tokens truncated')) return null

      const repaired = code.replace(
        /\.map-feature h2 \{[\s\S]*?\.performance-focus h3 \{ margin: 8px 0 10px; font-size: 52px; \}/,
        repairedCollectionStyles.trim(),
      )

      return { code: repaired, map: null }
    },
  }
}

export default defineConfig({
  plugins: [repairLegacyStyles(), react()],
  base: env.GITHUB_ACTIONS ? '/online-tourism-malawi/' : '/',
})
