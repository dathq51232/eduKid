'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CatalogForm, CatalogOutcome, CatalogTopic } from './types';

export const subjectFamily = (subjectCode: string) => subjectCode.replace(/-\d+$/, '');

// Tải danh mục của một môn-lớp: chủ đề + YCCĐ + dạng bài.
export function useCatalog(subjectId: string | undefined, subjectCode: string | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const [topics, setTopics] = useState<CatalogTopic[]>([]);
  const [forms, setForms] = useState<CatalogForm[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!subjectId || !subjectCode) return;
    let alive = true;
    Promise.all([
      supabase
        .from('curriculum_topics')
        .select('id,code,title,description,is_core,status,sort_order,learning_outcomes(id,code,description,stage,is_core,status,topic_id)')
        .eq('subject_id', subjectId)
        .order('sort_order'),
      supabase.from('exercise_forms').select('*').eq('subject_family', subjectFamily(subjectCode)).order('sort_order'),
    ]).then(([t, f]) => {
      if (!alive) return;
      const list = ((t.data ?? []) as CatalogTopic[]).map((x) => ({
        ...x,
        learning_outcomes: [...(x.learning_outcomes ?? [])].sort((a, b) => a.stage - b.stage || a.code.localeCompare(b.code)),
      }));
      setTopics(list);
      setForms((f.data ?? []) as CatalogForm[]);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [supabase, subjectId, subjectCode]);

  const outcomes = useMemo(() => topics.flatMap((t) => t.learning_outcomes), [topics]);
  return { topics, outcomes, forms, loaded };
}

export function outcomeLabel(o: CatalogOutcome | undefined) {
  return o ? `${o.code} — ${o.description}` : '';
}
