import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditarUsuarioModal({ open, onClose, usuario }) {
  const [formData, setFormData] = useState({
    full_name: "",
    cargo: "advogado_junior",
    oab_numero: "",
    oab_uf: "",
    telefone: ""
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (usuario) {
      setFormData({
        full_name: usuario.full_name || "",
        cargo: usuario.cargo || "advogado_junior",
        oab_numero: usuario.oab_numero || "",
        oab_uf: usuario.oab_uf || "",
        telefone: usuario.telefone || ""
      });
    }
  }, [usuario]);

  const updateUserMutation = useMutation({
    mutationFn: () => base44.entities.User.update(usuario.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="advogado_senior">Advogado Sênior</SelectItem>
                <SelectItem value="advogado_junior">Advogado Júnior</SelectItem>
                <SelectItem value="estagiario">Estagiário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="oab_numero">Número da OAB</Label>
              <Input
                id="oab_numero"
                value={formData.oab_numero}
                onChange={(e) => setFormData({ ...formData, oab_numero: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oab_uf">UF</Label>
              <Input
                id="oab_uf"
                maxLength={2}
                value={formData.oab_uf}
                onChange={(e) => setFormData({ ...formData, oab_uf: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-900 hover:bg-blue-800"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}