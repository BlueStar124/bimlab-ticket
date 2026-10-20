import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/shared/ui/Icon';
import { FaqAccordion } from '@/shared/lucian/FaqAccordion';
import { CATEGORIES } from '@/domain/categories';
import { KNOWLEDGE } from '@/domain/knowledge';

/** Accent-insensitive match so "mat khau" finds "mật khẩu". */
function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

export function KnowledgePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState('');

  const q = normalize(query.trim());
  const words = q.split(/\s+/).filter(Boolean);
  const shown = KNOWLEDGE.filter((k) => !cat || k.categoryId === cat).filter((k) => {
    const text = normalize(`${k.question} ${k.answer}`);
    return words.every((w) => text.includes(w));
  });
  const usedCats = CATEGORIES.filter((c) => KNOWLEDGE.some((k) => k.categoryId === c.id));

  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Hướng dẫn tự xử lý</h1>
          <p>Thử các bước này trước — nhiều lỗi thường gặp có thể xử lý trong vài phút.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm: vpn, mật khẩu, revit, máy in…" aria-label="Tìm hướng dẫn" />
        </div>
      </div>
      <div className="chips" role="group" aria-label="Lọc theo nhóm" style={{ marginBottom: 16 }}>
        <button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat('')}>
          Tất cả
        </button>
        {usedCats.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      {shown.length > 0 ? (
        <FaqAccordion
          key={`${q}|${cat}`}
          initialOpen={shown.length === 1 ? 0 : null}
          items={shown.map((k) => ({
            id: k.id,
            question: k.question,
            answer: k.answer,
            link: { label: 'Vẫn chưa được? Gửi yêu cầu', onClick: () => navigate(`/gui-yeu-cau?nhom=${k.categoryId}`) },
          }))}
        />
      ) : (
        <div className="card empty">
          <Icon name="search" size={40} />
          <p>Chưa có hướng dẫn cho “{query}”.</p>
          <Link to="/gui-yeu-cau" className="btn btn-primary">
            Gửi yêu cầu cho Phòng CNTT
          </Link>
        </div>
      )}
    </main>
  );
}
