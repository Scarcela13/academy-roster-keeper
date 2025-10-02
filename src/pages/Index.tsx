import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center space-y-6 p-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6">
          <GraduationCap className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Sistema de Gestão de Alunos
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Gerenciamento completo e eficiente de alunos para instituições de ensino
        </p>
        <div className="pt-4">
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
            <LogIn className="w-5 h-5" />
            Fazer Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
