import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  );
};

export default LoadingSpinner;
