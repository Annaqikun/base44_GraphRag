import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const colorClasses = {
  blue: {
    bg: "from-blue-500 to-blue-600",
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    bgDark: "bg-blue-900/30"
  },
  purple: {
    bg: "from-purple-500 to-purple-600", 
    text: "text-purple-600",
    bgLight: "bg-purple-50",
    bgDark: "bg-purple-900/30"
  },
  emerald: {
    bg: "from-emerald-500 to-emerald-600",
    text: "text-emerald-600", 
    bgLight: "bg-emerald-50",
    bgDark: "bg-emerald-900/30"
  },
  amber: {
    bg: "from-amber-500 to-amber-600",
    text: "text-amber-600",
    bgLight: "bg-amber-50",
    bgDark: "bg-amber-900/30"
  }
};

export default function StatsCard({ title, value, icon: Icon, trend, color, darkMode = false }) {
  const colorClass = colorClasses[color] || colorClasses.blue;
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden ${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300`}>
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorClass.bg} opacity-10 rounded-full transform translate-x-6 -translate-y-6`} />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {title}
              </p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {trend && (
                  <div className="flex items-center gap-1 text-sm text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium">{trend}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-3 rounded-xl ${darkMode ? colorClass.bgDark : colorClass.bgLight} ${colorClass.text}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}