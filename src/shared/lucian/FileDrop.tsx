/* Lucian UX/UI Prompt #032 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#032 */
// Drag-and-drop attachments. There is no file server yet, so the progress bar reflects local
// processing and only file name + size are stored on the ticket.
// Adapted: every row has a remove button (cancels an upload in progress, or drops an attached file)
// and leaves with the element's own .out motion; failed rows are dismissed the same way.
import { useEffect, useRef } from 'react';
import type { Attachment } from '@/domain/ticket';
import './lucian-032.css';

const TYPE: Record<string, string> = { pdf: 'var(--ux-danger)', png: 'var(--ux-accent-2)', jpg: 'var(--ux-accent-2)', jpeg: 'var(--ux-accent-2)', rvt: 'var(--ux-accent)', dwg: 'var(--ux-accent)' };
const MAX_FILES = 5;
const MAX_BYTES = 25 * 1048576;
const OUT_MS = 350;

const CHECK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.4"/></svg>';
const CLOSE_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';

function size(b: number) {
  return b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

export function FileDrop({ onChange }: { onChange: (files: Attachment[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const root = ref.current!;
    const zone = root.querySelector<HTMLButtonElement>('.u032-zone')!;
    const pick = root.querySelector<HTMLInputElement>('.u032-file')!;
    const list = root.querySelector<HTMLUListElement>('.u032-list')!;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frames = new Map<HTMLLIElement, number>();
    const timers = new Set<number>();
    // StrictMode remounts reuse the same DOM, so listeners must go away with the effect.
    const listeners = new AbortController();
    const on = { signal: listeners.signal };
    // Rows that hold (or are about to hold) an attachment, in list order; failed rows are not here.
    const pending = new Set<HTMLLIElement>();
    const attached = new Map<HTMLLIElement, Attachment>();

    function publish() {
      const rows = Array.from(list.children) as HTMLLIElement[];
      onChangeRef.current(rows.filter((r) => attached.has(r)).map((r) => attached.get(r)!));
    }

    function remove(row: HTMLLIElement) {
      if (row.classList.contains('out')) return;
      const frame = frames.get(row);
      if (frame) cancelAnimationFrame(frame);
      frames.delete(row);
      pending.delete(row);
      if (attached.delete(row)) publish();
      // Keep keyboard focus in the list: next row's remove button, else the previous one, else the drop zone.
      const sibling = (row.nextElementSibling ?? row.previousElementSibling) as HTMLLIElement | null;
      const focusTarget = sibling?.querySelector<HTMLButtonElement>('.u032-del') ?? zone;
      if (row.contains(document.activeElement)) focusTarget.focus();
      row.classList.add('out');
      const id = window.setTimeout(() => {
        timers.delete(id);
        row.remove();
      }, rm ? 0 : OUT_MS);
      timers.add(id);
    }

    function run(row: HTMLLIElement, bytes: number, file: Attachment) {
      const st = row.querySelector('.u032-st')!;
      const sm = row.querySelector('small')!;
      st.innerHTML = '<span class="u032-spin" aria-hidden="true"></span>';
      const t0 = performance.now();
      const D = rm ? 300 : 900 + Math.random() * 600;
      const f = (now: number) => {
        const p = Math.min(1, (now - t0) / D);
        row.style.setProperty('--p', p.toFixed(3));
        sm.textContent = `${size(bytes * p)} / ${size(bytes)} · ${Math.round(p * 100)}%`;
        if (p < 1) {
          frames.set(row, requestAnimationFrame(f));
          return;
        }
        frames.delete(row);
        row.classList.add('done');
        sm.textContent = `${size(bytes)} · Đã đính kèm`;
        st.innerHTML = CHECK_SVG;
        attached.set(row, file);
        publish();
      };
      frames.set(row, requestAnimationFrame(f));
    }

    function fail(row: HTMLLIElement, reason: string) {
      row.classList.add('fail');
      row.querySelector('small')!.textContent = reason;
      row.querySelector('.u032-st')!.remove();
    }

    function add(name: string, bytes: number) {
      const ext = (name.split('.').pop() || '').toLowerCase();
      const li = document.createElement('li');
      li.className = 'u032-row';
      li.innerHTML = `<span class="u032-ic" style="--c:${TYPE[ext] || 'var(--ux-ink-3)'}" aria-hidden="true">${ext.slice(0, 3).toUpperCase() || 'FILE'}</span><span class="u032-meta"><b></b><small></small></span><span class="u032-st"></span><button class="u032-del" type="button">${CLOSE_SVG}</button><span class="u032-bar" aria-hidden="true"></span>`;
      li.querySelector('b')!.textContent = name;
      const del = li.querySelector<HTMLButtonElement>('.u032-del')!;
      del.setAttribute('aria-label', `Xóa ${name}`);
      del.title = 'Xóa file';
      del.addEventListener('click', () => remove(li));
      list.insertBefore(li, list.firstChild);
      if (bytes > MAX_BYTES) return fail(li, `${size(bytes)} · Vượt quá 25 MB`);
      if (pending.size >= MAX_FILES) return fail(li, `Tối đa ${MAX_FILES} file · xóa bớt để thêm`);
      pending.add(li);
      run(li, bytes, { name, size: bytes });
    }

    const addAll = (fl: FileList | null) => Array.from(fl ?? []).forEach((f) => add(f.name, f.size));
    zone.addEventListener('click', () => pick.click(), on);
    pick.addEventListener('change', () => {
      addAll(pick.files);
      pick.value = '';
    }, on);
    let depth = 0;
    zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      depth++;
      root.classList.add('is-over');
    }, on);
    zone.addEventListener('dragover', (e) => e.preventDefault(), on);
    zone.addEventListener('dragleave', () => {
      if (--depth <= 0) {
        depth = 0;
        root.classList.remove('is-over');
      }
    }, on);
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      depth = 0;
      root.classList.remove('is-over');
      addAll(e.dataTransfer?.files ?? null);
    }, on);
    return () => {
      listeners.abort();
      frames.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
      list.replaceChildren();
    };
  }, []);

  return (
    <div ref={ref} className="ux u032">
      <button className="u032-zone" type="button">
        <svg className="u032-dash" aria-hidden="true">
          <rect width="100%" height="100%" rx="11" />
        </svg>
        <span className="u032-orb" aria-hidden="true">
          <svg viewBox="0 0 28 28">
            <path d="M8.5 20.5H7a5 5 0 0 1-.6-10 7 7 0 0 1 13.4-1.6A5.5 5.5 0 0 1 21 20.5h-1.5M14 13v10M10.5 16.5L14 13l3.5 3.5" />
          </svg>
        </span>
        <b>
          Kéo ảnh chụp lỗi vào đây hoặc <em>chọn file</em>
        </b>
        <small>Ảnh màn hình, PDF, log · tối đa {MAX_FILES} file, 25 MB mỗi file</small>
      </button>
      <input className="u032-file" type="file" multiple tabIndex={-1} aria-hidden="true" />
      <ul className="u032-list" aria-live="polite" />
    </div>
  );
}
