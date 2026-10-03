import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { getConstituencyData, getRiskColor, getRiskLevel } from '../../data/riskData';
import RiskLegend from './RiskLegend';
import ConstituencyPanel from './ConstituencyPanel';

const RiskMap = ({ searchTerm, filterState, filterRisk, setStatesList }) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [hoveredRiskLevel, setHoveredRiskLevel] = useState(null);
  
  const mapRef = useRef();
  const geoJsonRef = useRef();
  const styleFeatureRef = useRef();

  useEffect(() => {
    // Fetch the GeoJSON data
    fetch("/data/india_constituencies_simplified.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        // Extract unique states for the filter
        const states = new Set();
        data.features.forEach((feature) => {
          if (feature.properties.st_name)
            states.add(feature.properties.st_name);
        });
        if (setStatesList) {
          setStatesList(Array.from(states).sort());
        }
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, [setStatesList]);

  const styleFeature = (feature) => {
    const pcId = feature.properties.pc_id; // Unique identifier
    const data = getConstituencyData(pcId);
    const score = data ? data.risk_score : null;
    const rLevel = data ? getRiskLevel(score) : 'No Data';
    const color = getRiskColor(score);
    
    // Check if feature should be dimmed due to filters or hover
    let isDimmed = false;
    
    if (filterState && feature.properties.st_name !== filterState) {
        isDimmed = true;
    }
    
    if (filterRisk && filterRisk !== rLevel && filterRisk !== 'ALL') {
        isDimmed = true;
    }

    if (hoveredRiskLevel && rLevel !== hoveredRiskLevel) {
        isDimmed = true;
    }

    if (searchTerm) {
        const pcName = (feature.properties.pc_name || '').toLowerCase();
        if (!pcName.includes(searchTerm.toLowerCase())) {
            isDimmed = true;
        }
    }

    // Set custom class for animations (random delay for staggered load, pulse for critical)
    const animDelay = Math.random() * 0.8;
    let baseClass = '';
    if (!isDimmed) {
      baseClass = rLevel === 'CRITICAL' ? 'map-path-critical' : 'map-path-load';
    }

    return {
      fillColor: color,
      weight: 0.5,
      opacity: isDimmed ? 0.2 : 1,
      color: 'white',
      fillOpacity: isDimmed ? 0.2 : 0.9,
      className: `${baseClass} ${pcId}`, // Use pcId in class just in case
      style: { animationDelay: `${animDelay}s` }
    };
  };

  styleFeatureRef.current = styleFeature;

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
        const intendedStyle = styleFeatureRef.current(feature);
        
        // Respect selection/filter state: don't highlight if it's intentionally hidden
        if (intendedStyle.fillOpacity < 0.5) {
          return;
        }
        
        l.setStyle({
          weight: 2,
          color: '#000',
          fillOpacity: 0.9
        });
        l.bringToFront();
      },
      mouseout: (e) => {
        // Reset style manually using the latest state, avoiding Leaflet's resetStyle 
        // which caches the initial stale closure of styleFeature from mount.
        if (styleFeatureRef.current) {
          e.target.setStyle(styleFeatureRef.current(e.target.feature));
        }
      },
      click: (e) => {
        const intendedStyle = styleFeatureRef.current(feature);
        if (intendedStyle.fillOpacity < 0.5) {
          return; // Ignore clicks on intentionally hidden features
        }
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
      geoJsonRef.current.eachLayer((layer) => {
        if (layer.feature && layer._path) {
          const intendedStyle = styleFeatureRef.current(layer.feature);
          const isDimmed = intendedStyle.fillOpacity < 0.5;
          const pcId = layer.feature.properties.pc_id;
          const data = getConstituencyData(pcId);
          const score = data ? data.risk_score : null;
          const rLevel = data ? getRiskLevel(score) : 'No Data';

          // Remove animation classes that override inline styles
          layer._path.classList.remove('map-path-critical', 'map-path-load');

          // Apply inline styles directly
          layer._path.style.opacity = isDimmed ? '0.2' : '1';
          layer._path.style.fillOpacity = isDimmed ? '0.2' : '0.9';
          layer._path.style.strokeOpacity = isDimmed ? '0.2' : '1';
          layer._path.style.fill = intendedStyle.fillColor;
          layer._path.style.strokeWidth = isDimmed ? '0.5' : '0.5';
          layer._path.style.stroke = 'white';
          layer._path.style.pointerEvents = 'auto';

          // Re-add animation classes only for visible features
          if (!isDimmed) {
            if (rLevel === 'CRITICAL') {
              layer._path.classList.add('map-path-critical');
            }
          }
        }
      });
    }
  }, [filterState, filterRisk, searchTerm, hoveredRiskLevel]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initialZoom = isMobile ? 3.6 : 4.8;
  const initialCenter = isMobile ? [22, 84] : [22.5, 82];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full relative"
    >
      <MapContainer 
          center={initialCenter} // Center of India (shifted for mobile)
          zoom={initialZoom}
          zoomSnap={0.2}
          zoomDelta={0.2}
          style={{ height: '100%', width: '100%', background: 'transparent' }}
          zoomControl={false}
          attributionControl={false}
          preferCanvas={true}
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

        <RiskLegend 
          onHoverLevel={setHoveredRiskLevel} 
        />
        
        {selectedConstituency && (
          <ConstituencyPanel 
            data={selectedConstituency} 
            onClose={() => setSelectedConstituency(null)} 
          />
        )}
    </motion.div>
  );
};

export default RiskMap;
