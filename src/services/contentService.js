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

export async function loadPublishedContent() {
  if (!supabase) return { content: fallbackContent, source: 'local' }

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
        return { key, value: data?.length ? data : fallbackContent[key], remote: Boolean(data?.length) }
      } catch (error) {
        console.warn(`Unable to load ${table}; using curated fallback content.`, error)
        return { key, value: fallbackContent[key], remote: false }
      }
    }),
  )

  const remoteCount = entries.filter((entry) => entry.remote).length
  const source = remoteCount === entries.length ? 'supabase' : remoteCount > 0 ? 'hybrid' : 'local'

  return {
    content: Object.fromEntries(entries.map(({ key, value }) => [key, value])),
    source,
  }
}
