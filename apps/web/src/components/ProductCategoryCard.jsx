
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ProductCategoryCard({ icon: Icon, name, description, onClick, variant = 'default' }) {
  const variants = {
    default: 'bg-card border shadow-sm hover:shadow-md',
    muted: 'bg-muted border-0',
    elevated: 'bg-card shadow-lg hover:shadow-xl border-0',
  };

  return (
    <div
      className={`${variants[variant]} rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 cursor-pointer group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default ProductCategoryCard;
