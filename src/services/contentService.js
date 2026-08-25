import {
  creativeDirectory as fallbackCreatives,
  events as fallbackEvents,
  heritageItems as fallbackHeritage,
  mediaItems as fallbackMediaItems,
  museums as fallbackMuseums,
  performances as fallbackPerformances,
  podcasts as fallbackPodcasts,
} from '../data/content'
import { supabase } from '../lib/supabase'

export const fallbackContent = {
  creatives: fallbackCreatives,
  events: fallbackEvents,
  heritageItems: fallbackHeritage,
  mediaItems: fallbackMediaItems,
  museums: fallbackMuseums,
  performances: fallbackPerformances,
  podcasts: fallbackPodcasts,
}

const tables = {
  creatives: 'creative_profiles',
  events: 'events',
  heritageItems: 'heritage_items',
  mediaItems: 'media_items',
  museums: 'museums',
  performances: 'performances',
  podcasts: 'podcasts',
}

export const emptyContent = Object.fromEntries(Object.keys(tables).map((key) => [key, []]))
export const initialContent = supabase ? emptyContent : fallbackContent

export async function loadPublishedContent() {
  if (!supabase) return { content: fallbackContent, source: 'local', errors: [] }

  const entries = await Promise.all(
    Object.entries(tables).map(async ([key, table]) => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('published', true)
          .order('featured', { ascending: false })
          .order('sort_order', { ascending: true })

        if (error) throw error
        return { key, value: data ?? [], error: null }
      } catch (error) {
        console.error(`Unable to load ${table}; keeping this public collection unavailable.`, error)
        return {
          key,
          value: [],
          error: error instanceof Error ? error.message : `Unable to load ${table}`,
        }
      }
    }),
  )

  const errors = entries
    .filter((entry) => entry.error)
    .map((entry) => ({ key: entry.key, message: entry.error }))

  return {
    content: Object.fromEntries(entries.map(({ key, value }) => [key, value])),
    source: errors.length ? 'degraded' : 'supabase',
    errors,
  }
}
