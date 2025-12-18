import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorClasses = {
  blue: {
    bg: "from-blue-500 to-blue-600",
    light: "bg-blue-100",
    text: "text-blue-600"
  },
  red: {
    bg: "from-red-500 to-red-600",
    light: "bg-red-100",
    text: "text-red-600"
  },
  green: {
    bg: "from-green-500 to-green-600",
    light: "bg-green-100",
    text: "text-green-600"
  },
  amber: {
    bg: "from-amber-500 to-amber-600",
    light: "bg-amber-100",
    text: "text-amber-600"
  },
  purple: {
    bg: "from-purple-500 to-purple-600",
    light: "bg-purple-100",
    text: "text-purple-600"
  }
};

export default function StatsCard({ title, value, icon: Icon, trend, color = "blue" }) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.bg} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
        <CardHeader className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              {trend && (
                <p className={`text-xs ${colors.text} font-medium`}>{trend}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colors.light}`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}