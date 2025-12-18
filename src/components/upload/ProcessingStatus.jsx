import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileSearch, Brain, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProcessingStatus() {
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: FileSearch, label: "Extraindo texto (OCR)", color: "text-blue-600" },
    { icon: Brain, label: "Analisando com IA", color: "text-purple-600" },
    { icon: CheckCircle2, label: "Gerando resumo executivo", color: "text-green-600" },
    { icon: CheckCircle2, label: "Finalizando análise", color: "text-emerald-600" }
  ];

  return (
    <Card className="shadow-lg border-blue-200">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Processando Documento
          </h3>
          <p className="text-slate-600">
            Nossa IA está analisando o documento enviado...
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isActive ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isComplete ? 'text-green-600' : isActive ? step.color : 'text-slate-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isComplete || isActive ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {isComplete && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {isActive && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}