
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

function IndustryCard({ icon: Icon, name, description, benefits }) {
  return (
    <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-secondary/10 rounded-xl">
          <Icon className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="text-2xl font-semibold">{name}</h3>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>
      {benefits && benefits.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/80 mb-3">Key benefits:</p>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default IndustryCard;
