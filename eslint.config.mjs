// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: [
      '.wrangler/**',
      '.output/**',
      '.nuxt/**'
    ]
  }
)
