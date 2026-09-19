import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getConstituencyData, getRiskColor, getRiskLevel } from '../data/riskData';
import RiskLegend from './RiskLegend';
import ConstituencyPanel from './ConstituencyPanel';

const RiskMap = ({ searchTerm, filterState, filterRisk, setStatesList }) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  
  const mapRef = useRef();
  const geoJsonRef = useRef();

  useEffect(() => {
    // Fetch the GeoJSON data
    fetch('/data/india_constituencies.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        // Extract unique states for the filter
        const states = new Set();
        data.features.forEach(feature => {
          if (feature.properties.st_name) states.add(feature.properties.st_name);
        });
        if (setStatesList) {
          setStatesList(Array.from(states).sort());
        }
      })
      .catch(err => console.error("Error loading GeoJSON:", err));
  }, [setStatesList]);

  const styleFeature = (feature) => {
    const pcId = feature.properties.pc_id; // Unique identifier
    const data = getConstituencyData(pcId);
    const score = data ? data.risk_score : null;
    const color = getRiskColor(score);
    
    // Check if feature should be hidden due to filters
    let opacity = 1;
    let fillOpacity = 0.9;
    
    if (filterState && feature.properties.st_name !== filterState) {
        opacity = 0;
        fillOpacity = 0;
    }
    
    if (filterRisk) {
        const rLevel = getRiskLevel(score);
        if (filterRisk !== rLevel && filterRisk !== 'ALL') {
            opacity = 0;
            fillOpacity = 0;
        }
    }

    if (searchTerm) {
        const pcName = (feature.properties.pc_name || '').toLowerCase();
        if (!pcName.includes(searchTerm.toLowerCase())) {
            opacity = 0.1;
            fillOpacity = 0.1;
        }
    }

    return {
      fillColor: color,
      weight: 0.5,
      opacity: opacity,
      color: 'white',
      fillOpacity: fillOpacity
    };
  };

  const onEachFeature = (feature, layer) => {
    const pcId = feature.properties.pc_id;
    const pcName = feature.properties.pc_name;
    const stName = feature.properties.st_name;
    const data = getConstituencyData(pcId);
    
    const score = data ? data.risk_score : 'No Data';
    const level = data ? getRiskLevel(data.risk_score) : 'No Data';

    const getLevelClasses = (lvl) => {
      const base = "inline-block px-1.5 py-0.5 rounded text-[0.7rem] font-bold mt-1";
      switch(lvl) {
        case 'VERY LOW': return `${base} bg-green-100/80 text-green-800`;
        case 'LOW': return `${base} bg-green-200/80 text-green-800`;
        case 'MODERATE': return `${base} bg-yellow-200/80 text-yellow-800`;
        case 'HIGH': return `${base} bg-orange-200/80 text-orange-900`;
        case 'CRITICAL': return `${base} bg-red-200/80 text-red-800`;
        default: return `${base} bg-slate-100/80 text-slate-600`;
      }
    };

    // Tooltip for hover
    layer.bindTooltip(
      `<div class="font-sans">
        <strong class="text-slate-900 text-base">${pcName}</strong><br/>
        <span class="text-xs text-slate-500 font-medium">${stName}</span><br/>
        <div class="mt-1.5 text-slate-700 text-sm">
          Risk Score: <strong class="text-slate-900">${score}</strong><br/>
          Level: <span class="${getLevelClasses(level)}">${level}</span>
        </div>
      </div>`,
      { sticky: true, className: '!bg-white/95 !border-0 !rounded-lg !shadow-md !px-4 !py-3 before:!hidden' }
    );

    // Event handlers
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 2,
          color: '#000',
          fillOpacity: 0.9
        });
        l.bringToFront();
      },
      mouseout: (e) => {
        // Reset style using the GeoJSON instance
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: (e) => {
        const map = mapRef.current;
        if (map) {
          map.fitBounds(e.target.getBounds(), { padding: [50, 50] });
        }
        // If data exists, show it, otherwise show basic feature info
        setSelectedConstituency(data || {
            pc_id: pcId,
            pc_name: pcName,
            st_name: stName
        });
      }
    });
  };

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle(styleFeature);
    }
  }, [filterState, filterRisk, searchTerm]);

  return (
    <>
      <MapContainer 
          center={[23, 82]} // Center of India
          zoom={4.6}
          zoomSnap={0.2}
          zoomDelta={0.2}
          style={{ height: '100%', width: '100%', background: 'transparent' }}
          zoomControl={false}
          attributionControl={false}
          ref={mapRef}
        >
          <ZoomControl position="bottomleft" />
          
          {geoData && (
            <GeoJSON 
              data={geoData} 
              style={styleFeature} 
              onEachFeature={onEachFeature}
              ref={geoJsonRef}
            />
          )}
        </MapContainer>

        <RiskLegend />
        
        {selectedConstituency && (
          <ConstituencyPanel 
            data={selectedConstituency} 
            onClose={() => setSelectedConstituency(null)} 
          />
        )}
    </>
  );
};

export default RiskMap;
