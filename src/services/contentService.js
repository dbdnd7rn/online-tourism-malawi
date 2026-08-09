import {
  creativeDirectory as fallbackCreatives,
  events as fallbackEvents,
  heritageItems as fallbackHeritage,
  museums as fallbackMuseums,
  performances as fallbackPerformances,
  podcasts as fallbackPodcasts,
} from '../data/content'
import { supabase } from '../lib/supabase'

export const fallbackContent = {
  creatives: fallbackCreatives,
  events: fallbackEvents,
  heritageItems: fallbackHeritage,
  museums: fallbackMuseums,
  performances: fallbackPerformances,
  podcasts: fallbackPodcasts,
}

const tables = {
  creatives: 'creative_profiles',
  events: 'events',
  heritageItems: 'heritage_items',
  museums: 'museums',
  performances: 'performances',
  podcasts: 'podcasts',
}

export async function loadPublishedContent() {
  if (!supabase) return { content: fallbackContent, source: 'local' }

  const entries = await Promise.all(
    Object.entries(tables).map(async ([key, table]) => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return [key, data?.length ? data : fallbackContent[key]]
    }),
  )

  return { content: Object.fromEntries(entries), source: 'supabase' }
}
