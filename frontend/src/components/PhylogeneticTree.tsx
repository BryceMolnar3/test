import React, { useRef, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  attributes?: Record<string, any>;
}

interface PhylogeneticTreeProps {
  data: TreeNode;
  width?: string;
  height?: string;
}

function PhylogeneticTree({ data, width = '100%', height = '600px' }: PhylogeneticTreeProps) {
  const { settings } = useDisplaySettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  // Theme-based colors
  const textColor = settings.theme === 'dark' ? '#E2E8F0' : '#1A202C';
  const mutedTextColor = settings.theme === 'dark' ? '#A0AEC0' : '#4A5568';
  const nodeColor = settings.theme === 'dark' ? '#4299E1' : '#3182CE';
  const buttonBg = settings.theme === 'dark' ? '#2D3748' : '#EDF2F7';
  const buttonHoverBg = settings.theme === 'dark' ? '#4A5568' : '#E2E8F0';

  useEffect(function() {
    function updateDimensions() {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setTranslate({ x: width / 2, y: height / 7 });
      }
    }

    // Initial position
    updateDimensions();

    // Handle window resize
    window.addEventListener('resize', updateDimensions);

    // Ensure position is set after a short delay to handle any layout adjustments
    const timeoutId = setTimeout(updateDimensions, 100);

    return function cleanup() {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, []);

  function handleZoomIn() {
    setZoom(function(prevZoom) {
      return Math.min(prevZoom * 1.2, 3);
    });
  }

  function handleZoomOut() {
    setZoom(function(prevZoom) {
      return Math.max(prevZoom / 1.2, 0.3);
    });
  }

  function handleZoomReset() {
    setZoom(1);
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: height / 7 });
    }
  }

  function handleMouseOver(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = buttonHoverBg;
  }

  function handleMouseOut(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = buttonBg;
  }

  function renderCustomNode(rd3tProps: any) {
    return (
      <g>
        <circle r={6} fill={nodeColor} />
        <foreignObject
          x={10}
          y={-25}
          width={230}
          height={80}
          style={{
            overflow: 'visible'
          }}
        >
          <div style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: settings.fontSize === 'small' ? '12px' : 
                     settings.fontSize === 'large' ? '16px' : '14px',
            color: textColor,
            whiteSpace: 'nowrap',
            marginBottom: '4px'
          }}>
            {rd3tProps.nodeDatum.name}
          </div>
          {rd3tProps.nodeDatum.attributes && rd3tProps.nodeDatum.attributes.image ? (
            <img
              src={rd3tProps.nodeDatum.attributes.image}
              alt="Phylogenetic Tree"
              style={{ maxWidth: 220, maxHeight: 400, display: 'block', margin: '0 auto' }}
            />
          ) : rd3tProps.nodeDatum.attributes ? (
            <div style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: settings.fontSize === 'small' ? '10px' : 
                       settings.fontSize === 'large' ? '14px' : '12px',
              color: mutedTextColor,
              whiteSpace: 'nowrap'
            }}>
              {Object.entries(rd3tProps.nodeDatum.attributes)
                .map(function([key, value]) { return `${key}: ${value}`; })
                .join(', ')}
            </div>
          ) : null}
        </foreignObject>
      </g>
    );
  }

  function getPathClass() {
    return settings.theme === 'dark' ? 'path-dark' : 'path-light';
  }

  function handleTreeUpdate(state: any) {
    setZoom(state.zoom);
    setTranslate(state.translate);
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width, 
        height,
        border: '1px solid',
        borderColor: settings.theme === 'dark' ? '#2D3748' : '#E2E8F0',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Tree
        data={data}
        orientation="vertical"
        pathFunc="step"
        collapsible={true}
        separation={{ siblings: 2, nonSiblings: 3 }}
        nodeSize={{ x: 250, y: 120 }}
        translate={translate}
        zoom={zoom}
        onUpdate={handleTreeUpdate}
        renderCustomNodeElement={renderCustomNode}
        pathClassFunc={getPathClass}
      />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '8px',
        background: settings.theme === 'dark' ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            background: buttonBg,
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            color: textColor,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: buttonBg,
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            color: textColor,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          -
        </button>
        <button
          onClick={handleZoomReset}
          style={{
            background: buttonBg,
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            color: textColor,
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontSize: '12px'
          }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          Reset
        </button>
      </div>
      <style>
        {`
          .path-light {
            stroke: #A0AEC0;
            stroke-width: 1.5px;
          }
          .path-dark {
            stroke: #718096;
            stroke-width: 1.5px;
          }
        `}
      </style>
    </div>
  );
}

export default PhylogeneticTree; 