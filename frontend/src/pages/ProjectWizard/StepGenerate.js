import React from 'react';

export default function StepGenerate({ onStartGeneration }) {
  return (
    <div className="text-center">
      <h3 className="text-lg font-medium mb-4">Ready to Generate?</h3>
      <p className="text-gray-600 mb-6">
        This will start generating images, video clips, and audio for your project.
        This process may take some time depending on the number of scenes.
      </p>
      <button
        onClick={onStartGeneration}
        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Start Generation
      </button>
    </div>
  );
}
