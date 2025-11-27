import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-500">This page is under construction.</p>
    </div>
  );
};

export default PlaceholderPage;
