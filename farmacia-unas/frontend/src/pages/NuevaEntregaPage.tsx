import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createEntrega } from '@/api/entregas';
import { listPacientes } from '@/api/pacientes';
import { getMedicamentoByCodigoBarras, listMedicamentos } from '@/api/medicamentos';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { toastApiError } from '@/lib/api';
import type { Medicamento, Paciente } from '@/types';

interface Item {
  medicamentoId: string;
  medicamentoNombre: string;
  codigo: string;
  stockDisponible: number;
  cantidad: number;
  indicaciones: string;
}

export function NuevaEntregaPage() {
  const navigate = useNavigate();
  const [pacienteId, setPacienteId] = useState('');
  const [pacienteQ, setPacienteQ] = useState('');
  const debouncedPacienteQ = useDebounce(pacienteQ, 350);
  const [diagnostico, setDiagnostico] = useState('');
  const [numeroReceta, setNumeroReceta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [medQ, setMedQ] = useState('');
  const debouncedMedQ = useDebounce(medQ, 350);

  const { data: pacientesData } = useQuery({
    queryKey: ['pacientes-search', debouncedPacienteQ],
    queryFn: () => listPacientes({ q: debouncedPacienteQ || undefined, pageSize: 10 }),
    enabled: debouncedPacienteQ.length > 1,
  });
  const pacienteSeleccionado: Paciente | undefined = pacientesData?.items.find((p) => p.id === pacienteId);

  const { data: medsData } = useQuery({
    queryKey: ['meds-search', debouncedMedQ],
    queryFn: () => listMedicamentos({ q: debouncedMedQ || undefined, pageSize: 15, soloActivos: 'true' }),
  });

  const createMut = useMutation({
    mutationFn: createEntrega,
    onSuccess: (e) => {
      toast.success(`Entrega ${e.numero} registrada`);
      navigate(`/entregas/${e.id}`);
    },
    onError: (err) => toastApiError(err, 'No se pudo registrar la entrega'),
  });

  function agregarMedicamento(med: Medicamento) {
    const existente = items.findIndex((i) => i.medicamentoId === med.id);
    if (existente >= 0) {
      // Si ya esta, incrementa cantidad (util para scanner)
      const it = items[existente];
      if (it.cantidad + 1 > it.stockDisponible) {
        toast.error(`Stock insuficiente para "${med.nombre}"`);
        return;
      }
      setItems(items.map((x, i) => (i === existente ? { ...x, cantidad: x.cantidad + 1 } : x)));
      toast.success(`+1 ${med.nombre}`);
      return;
    }
    if ((med.stockTotal ?? 0) === 0) {
      toast.error(`"${med.nombre}" sin stock`);
      return;
    }
    setItems([
      ...items,
      {
        medicamentoId: med.id,
        medicamentoNombre: med.nombre,
        codigo: med.codigo,
        stockDisponible: med.stockTotal ?? 0,
        cantidad: 1,
        indicaciones: '',
      },
    ]);
    setMedQ('');
  }

  function addItem(medId: string) {
    const med = medsData?.items.find((m) => m.id === medId);
    if (!med) return;
    agregarMedicamento(med);
  }

  async function handleBarcodeScan(codigo: string) {
    try {
      const med = await getMedicamentoByCodigoBarras(codigo);
      agregarMedicamento(med);
    } catch (err) {
      toastApiError(err, `No se encontro medicamento con codigo "${codigo}"`);
    }
  }

  function updateItem(idx: number, partial: Partial<Item>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...partial } : it)));
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pacienteId) return toast.error('Selecciona un paciente');
    if (items.length === 0) return toast.error('Agrega al menos un medicamento');
    for (const it of items) {
      if (it.cantidad < 1) return toast.error(`Cantidad invalida para "${it.medicamentoNombre}"`);
      if (it.cantidad > it.stockDisponible)
        return toast.error(`Stock insuficiente para "${it.medicamentoNombre}"`);
    }

    createMut.mutate({
      pacienteId,
      diagnostico: diagnostico || null,
      numeroReceta: numeroReceta || null,
      observaciones: observaciones || null,
      items: items.map((i) => ({
        medicamentoId: i.medicamentoId,
        cantidad: i.cantidad,
        indicaciones: i.indicaciones || null,
      })),
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Nueva entrega</h1>
        <p className="text-muted-foreground mt-1">
          Registra una entrega de medicamentos. El descuento de stock se aplica por FEFO (primero los que vencen antes).
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pacienteSeleccionado ? (
              <>
                <Label>Buscar paciente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Codigo, DNI, nombres o apellidos..."
                    value={pacienteQ}
                    onChange={(e) => setPacienteQ(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {pacientesData && pacientesData.items.length > 0 && (
                  <div className="border border-border rounded-md max-h-64 overflow-auto">
                    {pacientesData.items.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPacienteId(p.id)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted text-left border-b border-border last:border-0"
                      >
                        <div>
                          <p className="font-medium">{p.apellidos}, {p.nombres}</p>
                          <p className="text-xs text-muted-foreground">{p.codigo} · {p.tipo}</p>
                        </div>
                        <Badge variant="outline">{p.tipo}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{pacienteSeleccionado.apellidos}, {pacienteSeleccionado.nombres}</p>
                  <p className="text-sm text-muted-foreground">
                    {pacienteSeleccionado.codigo} · {pacienteSeleccionado.tipo}
                    {pacienteSeleccionado.facultad ? ` · ${pacienteSeleccionado.facultad}` : ''}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPacienteId('')}>
                  Cambiar
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Diagnostico</Label>
                <Input value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Numero de receta</Label>
                <Input value={numeroReceta} onChange={(e) => setNumeroReceta(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medicamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10 p-3 space-y-2">
              <p className="text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wide">
                Agregar por codigo de barras
              </p>
              <BarcodeScanner onScan={handleBarcodeScan} />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">o busqueda manual</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar medicamento por nombre o codigo..."
                  value={medQ}
                  onChange={(e) => setMedQ(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value="" onValueChange={addItem}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {medsData?.items.map((m) => (
                    <SelectItem key={m.id} value={m.id} disabled={(m.stockTotal ?? 0) === 0}>
                      {m.codigo} — {m.nombre} (stock: {m.stockTotal ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead className="w-32">Cantidad</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Indicaciones</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Plus className="h-10 w-10 mx-auto opacity-30 mb-2" />
                      No hay medicamentos. Busca y agrega arriba.
                    </TableCell>
                  </TableRow>
                ) : items.map((it, idx) => (
                  <TableRow key={it.medicamentoId}>
                    <TableCell className="font-mono text-xs">{it.codigo}</TableCell>
                    <TableCell className="font-medium">{it.medicamentoNombre}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={it.stockDisponible}
                        value={it.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: Number(e.target.value) || 1 })}
                        className="h-9 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={it.cantidad > it.stockDisponible ? 'destructive' : 'secondary'}>
                        {it.stockDisponible}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Cada 8 horas..."
                        value={it.indicaciones}
                        onChange={(e) => updateItem(idx, { indicaciones: e.target.value })}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(idx)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/entregas')}>Cancelar</Button>
          <Button type="submit" disabled={createMut.isPending}>
            <Save className="h-4 w-4" /> Registrar entrega
          </Button>
        </div>
      </form>
    </div>
  );
}
