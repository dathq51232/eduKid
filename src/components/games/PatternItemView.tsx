import ShapeIcon, { ArrowIcon } from './ShapeIcon';
import { itemName, type PatternItem } from '@/lib/games/patterns';

/** Vẽ một ô trong dãy quy luật: một hình, một nhóm nhiều hình (đếm), hoặc mũi tên */
export default function PatternItemView({ item, size = 44, labelled = false }: { item: PatternItem; size?: number; labelled?: boolean }) {
  const label = labelled ? itemName(item) : undefined;
  if (item.kind === 'shape') return <ShapeIcon shape={item.shape} color={item.color} size={size} label={label} />;
  if (item.kind === 'arrow') return <ArrowIcon dir={item.dir} color={item.color} size={size} label={label} />;
  const small = Math.round(size * 0.42);
  return (
    <span className="pattern-count" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: item.n }, (_, i) => (
        <ShapeIcon key={i} shape={item.shape} color={item.color} size={small} />
      ))}
    </span>
  );
}
