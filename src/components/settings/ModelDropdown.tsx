import React, { useEffect } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { Select } from '@/components/ui/Select';

export const ModelDropdown: React.FC = () => {
  const { models, currentModel, setModel, loadModels } = useModelStore();

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
  }, [models.length, loadModels]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = models.find(m => m.id === e.target.value);
    if (selectedModel) {
      setModel(selectedModel);
    }
  };

  return (
    <Select
      value={currentModel?.id || ''}
      onChange={handleModelChange}
      className="min-w-[180px]"
    >
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </Select>
  );
};
