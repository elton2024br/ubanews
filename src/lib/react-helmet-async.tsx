import React from 'react';

export const HelmetProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Helmet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default { HelmetProvider, Helmet };
