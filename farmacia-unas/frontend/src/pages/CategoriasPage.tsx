import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategoria,
  deleteCategoria,
  listCategorias,
  updateCategoria,
} from '@/api/categorias';
import type { Categoria } from '@/types';

export function CategoriasPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['categorias'], queryFn: listCategorias });

  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: createCategoria,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      resetForm();
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? 'Error al crear');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Categoria> }) =>
      updateCategoria(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert((err as any)?.response?.data?.error ?? 'No se pudo eliminar');
    },
  });

  function resetForm() {
    setEditing(null);
    setNombre('');
    setDescripcion('');
    setError(null);
  }

  function handleEdit(cat: Categoria) {
    setEditing(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion ?? '');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = { nombre, descripcion: descripcion || undefined };
    if (editing) {
      updateMut.mutate({ id: editing.id, input });
    } else {
      createMut.mutate(input);
    }
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <p className="text-gray-600 mt-1">Clasificacion de medicamentos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-1 h-fit"
        >
          <h2 className="font-semibold mb-4">
            {editing ? 'Editar categoria' : 'Nueva categoria'}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripcion
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-2 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg disabled:opacity-60"
              >
                {editing ? 'Guardar' : 'Crear'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
          {isLoading ? (
            <p className="p-6 text-gray-500">Cargando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Descripcion</th>
                  <th className="text-right px-4 py-3">Medicamentos</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((cat) => (
                  <tr key={cat.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{cat.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{cat.descripcion ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{cat._count?.medicamentos ?? 0}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-primary-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminar categoria "${cat.nombre}"?`)) {
                            deleteMut.mutate(cat.id);
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No hay categorias registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
