import React, { useState, Suspense, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Points, PointMaterial, Environment } from '@react-three/drei';
import {
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  FileText,
  Bot,
  User,
  Cpu,
  Search,
  SortDesc,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  Layers,
  Brain,
  ClipboardList,
  DollarSign,
  CheckSquare,
  FileEdit,
  Sparkles,
  Copy,
  RotateCcw
} from 'lucide-react';

/* ── Processing step config ───────────────────────────────────────────────── */
const STEP_CONFIG = {
  analyzing_query:        { label: 'Analyzing query',     icon: Brain },
  query_analysis:         { label: 'Understanding intent', icon: Brain },
  memory_retrieval:       { label: 'Checking memory',     icon: Cpu },
  hybrid_retrieval:       { label: 'Searching documents', icon: Search },
  reranking:              { label: 'Reranking results',   icon: SortDesc },
  retrieval_quality_check:{ label: 'Evaluating relevance',icon: ShieldCheck },
  query_rewrite:          { label: 'Refining search',     icon: RefreshCw },
  generate_answer:        { label: 'Generating answer',   icon: MessageSquare },
  grounding_check:        { label: 'Verifying answer',    icon: ShieldCheck },
  retrieve_more:          { label: 'Fetching more context',icon: Layers },
  final_answer:           { label: 'Finalizing response', icon: Sparkles },
  memory_extraction:      { label: 'Updating memory',     icon: Brain },
};

/* ── 3D Shape Component ──────────────────────────────────────────────────── */
function CinematicShape() {
  const groupRef = useRef();
  const ringsRef = useRef();
  const coreRef = useRef();
  const particlesRef = useRef();

  const [particlePositions] = useState(() => {
    const positions = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const radius = 1.8 + Math.random() * 1.2;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 5;
      const targetY = (state.pointer.y * Math.PI) / 5;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.x = t * 0.15;
      ringsRef.current.rotation.y = t * 0.2;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.04;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.06;
      particlesRef.current.rotation.z = t * 0.03;
    }
  });

  return (
    <>
      <Environment preset="city" />
      <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
        <group ref={groupRef} scale={1.2}>
          <Points ref={particlesRef} positions={particlePositions} stride={3}>
            <PointMaterial transparent color="#FFC933" size={0.025} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
          </Points>
          <mesh ref={coreRef}>
            <sphereGeometry args={[0.8, 64, 64]} />
            <MeshDistortMaterial
              color="#FFC933"
              emissive="#FFC933"
              emissiveIntensity={0.3}
              roughness={0}
              metalness={1}
              distort={0.4}
              speed={3}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          </mesh>
          <group ref={ringsRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.3, 0.015, 32, 100]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1} metalness={1} roughness={0} />
            </mesh>
            <mesh rotation={[0, Math.PI / 3, 0]}>
              <torusGeometry args={[1.5, 0.015, 32, 100]} />
              <meshStandardMaterial color="#FFC933" emissive="#FFC933" emissiveIntensity={0.8} metalness={1} roughness={0} />
            </mesh>
            <mesh rotation={[0, -Math.PI / 3, 0]}>
              <torusGeometry args={[1.7, 0.015, 32, 100]} />
              <meshStandardMaterial color="#FFC933" emissive="#FFC933" emissiveIntensity={0.4} metalness={1} roughness={0} />
            </mesh>
          </group>
        </group>
      </Float>
    </>
  );
}

/* ── Single Chat Message ─────────────────────────────────────────────────── */
export function ChatMessage({ msg, onFeedback, onCitationClick, onCopy }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`message ${msg.role}`}
    >
      <div className="message-avatar">
        {isUser ? <User size={20} /> : <Sparkles size={20} />}
      </div>

      <div className="message-body">
        <div className="message-sender-label">
          {isUser ? 'You' : 'Assistant'}
        </div>

        <div className="message-content">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>

        {/* Citations */}
        {!isUser && msg.citations && msg.citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="citations-container"
          >
            <div className="citations-title">
              <BookOpen size={13} />
              Sources
            </div>
            <div>
              {msg.citations.map((c, i) => (
                <span key={i} className="citation-chip" onClick={() => onCitationClick?.(c)}>
                  <FileText size={11} />
                  {c.document_name}
                  {c.page_number && ` · p.${c.page_number}`}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quality badges */}
        {!isUser && (msg.retrieval_quality || msg.grounding_quality) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="quality-badges"
          >
            {msg.retrieval_quality && msg.retrieval_quality !== 'unknown' && (
              <span className={`quality-badge ${msg.retrieval_quality}`}>
                <Search size={11} />
                Retrieval: {msg.retrieval_quality}
              </span>
            )}
            {msg.grounding_quality && msg.grounding_quality !== 'unknown' && (
              <span className={`quality-badge ${msg.grounding_quality === 'good' ? 'grounded' : msg.grounding_quality}`}>
                <ShieldCheck size={11} />
                {msg.grounding_quality === 'good' ? 'Grounded' : `Grounding: ${msg.grounding_quality}`}
              </span>
            )}
          </motion.div>
        )}

        {/* Feedback / Actions buttons */}
        {!isUser && msg.id && msg.content && (
          <div className="message-actions">
            <button className="action-btn" onClick={onCopy} title="Copy Message">
              <Copy size={14} />
            </button>
            <button className="action-btn" onClick={() => {}} title="Regenerate">
              <RotateCcw size={14} />
            </button>
            <button
              className={`action-btn ${msg.feedback === 1 ? 'active-up' : ''}`}
              onClick={() => onFeedback?.(msg.id, 1)}
              title="Helpful"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              className={`action-btn ${msg.feedback === -1 ? 'active-down' : ''}`}
              onClick={() => onFeedback?.(msg.id, -1)}
              title="Not helpful"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Processing Status Indicator ─────────────────────────────────────────── */
export function StatusIndicator({ step }) {
  const config = STEP_CONFIG[step] || { label: step, icon: Cpu };
  const IconComponent = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="status-indicator"
    >
      <div className="status-header">
        <div className="status-icon">
          <IconComponent size={16} />
        </div>
        <div className="status-step-text">
          <motion.span
            key={step}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {config.label}
          </motion.span>
          <span className="typing-cursor"></span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Welcome Screen ──────────────────────────────────────────────────────── */
export function WelcomeScreen({ onSuggestionClick }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const suggestions = [
    {
      Icon: ClipboardList,
      title: 'MPLADS Guidelines',
      text: 'What are the key guidelines of the MPLADS scheme?',
    },
    {
      Icon: DollarSign,
      title: 'Fund Allocation',
      text: 'How much fund is allocated per MP under MPLADS?',
    },
    {
      Icon: CheckSquare,
      title: 'Eligibility',
      text: 'What types of works are eligible under MPLADS?',
    },
    {
      Icon: FileEdit,
      title: 'Application Process',
      text: 'What is the procedure for recommending works under MPLADS?',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div
      className="welcome-screen"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="welcome-hero" variants={itemVariants}>
        {!isMobile && (
          <div className="welcome-3d-container">
            <Suspense fallback={null}>
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <CinematicShape />
              </Canvas>
            </Suspense>
          </div>
        )}

        <div className="welcome-logo" style={{ zIndex: 2, position: 'relative' }}>
          <Layers size={28} color="var(--yellow)" />
        </div>
        <div className="welcome-hero-text" style={{ zIndex: 2, position: 'relative' }}>
          <h2>MPLADS <span>Assistant</span></h2>
        </div>
      </motion.div>

      <motion.p className="welcome-description" variants={itemVariants}>
        Explore the Members of Parliament Local Area Development Scheme with our advanced RAG system. Every response is verified and cited directly from official documents.
      </motion.p>

      <motion.div className="welcome-suggestions" variants={containerVariants}>
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            variants={itemVariants}
            className="suggestion-card"
            onClick={() => onSuggestionClick(s.text)}
          >
            <div className="suggestion-card-header">
              <div className="suggestion-card-icon">
                <s.Icon size={18} />
              </div>
              <h4>{s.title}</h4>
            </div>
            <p>{s.text}</p>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
