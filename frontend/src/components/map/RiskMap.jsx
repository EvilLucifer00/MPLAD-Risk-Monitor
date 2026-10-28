import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, GeoJSON, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
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
  const selectedConstituencyRef = useRef(selectedConstituency);
  const filtersRef = useRef({ filterState, filterRisk, searchTerm, hoveredRiskLevel });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initialZoom = isMobile ? 3.6 : 4.8;
  const initialCenter = useMemo(() => (isMobile ? [22, 84] : [22.5, 82]), [isMobile]);

  useEffect(() => {
    selectedConstituencyRef.current = selectedConstituency;
  }, [selectedConstituency]);

  useEffect(() => {
    filtersRef.current = { filterState, filterRisk, searchTerm, hoveredRiskLevel };
  }, [filterState, filterRisk, searchTerm, hoveredRiskLevel]);

  useEffect(() => {
    // Singleton cached GeoJSON fetch - prevents duplicate downloads during re-renders/StrictMode
    if (!window.__GEOJSON_PROMISE__) {
      window.__GEOJSON_PROMISE__ = fetch("/data/india_constituencies_simplified.geojson")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load map boundaries");
          return res.json();
        })
        .catch((err) => {
          window.__GEOJSON_PROMISE__ = null; // allow retry
          throw err;
        });
    }

    let isMounted = true;
    window.__GEOJSON_PROMISE__
      .then((data) => {
        if (!isMounted) return;
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
      .catch(() => {
        // Handled silently
      });

    return () => {
      isMounted = false;
    };
  }, [setStatesList]);

  // Handler to smoothly return map to initial position and clear selection
  const handleClosePanel = useCallback(() => {
    setSelectedConstituency(null);
    const map = mapRef.current;
    if (map) {
      map.flyTo(initialCenter, initialZoom, {
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
  }, [initialCenter, initialZoom]);

  // Close panel and reset map if Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedConstituencyRef.current) {
        handleClosePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClosePanel]);

  // Reset map when clicking on the empty background of the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMapClick = () => {
      if (selectedConstituencyRef.current) {
        handleClosePanel();
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [handleClosePanel]);

  const styleFeature = (feature) => {
    const pcId = feature.properties.pc_id; // Unique identifier
    const data = getConstituencyData(pcId);
    const score = data ? data.risk_score : null;
    const rLevel = data ? getRiskLevel(score) : 'No Data';
    const color = getRiskColor(score);
    
    // Check if feature is excluded by filter criteria
    let isFilterExcluded = false;
    
    if (filterState && feature.properties.st_name !== filterState) {
      isFilterExcluded = true;
    }
    
    if (filterRisk && filterRisk !== rLevel && filterRisk !== 'ALL') {
      isFilterExcluded = true;
    }

    if (hoveredRiskLevel && rLevel !== hoveredRiskLevel) {
      isFilterExcluded = true;
    }

    if (searchTerm) {
      const pcName = (feature.properties.pc_name || '').toLowerCase();
      if (!pcName.includes(searchTerm.toLowerCase())) {
        isFilterExcluded = true;
      }
    }

    // Selection dimming: when a constituency is selected, all others are dimmed
    const isSelected = selectedConstituency && selectedConstituency.pc_id === pcId;
    const isSelectionDimmed = Boolean(selectedConstituency && !isSelected);
    const isDimmed = isFilterExcluded || isSelectionDimmed;

    // Set custom class for animations (random delay for staggered load, pulse for critical)
    const animDelay = Math.random() * 0.8;
    let baseClass = '';
    if (!isDimmed && !isSelected) {
      baseClass = rLevel === 'CRITICAL' ? 'map-path-critical' : 'map-path-load';
    }

    if (isSelected) {
      return {
        fillColor: color,
        weight: 2.5,
        opacity: 1,
        color: '#0f172a',
        fillOpacity: 1,
        className: `${baseClass} ${pcId} map-feature-selected`,
        style: { animationDelay: `${animDelay}s` }
      };
    }

    return {
      fillColor: color,
      weight: 0.5,
      opacity: isDimmed ? 0.2 : 1,
      color: 'white',
      fillOpacity: isDimmed ? 0.15 : 0.9,
      className: `${baseClass} ${pcId}`,
      style: { animationDelay: `${animDelay}s` }
    };
  };

  useEffect(() => {
    styleFeatureRef.current = styleFeature;
  });

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
        const currentFilters = filtersRef.current;
        const currentSelected = selectedConstituencyRef.current;
        const currentData = getConstituencyData(pcId);
        const currentLevel = currentData ? getRiskLevel(currentData.risk_score) : 'No Data';

        // Check if feature is excluded by search/filters
        let isFilterExcluded = false;
        if (currentFilters.filterState && feature.properties.st_name !== currentFilters.filterState) isFilterExcluded = true;
        if (currentFilters.filterRisk && currentFilters.filterRisk !== currentLevel && currentFilters.filterRisk !== 'ALL') isFilterExcluded = true;
        if (currentFilters.searchTerm) {
          const name = (feature.properties.pc_name || '').toLowerCase();
          if (!name.includes(currentFilters.searchTerm.toLowerCase())) isFilterExcluded = true;
        }
        if (isFilterExcluded) return;

        // If this is the currently selected constituency, keep its prominent style
        if (currentSelected && currentSelected.pc_id === pcId) {
          return;
        }

        l.setStyle({
          weight: 2,
          color: '#334155',
          fillOpacity: 0.9,
          opacity: 1
        });
        l.bringToFront();
      },
      mouseout: (e) => {
        if (styleFeatureRef.current) {
          e.target.setStyle(styleFeatureRef.current(e.target.feature));
        }
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);

        const currentFilters = filtersRef.current;
        const currentData = getConstituencyData(pcId);
        const currentLevel = currentData ? getRiskLevel(currentData.risk_score) : 'No Data';

        // Ignore clicks on features excluded by current filters
        let isFilterExcluded = false;
        if (currentFilters.filterState && feature.properties.st_name !== currentFilters.filterState) isFilterExcluded = true;
        if (currentFilters.filterRisk && currentFilters.filterRisk !== currentLevel && currentFilters.filterRisk !== 'ALL') isFilterExcluded = true;
        if (currentFilters.searchTerm) {
          const name = (feature.properties.pc_name || '').toLowerCase();
          if (!name.includes(currentFilters.searchTerm.toLowerCase())) isFilterExcluded = true;
        }
        if (isFilterExcluded) return;

        // Zoom smoothly into the selected constituency
        const map = mapRef.current;
        if (map) {
          const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
          // Offset padding on desktop so details panel on the right doesn't obscure the constituency
          const flyOptions = isMobileView
            ? { padding: [40, 40], maxZoom: 8, duration: 0.8 }
            : { paddingTopLeft: [40, 40], paddingBottomRight: [360, 40], maxZoom: 8.5, duration: 0.8 };
          map.flyToBounds(e.target.getBounds(), flyOptions);
        }

        // Set or switch selected constituency
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
        if (layer.feature) {
          const intendedStyle = styleFeatureRef.current(layer.feature);
          const isSelected = selectedConstituency && selectedConstituency.pc_id === layer.feature.properties.pc_id;
          const isDimmed = intendedStyle.fillOpacity < 0.5;
          const pcId = layer.feature.properties.pc_id;
          const data = getConstituencyData(pcId);
          const score = data ? data.risk_score : null;
          const rLevel = data ? getRiskLevel(score) : 'No Data';

          // Apply Leaflet native vector style
          layer.setStyle(intendedStyle);

          if (isSelected) {
            layer.bringToFront();
          }

          // Direct SVG attribute updates if layer._path exists (for smooth CSS transitions)
          if (layer._path) {
            layer._path.classList.remove('map-path-critical', 'map-path-load', 'map-path-selected');

            layer._path.style.opacity = isSelected ? '1' : (isDimmed ? '0.2' : '1');
            layer._path.style.fillOpacity = isSelected ? '1' : (isDimmed ? '0.15' : '0.9');
            layer._path.style.strokeOpacity = isSelected ? '1' : (isDimmed ? '0.2' : '1');
            layer._path.style.fill = intendedStyle.fillColor;
            layer._path.style.strokeWidth = isSelected ? '2.5' : '0.5';
            layer._path.style.stroke = isSelected ? '#0f172a' : 'white';
            layer._path.style.pointerEvents = 'auto';

            if (!isDimmed && !isSelected && rLevel === 'CRITICAL') {
              layer._path.classList.add('map-path-critical');
            }
          }
        }
      });
    }
  }, [filterState, filterRisk, searchTerm, hoveredRiskLevel, selectedConstituency]);

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
          hoveredRiskLevel={hoveredRiskLevel}
        />
        
        {selectedConstituency && (
          <ConstituencyPanel 
            data={selectedConstituency} 
            onClose={handleClosePanel} 
          />
        )}
    </motion.div>
  );
};

export default RiskMap;
