import React, { useEffect, useState } from 'react';
import { Plus, Pencil, X, Loader2 } from 'lucide-react';
import { adminApi } from './api';
import { ApiError } from '../lib/api';
import type { Product } from '../types';
import { LEAGUES, JERSEY_TYPES } from '../shared/catalog';
import { Btn, Pill, taka, inputCls, textareaCls } from './ui';

type Form = {
  id: string; name: string; price: string; originalPrice: string; image: string; gallery: string;
  category: 'Club' | 'National'; team: string; league: string; type: string;
  isPlayerEdition: boolean; isPreorder: boolean; isActive: boolean; stock: string;
  description: string; season: string; color: string;
};

const blank: Form = {
  id: '', name: '', price: '', originalPrice: '', image: '', gallery: '', category: 'Club', team: '', league: LEAGUES[0], type: 'Home',
  isPlayerEdition: false, isPreorder: false, isActive: true, stock: '0', description: '', season: '2025/26', color: '',
};

const toForm = (p: Product): Form => ({
  id: p.id, name: p.name, price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '', image: p.image,
  gallery: (p.gallery ?? []).join('\n'), category: p.category as Form['category'], team: p.team, league: p.league, type: p.type,
  isPlayerEdition: p.isPlayerEdition, isPreorder: Boolean(p.isPreorder), isActive: p.isActive !== false, stock: String(p.stock ?? 0),
  description: p.description, season: p.season ?? '', color: p.color ?? '',
});

const toPayload = (f: Form) => ({
  ...(f.id.trim() ? { id: f.id.trim() } : {}),
  name: f.name, price: Number(f.price), originalPrice: f.originalPrice ? Number(f.originalPrice) : null, image: f.image.trim(),
  gallery: f.gallery.split('\n').map((s) => s.trim()).filter(Boolean), category: f.category, team: f.team, league: f.league, type: f.type,
  isPlayerEdition: f.isPlayerEdition, isPreorder: f.isPreorder, isActive: f.isActive, stock: Number(f.stock || 0),
  description: f.description, season: f.season || null, color: f.color.replace('#', '') || null,
});

const statusLabel: Record<string, [string, string]> = {
  'in-stock': ['completed', 'In stock'], 'low-stock': ['pending_payment', 'Low stock'], 'out-of-stock': ['failed', 'Sold out'], 'pre-order': ['confirmed', 'Pre-order'],
};

export const Products: React.FC<{ onAuthError: (e: unknown) => void }> = ({ onAuthError }) => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<{ mode: 'new' | 'edit'; form: Form } | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  const load = () => adminApi.products().then(setProducts).catch(onAuthError);
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(editing.form);
      if (editing.mode === 'new') await adminApi.createProduct(payload);
      else await adminApi.updateProduct(editing.form.id, payload);
      setEditing(null);
      await load();
    } catch (err) {
      onAuthError(err);
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async (p: Product) => {
    const value = stockEdits[p.id];
    if (value === undefined || Number(value) === p.stock) return;
    try {
      await adminApi.updateProduct(p.id, { ...toPayload(toForm(p)), stock: Math.max(0, Number(value) || 0) });
      setStockEdits(({ [p.id]: _, ...rest }) => rest);
      await load();
    } catch (err) {
      onAuthError(err);
      alert(err instanceof ApiError ? err.message : 'Could not update stock');
    }
  };

  const f = editing?.form;
  const setF = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEditing((ed) => ed && { ...ed, form: { ...ed.form, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Btn onClick={() => { setError(''); setEditing({ mode: 'new', form: blank }); }}><Plus size={16} /> Add product</Btn>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="font-medium px-4 py-3">Product</th>
              <th className="font-medium px-4 py-3">League</th>
              <th className="font-medium px-4 py-3 text-right">Price</th>
              <th className="font-medium px-4 py-3">Stock</th>
              <th className="font-medium px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!products && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
            {products?.map((p) => (
              <tr key={p.id} className={p.isActive === false ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-10 h-12 object-cover rounded bg-slate-100" />
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[260px]">{p.name}</div>
                      <div className="text-xs text-slate-500">#{p.id} · {p.team}{p.isPlayerEdition ? ' · Player' : ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.league}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {taka(p.price)}
                  {p.originalPrice && <div className="text-xs text-slate-400 line-through">{taka(p.originalPrice)}</div>}
                </td>
                <td className="px-4 py-3">
                  {p.isPreorder ? <span className="text-xs text-slate-400">Pre-order</span> : (
                    <input
                      type="number" min={0} aria-label={`Stock for ${p.name}`}
                      className={`${inputCls} w-20 h-8 tabular-nums`}
                      value={stockEdits[p.id] ?? String(p.stock ?? 0)}
                      onChange={(e) => setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))}
                      onBlur={() => saveStock(p)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.isActive === false ? <Pill value="cancelled" label="Archived" /> : <Pill value={statusLabel[p.status][0]} label={statusLabel[p.status][1]} />}
                </td>
                <td className="px-4 py-3 text-right">
                  <Btn tone="ghost" className="h-8 px-3" onClick={() => { setError(''); setEditing({ mode: 'edit', form: toForm(p) }); }}><Pencil size={14} /> Edit</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && f && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl h-full bg-white overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold">{editing.mode === 'new' ? 'Add product' : `Edit #${f.id}`}</h2>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <L label="Name" span><input className={inputCls} value={f.name} onChange={setF('name')} required /></L>
              {editing.mode === 'new' && <L label="ID / slug (optional)" span><input className={inputCls} value={f.id} onChange={setF('id')} placeholder="auto-generated" /></L>}
              <L label="Price (৳)"><input className={inputCls} type="number" min={0} value={f.price} onChange={setF('price')} required /></L>
              <L label="Compare-at price (৳)"><input className={inputCls} type="number" min={0} value={f.originalPrice} onChange={setF('originalPrice')} /></L>
              <L label="Stock"><input className={inputCls} type="number" min={0} value={f.stock} onChange={setF('stock')} disabled={f.isPreorder} /></L>
              <L label="Season"><input className={inputCls} value={f.season} onChange={setF('season')} /></L>
              <L label="Team"><input className={inputCls} value={f.team} onChange={setF('team')} required /></L>
              <L label="Category">
                <select className={inputCls} value={f.category} onChange={setF('category')}><option>Club</option><option>National</option></select>
              </L>
              <L label="League"><select className={inputCls} value={f.league} onChange={setF('league')}>{LEAGUES.map((l) => <option key={l}>{l}</option>)}</select></L>
              <L label="Kit type"><select className={inputCls} value={f.type} onChange={setF('type')}>{JERSEY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></L>
              <L label="Main image URL" span><input className={inputCls} type="url" value={f.image} onChange={setF('image')} required /></L>
              <L label="Gallery image URLs (one per line)" span><textarea className={`${textareaCls} h-24`} value={f.gallery} onChange={setF('gallery')} /></L>
              <L label="Team colour (hex)"><input className={inputCls} value={f.color} onChange={setF('color')} placeholder="A50044" /></L>
              <div />
              <L label="Description" span><textarea className={`${textareaCls} h-28`} value={f.description} onChange={setF('description')} /></L>
              <div className="col-span-2 flex flex-wrap gap-5 text-sm">
                <Check label="Player edition" checked={f.isPlayerEdition} onChange={setF('isPlayerEdition')} />
                <Check label="Pre-order (no stock limit)" checked={f.isPreorder} onChange={setF('isPreorder')} />
                <Check label="Visible in store" checked={f.isActive} onChange={setF('isActive')} />
              </div>
              {error && <p className="col-span-2 text-sm text-red-600" role="alert">{error}</p>}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-2">
              <Btn type="button" tone="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn type="submit" disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} Save</Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const L: React.FC<{ label: string; span?: boolean; children: React.ReactNode }> = ({ label, span, children }) => (
  <label className={`block ${span ? 'col-span-2' : 'col-span-2 sm:col-span-1'}`}>
    <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>
    {children}
  </label>
);

const Check: React.FC<{ label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, checked, onChange }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 accent-slate-900" checked={checked} onChange={onChange} /> {label}
  </label>
);
