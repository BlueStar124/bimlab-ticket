// BIMLab mark in the Hairline line style: three isometric floor slabs on columns, a building model.
// Hovering or focusing the brand link explodes the floors apart (an exploded BIM view) and they spring
// back. Pure SVG + CSS (styles in layout.css under .brand-mark), so it costs nothing at runtime.

/** One floor slab whose top face is centred at (16, y): face, then the visible side faces. */
function Slab({ y, className }: { y: number; className: string }) {
  const T = 2; // slab thickness
  return (
    <g className={className}>
      <path className="brand-mark-side" d={`M5 ${y}V${y + T}L16 ${y + 5.5 + T}L27 ${y + T}V${y}`} />
      <path className="brand-mark-edge" d={`M16 ${y + 5.5}V${y + 5.5 + T}`} />
      <path className="brand-mark-face" d={`M16 ${y - 5.5}L27 ${y}L16 ${y + 5.5}L5 ${y}Z`} />
    </g>
  );
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
      {/* Columns sit behind the slabs and show in the gaps; they stretch when the floors lift. */}
      <path className="brand-mark-cols" d="M5 11V24M27 11V24" />
      <Slab y={24} className="brand-mark-f1" />
      <Slab y={16.5} className="brand-mark-f2" />
      <Slab y={9} className="brand-mark-f3" />
    </svg>
  );
}
