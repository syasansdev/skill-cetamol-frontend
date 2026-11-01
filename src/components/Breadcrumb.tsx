import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="breadcrumb-container">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {item.link && !isLast ? (
              <Link to={item.link} className="breadcrumb-item">
                {item.label}
              </Link>
            ) : (
              <span className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight size={14} className="breadcrumb-separator" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
