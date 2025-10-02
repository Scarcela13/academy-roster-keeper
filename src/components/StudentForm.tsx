import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const studentSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  matricula: z.string().min(1, "Matrícula é obrigatória").max(50),
  email: z.string().email("Email inválido").max(255),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  curso: z.string().min(3, "Curso deve ter no mínimo 3 caracteres").max(100),
  status: z.enum(["Ativo", "Trancado", "Formado"]),
});

interface Student {
  id: string;
  nome: string;
  matricula: string;
  email: string;
  data_nascimento: string;
  curso: string;
  status: string;
}

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSuccess: () => void;
}

const StudentForm = ({ open, onOpenChange, student, onSuccess }: StudentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    matricula: "",
    email: "",
    data_nascimento: "",
    curso: "",
    status: "Ativo",
  });

  useEffect(() => {
    if (student) {
      setFormData({
        nome: student.nome,
        matricula: student.matricula,
        email: student.email,
        data_nascimento: student.data_nascimento,
        curso: student.curso,
        status: student.status,
      });
    } else {
      setFormData({
        nome: "",
        matricula: "",
        email: "",
        data_nascimento: "",
        curso: "",
        status: "Ativo",
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      studentSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      if (student) {
        const { error } = await supabase
          .from("alunos")
          .update(formData)
          .eq("id", student.id);

        if (error) {
          if (error.message.includes('row-level security')) {
            toast({
              title: "Erro ao atualizar aluno",
              description: "Você não tem permissão para atualizar alunos. Entre em contato com um administrador.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Aluno atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert([{ ...formData, created_by: user.id }]);

        if (error) {
          if (error.message.includes('row-level security')) {
            toast({
              title: "Erro ao cadastrar aluno",
              description: "Você não tem permissão para adicionar alunos. Entre em contato com um administrador.",
              variant: "destructive",
            });
            return;
          }
          if (error.message.includes("duplicate key")) {
            toast({
              title: "Erro ao cadastrar aluno",
              description: "Matrícula já cadastrada",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Aluno cadastrado com sucesso",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {student ? "Editar Aluno" : "Adicionar Novo Aluno"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do aluno abaixo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="João da Silva"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                placeholder="2024001"
                required
                disabled={!!student}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="curso">Curso</Label>
              <Input
                id="curso"
                value={formData.curso}
                onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                placeholder="Engenharia de Software"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Trancado">Trancado</SelectItem>
                  <SelectItem value="Formado">Formado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentForm;