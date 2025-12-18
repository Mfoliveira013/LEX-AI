import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const areasOptions = [
  { value: "civil", label: "Civil" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "tributario", label: "Tributário" },
  { value: "empresarial", label: "Empresarial" },
  { value: "consumidor", label: "Consumidor" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família" },
  { value: "administrativo", label: "Administrativo" }
];

export default function NovoCasoModal({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    titulo: "",
    cliente: "",
    area_direito: "civil",
    numero_processo: "",
    parte_contraria: "",
    valor_causa: "",
    prazo_proximo: "",
    resumo: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      valor_causa: formData.valor_causa ? parseFloat(formData.valor_causa) : null,
      status: "em_analise"
    };
    onSubmit(dataToSubmit);
    setFormData({
      titulo: "",
      cliente: "",
      area_direito: "civil",
      numero_processo: "",
      parte_contraria: "",
      valor_causa: "",
      prazo_proximo: "",
      resumo: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Caso Jurídico</DialogTitle>
          <DialogDescription>
            Cadastre um novo caso no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Caso *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Ação Trabalhista - Silva vs Empresa XYZ"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_direito">Área do Direito *</Label>
              <Select value={formData.area_direito} onValueChange={(value) => setFormData({ ...formData, area_direito: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areasOptions.map(area => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_processo">Número do Processo</Label>
              <Input
                id="numero_processo"
                placeholder="0000000-00.0000.0.00.0000"
                value={formData.numero_processo}
                onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parte_contraria">Parte Contrária</Label>
              <Input
                id="parte_contraria"
                placeholder="Nome da parte contrária"
                value={formData.parte_contraria}
                onChange={(e) => setFormData({ ...formData, parte_contraria: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_causa">Valor da Causa (R$)</Label>
              <Input
                id="valor_causa"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor_causa}
                onChange={(e) => setFormData({ ...formData, valor_causa: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo_proximo">Próximo Prazo</Label>
              <Input
                id="prazo_proximo"
                type="date"
                value={formData.prazo_proximo}
                onChange={(e) => setFormData({ ...formData, prazo_proximo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumo">Resumo do Caso</Label>
            <Textarea
              id="resumo"
              placeholder="Breve descrição do caso..."
              rows={4}
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Caso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}