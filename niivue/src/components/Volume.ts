import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import { NiiVueCanvas } from './NiiVueCanvas'
import { computed, useSignal, Signal } from '@preact/signals'
import { AppProps, SelectionMode } from './App'
import { ExtendedNiivue } from '../events'

export interface VolumeProps {
  name: string
  volumeIndex: number
  nv: ExtendedNiivue
  remove: Function
  width: number
  height: number
}

export const Volume = (props: AppProps & VolumeProps) => {
  const { name, volumeIndex, hideUI, selection, selectionMode, nv, location } = props
  const intensity = useSignal('')
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  const selected = computed(() => selection.value.includes(volumeIndex))

  useEffect(() => {
    nv.onLocationChange = (data: any) =>
      setIntensityAndLocation(data, intensity, location, volumeIndex == selection.value[0])
  }, [selection.value])

  // it would maybe need a invisible box over the volume to prevent the click event, stopPropagation and preventDefault don't work
  const selectClick = () => {
    if (selectionMode.value == SelectionMode.SINGLE) {
      selection.value = [volumeIndex]
    } else if (selectionMode.value == SelectionMode.MULTIPLE) {
      if (selected.value) {
        selection.value = selection.value.filter((i) => i != volumeIndex)
      } else {
        selection.value = [...selection.value, volumeIndex]
      }
    }
  }

  const nextVolume = () => {
    const currentVol = nv.volumes[0].frame4D
    nv.setFrame4D(nv.volumes[0].id, currentVol + 1)
  }

  const prevVolume = () => {
    const currentVol = nv.volumes[0].frame4D
    nv.setFrame4D(nv.volumes[0].id, currentVol - 1)
  }

  const is4D = computed(() => nv.volumes[0]?.nFrame4D && nv.volumes[0]?.nFrame4D > 1)

  return html`
    <div
      class="relative ${selectionMode.value && selected.value ? 'outline outline-blue-500' : ''}"
      onClick=${selectClick}
    >
      <${NiiVueCanvas} ...${props} />
      ${hideUI.value > 0 &&
      html`
        <div class="absolute pointer-events-none text-xl text-outline left-1 top-0">
          ${dispName}
        </div>
        <div class="pointer-events-none absolute bottom-1 left-1">
          <span class="text-outline" data-testid="intensity-${volumeIndex}">${intensity}</span>
        </div>
      `}
      ${hideUI.value > 2 &&
      html`
        <button
          class="absolute bg-transparent text-xl cursor-pointer opacity-80 border-none text-outline top-0 right-1"
          onClick=${props.remove}
        >
          X
        </button>
      `}
      ${hideUI.value > 2 &&
      is4D.value &&
      html`
        <div class="absolute bottom-0 right-0">
          <button
            class="bg-gray-300 bg-opacity-50 rounded-md text-2xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick=${nextVolume}
          >
            +
          </button>

          <button
            class="bg-gray-300 bg-opacity-50 rounded-md text-3xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick=${prevVolume}
          >
            -
          </button>
        </div>
      `}
    </div>
  `
}

function setIntensityAndLocation(
  data: any,
  intensity: Signal<string>,
  location: Signal<string>,
  setLocation: Boolean,
) {
  const parts = data.string.split('=')
  if (parts.length === 2) {
    intensity.value = parts.pop()
  }
  if (setLocation) {
    location.value = `${arrayToString(data.mm)} mm | Grid: ${arrayToString(data.vox, 0)}`
  }
}

function arrayToString(array: number[], precision = 2) {
  let str = ''
  for (const val of array) {
    str += val.toFixed(precision) + ' x '
  }
  return str.slice(0, -3)
}
