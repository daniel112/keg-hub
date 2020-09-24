import { colors } from '../../colors'
import { transition } from '../../transition'
import { get } from '@keg-hub/jsutils'
import { buildTheme } from '../../../utils/styles'
import { getThemeDefaults } from '../../themeDefaults'

const defaults = getThemeDefaults()
const containedStyles = (state, colorType) => {
  const opacity = get(defaults, `states.types.${state}.opacity`)
  const shade = get(defaults, `states.types.${state}.shade`)
  const activeColor = get(colors, `surface.${colorType}.colors.${shade}`)
  return {
    main: {
      $all: {
        borderWidth: 0,
        borderRadius: 4,
        backgroundColor: activeColor,
        padding: 9,
        minHeight: 35,
        opacity,
      },
      $web: {
        cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
        boxShadow: 'none',
        ...transition([ 'backgroundColor', 'borderColor' ], 0.5),
      },
      $native: {},
    },
    content: {
      color:
        state === 'disabled'
          ? get(colors, 'opacity._50')
          : get(colors, 'palette.white01'),
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.5,
        textAlign: 'center',
        $web: {
          ...transition(['color'], 0.5),
        },
    },
  }
}

export const contained = buildTheme(containedStyles)
