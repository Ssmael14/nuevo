import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCategorias } from '@/api/categorias';
import {
  CreateMedicamentoInput,
  createMedicamento,
  deleteMedicamento,
  listMedicamentos,
  updateMedicamento,
} from '@/api/medicamentos';
import type { FormaFarmaceutica, Medicamento } from '@/types';

const FORMAS: FormaFarmaceutica[] = [
  'TABLETA',
  'CAPSULA',
  'JARABE',
  'INYECTABLE',
  'CREMA',
  'SUSPENSION',
  'GOTAS',
  'SUPOSITORIO',
  'OTRO',
];

const emptyForm: CreateMedicamentoInput = {
  codigo: '',
  nombre: '',
  principioActivo: '',
  concentracion: '',
  formaFarmaceutica: 'TABLETA',
  presentacion: '',
  requiereReceta: false,
  stockMinimo: 10,
  categoriaId: null,
};

export function MedicamentosPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medicamento | null>(null);
  const [form, setForm] = useState<CreateMedicamentoInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['medicamentos', { q, page }],
    queryFn: () => listMedicamentos({ q: q || undefined, page, pageSize: 15 }),
  });
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: listCategorias,
  });

  const createMut = useMutation({
    mutationFn: createMedicamento,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicamentos'] });
      closeForm();
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? 'Error al crear');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateMedicamentoInput> }) =>
      updateMedicamento(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicamentos'] });
      closeForm();
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? 'Error al actualizar');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteMedicamento,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicamentos'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(med: Medicamento) {
    setEditing(med);
    setForm({
      codigo: med.codigo,
      nombre: med.nombre,
      principioActivo: med.principioActivo ?? '',
      concentracion: med.concentracion ?? '',
      formaFarmaceutica: med.formaFarmaceutica,
      presentacion: med.presentacion ?? '',
      requiereReceta: med.requiereReceta,
      stockMinimo: med.stockMinimo,
      categoriaId: med.categoriaId ?? null,
    });
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: CreateMedicamentoInput = {
      ...form,
      principioActivo: form.principioActivo || undefined,
      concentracion: form.concentracion || undefined,
      presentacion: form.presentacion || undefined,
      categoriaId: form.categoriaId || null,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, input: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-8">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medicamentos</h1>
          <p className="text-gray-600 mt-1">Catalogo de medicamentos.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          + Nuevo medicamento
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, codigo o principio activo..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-gray-500">Cargando...</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-3">Codigo</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Forma</th>
                  <th className="text-left px-4 py-3">Categoria</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-right px-4 py-3">Min</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((med) => {
                  const stockBajo = (med.stockTotal ?? 0) < med.stockMinimo;
                  return (
                    <tr key={med.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{med.codigo}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{med.nombre}</p>
                        {med.principioActivo && (
                          <p className="text-xs text-gray-500">{med.principioActivo}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{med.formaFarmaceutica}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {med.categoria?.nombre ?? '—'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          stockBajo ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {med.stockTotal ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{med.stockMinimo}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEdit(med)}
                          className="text-primary-700 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminar "${med.nombre}"?`)) deleteMut.mutate(med.id);
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No se encontraron medicamentos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {data && data.total > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
                <p className="text-gray-600">
                  {data.total} resultado(s) — Pagina {data.page} de {totalPages}
                </p>
                <div className="space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto"
          >
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar medicamento' : 'Nuevo medicamento'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Codigo *">
                <input
                  required
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Nombre *">
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Principio activo">
                <input
                  value={form.principioActivo ?? ''}
                  onChange={(e) => setForm({ ...form, principioActivo: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Concentracion">
                <input
                  value={form.concentracion ?? ''}
                  onChange={(e) => setForm({ ...form, concentracion: e.target.value })}
                  placeholder="ej. 500 mg"
                  className="input"
                />
              </Field>
              <Field label="Forma farmaceutica">
                <select
                  value={form.formaFarmaceutica}
                  onChange={(e) =>
                    setForm({ ...form, formaFarmaceutica: e.target.value as FormaFarmaceutica })
                  }
                  className="input"
                >
                  {FORMAS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Categoria">
                <select
                  value={form.categoriaId ?? ''}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value || null })}
                  className="input"
                >
                  <option value="">— Sin categoria —</option>
                  {categorias?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Presentacion">
                <input
                  value={form.presentacion ?? ''}
                  onChange={(e) => setForm({ ...form, presentacion: e.target.value })}
                  placeholder="ej. Caja x 100 tabletas"
                  className="input"
                />
              </Field>
              <Field label="Stock minimo">
                <input
                  type="number"
                  min={0}
                  value={form.stockMinimo}
                  onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="">
                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={form.requiereReceta}
                    onChange={(e) => setForm({ ...form, requiereReceta: e.target.checked })}
                  />
                  Requiere receta medica
                </label>
              </Field>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-2 text-sm mt-4">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {children}
    </div>
  );
}
