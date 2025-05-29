import React, { useState, useCallback, useRef } from 'react';
import { Plus, Save, Upload, Download, Play, Trash2, Edit3, Copy, Eye, BarChart3, Leaf, Settings, ChevronDown, ChevronRight } from 'lucide-react';

// Mock data for process steps library
const PROCESS_STEPS_LIBRARY = {
  'Deposition': [
    { id: 'cvd_oxide', name: 'CVD Oxide', duration: 120, power: 2500, chemicals: ['TEOS', 'O2'], temperature: 400, envImpact: 'medium' },
    { id: 'pvd_metal', name: 'PVD Metal', duration: 90, power: 3000, chemicals: ['Ar', 'Ti'], temperature: 25, envImpact: 'low' },
    { id: 'ald_hfO2', name: 'ALD HfO2', duration: 180, power: 1500, chemicals: ['TDMAH', 'H2O'], temperature: 300, envImpact: 'high' }
  ],
  'Etching': [
    { id: 'dry_etch_oxide', name: 'Dry Etch Oxide', duration: 60, power: 2000, chemicals: ['CF4', 'CHF3'], temperature: 25, envImpact: 'medium' },
    { id: 'wet_etch_metal', name: 'Wet Etch Metal', duration: 30, power: 0, chemicals: ['H2SO4', 'H2O2'], temperature: 80, envImpact: 'high' }
  ],
  'Lithography': [
    { id: 'photoresist_coat', name: 'Photoresist Coating', duration: 45, power: 500, chemicals: ['Photoresist', 'PGMEA'], temperature: 25, envImpact: 'low' },
    { id: 'euv_exposure', name: 'EUV Exposure', duration: 180, power: 5000, chemicals: [], temperature: 25, envImpact: 'very_high' }
  ],
  'Cleaning': [
    { id: 'rca_clean', name: 'RCA Clean', duration: 20, power: 100, chemicals: ['NH4OH', 'H2O2', 'HCl'], temperature: 70, envImpact: 'medium' },
    { id: 'megasonic_clean', name: 'Megasonic Clean', duration: 15, power: 800, chemicals: ['DI Water'], temperature: 25, envImpact: 'low' }
  ]
};

const ENVIRONMENTAL_IMPACT_COLORS = {
  'low': 'bg-green-100 text-green-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'very_high': 'bg-red-100 text-red-800'
};

const ProcessFlowEditor = () => {
  const [flows, setFlows] = useState([]);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showImpactPanel, setShowImpactPanel] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const fileInputRef = useRef(null);

  // Create new flow
  const createNewFlow = () => {
    const newFlow = {
      id: Date.now(),
      name: `Process Flow ${flows.length + 1}`,
      description: '',
      steps: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    setFlows([...flows, newFlow]);
    setCurrentFlow(newFlow);
    setSelectedSteps([]);
  };

  // Add step to current flow
  const addStepToFlow = (step) => {
    if (!currentFlow) return;

    const newStep = {
      ...step,
      id: `${step.id}_${Date.now()}`,
      stepIndex: selectedSteps.length
    };

    const updatedSteps = [...selectedSteps, newStep];
    setSelectedSteps(updatedSteps);

    const updatedFlow = {
      ...currentFlow,
      steps: updatedSteps,
      modifiedAt: new Date().toISOString()
    };

    setCurrentFlow(updatedFlow);
    setFlows(flows.map(f => f.id === currentFlow.id ? updatedFlow : f));
  };

  // Remove step from flow
  const removeStep = (stepIndex) => {
    const updatedSteps = selectedSteps.filter((_, index) => index !== stepIndex);
    setSelectedSteps(updatedSteps);

    if (currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        steps: updatedSteps,
        modifiedAt: new Date().toISOString()
      };
      setCurrentFlow(updatedFlow);
      setFlows(flows.map(f => f.id === currentFlow.id ? updatedFlow : f));
    }
  };

  // Calculate environmental impact
  const calculateEnvironmentalImpact = () => {
    if (!selectedSteps.length) return { totalEnergy: 0, totalTime: 0, chemicals: [], riskLevel: 'low' };

    const totalEnergy = selectedSteps.reduce((sum, step) => sum + (step.power * step.duration / 60), 0);
    const totalTime = selectedSteps.reduce((sum, step) => sum + step.duration, 0);
    const chemicals = [...new Set(selectedSteps.flatMap(step => step.chemicals))];

    const highImpactSteps = selectedSteps.filter(step => ['high', 'very_high'].includes(step.envImpact)).length;
    const riskLevel = highImpactSteps > 2 ? 'very_high' :
      highImpactSteps > 0 ? 'high' :
        selectedSteps.length > 5 ? 'medium' : 'low';

    return { totalEnergy: totalEnergy.toFixed(1), totalTime, chemicals, riskLevel };
  };

  // Save flow
  const saveFlow = () => {
    if (!currentFlow) return;

    const flowName = prompt('Enter flow name:', currentFlow.name);
    if (!flowName) return;

    const updatedFlow = {
      ...currentFlow,
      name: flowName,
      modifiedAt: new Date().toISOString()
    };

    setCurrentFlow(updatedFlow);
    setFlows(flows.map(f => f.id === currentFlow.id ? updatedFlow : f));
  };

  // Export flow
  const exportFlow = () => {
    if (!currentFlow) return;

    const dataStr = JSON.stringify(currentFlow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentFlow.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  // Import flow
  const importFlow = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedFlow = JSON.parse(e.target.result);
        importedFlow.id = Date.now();
        importedFlow.modifiedAt = new Date().toISOString();

        setFlows([...flows, importedFlow]);
        setCurrentFlow(importedFlow);
        setSelectedSteps(importedFlow.steps || []);
      } catch (error) {
        alert('Error importing flow: Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const impact = calculateEnvironmentalImpact();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Leaf className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Process Flow Editor</h1>
                <p className="text-sm text-gray-600">Design sustainable semiconductor manufacturing processes</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={createNewFlow}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Flow</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>

              {currentFlow && (
                <>
                  <button
                    onClick={saveFlow}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={exportFlow}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Process Steps Library */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Steps Library</h3>

              {Object.entries(PROCESS_STEPS_LIBRARY).map(([category, steps]) => (
                <div key={category} className="mb-4">
                  <button
                    onClick={() => setExpandedCategories(prev => ({
                      ...prev,
                      [category]: !prev[category]
                    }))}
                    className="flex items-center justify-between w-full text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700">{category}</span>
                    {expandedCategories[category] ?
                      <ChevronDown className="w-4 h-4" /> :
                      <ChevronRight className="w-4 h-4" />
                    }
                  </button>

                  {expandedCategories[category] && (
                    <div className="mt-2 space-y-2">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                          onClick={() => addStepToFlow(step)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{step.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${ENVIRONMENTAL_IMPACT_COLORS[step.envImpact]}`}>
                              {step.envImpact.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {step.duration}min • {step.power}W • {step.temperature}°C
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {currentFlow ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{currentFlow.name}</h2>
                      <p className="text-sm text-gray-600">
                        {selectedSteps.length} steps • Modified {new Date(currentFlow.modifiedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowImpactPanel(!showImpactPanel)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Impact Analysis</span>
                    </button>
                  </div>

                  {/* Process Flow Steps */}
                  <div className="space-y-3">
                    {selectedSteps.map((step, index) => (
                      <div
                        key={`${step.id}_${index}`}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>

                        <div className="flex-1 ml-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{step.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${ENVIRONMENTAL_IMPACT_COLORS[step.envImpact]}`}>
                              {step.envImpact.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Duration: {step.duration}min</span>
                            <span>Power: {step.power}W</span>
                            <span>Temp: {step.temperature}°C</span>
                          </div>

                          {step.chemicals.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              Chemicals: {step.chemicals.join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingStep(step)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addStepToFlow(step)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeStep(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedSteps.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Play className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No process steps added yet</p>
                        <p className="text-sm">Select steps from the library to build your process flow</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No process flow selected</p>
                  <p className="text-sm">Create a new flow or select an existing one to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Environmental Impact Panel */}
          <div className="lg:col-span-1">
            {showImpactPanel && currentFlow && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Leaf className="w-5 h-5 text-green-600 mr-2" />
                  Environmental Impact
                </h3>

                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Energy Consumption</div>
                    <div className="text-xl font-semibold text-gray-900">{impact.totalEnergy} kWh</div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Process Time</div>
                    <div className="text-xl font-semibold text-gray-900">{impact.totalTime} min</div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Risk Level</div>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${ENVIRONMENTAL_IMPACT_COLORS[impact.riskLevel]}`}>
                      {impact.riskLevel.replace('_', ' ')}
                    </span>
                  </div>

                  {impact.chemicals.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Chemicals Used</div>
                      <div className="flex flex-wrap gap-1">
                        {impact.chemicals.map((chemical, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {chemical}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Saved Flows */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Flows</h3>

              {flows.length > 0 ? (
                <div className="space-y-2">
                  {flows.map((flow) => (
                    <div
                      key={flow.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${currentFlow?.id === flow.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => {
                        setCurrentFlow(flow);
                        setSelectedSteps(flow.steps || []);
                      }}
                    >
                      <div className="font-medium text-gray-900">{flow.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {flow.steps?.length || 0} steps • {new Date(flow.modifiedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No saved flows yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importFlow}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProcessFlowEditor;
