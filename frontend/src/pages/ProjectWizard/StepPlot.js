import React from 'react';

export default function StepPlot({ formData, updateFormData }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Plot Description</label>
      <textarea
        rows={6}
        value={formData.plot}
        onChange={(e) => updateFormData('plot', e.target.value)}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
        placeholder="Describe your story. What happens? Who are the main characters? What's the conflict?"
      />
    </div>
  );
}
