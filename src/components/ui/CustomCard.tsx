import React from 'react';

export interface CustomCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  footer?: React.ReactNode;
}

const CustomCard: React.FC<CustomCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  onClick,
  footer,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
    </div>
  );
};

export default CustomCard;

