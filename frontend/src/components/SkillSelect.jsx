import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Search, Plus, Code } from 'lucide-react';

export const POPULAR_SKILLS = [
  'Adobe XD',
  'Android Dev',
  'Angular',
  'Artificial Intelligence',
  'AWS',
  'Blockchain',
  'Bootstrap',
  'C',
  'C#',
  'C++',
  'CI/CD',
  'Computer Vision',
  'CSS3',
  'Cybersecurity',
  'Data Analysis',
  'Data Science',
  'Deep Learning',
  'Django',
  'Docker',
  'Ethereum',
  'Express.js',
  'FastAPI',
  'Figma',
  'Firebase',
  'Flask',
  'Flutter',
  'Generative AI',
  'Git',
  'GitHub',
  'Go',
  'Google Cloud',
  'GraphQL',
  'HTML5',
  'iOS Dev',
  'Java',
  'JavaScript',
  'Kotlin',
  'Kubernetes',
  'Linux',
  'LLMs',
  'Machine Learning',
  'Microservices',
  'Microsoft Azure',
  'MongoDB',
  'MySQL',
  'Next.js',
  'NLP',
  'Node.js',
  'NumPy',
  'OpenCV',
  'Pandas',
  'PHP',
  'PostgreSQL',
  'Prisma',
  'Prompt Engineering',
  'PyTorch',
  'Python',
  'React',
  'React Native',
  'Redis',
  'REST APIs',
  'Rust',
  'Scikit-Learn',
  'Smart Contracts',
  'Solidity',
  'Spring Boot',
  'SQL',
  'Supabase',
  'Svelte',
  'Swift',
  'Tailwind CSS',
  'TensorFlow',
  'TypeScript',
  'UI/UX Design',
  'Vue.js',
  'Web3.js',
  'WebSockets'
];

export default function SkillSelect({ 
  selectedSkills = [], 
  onChange, 
  placeholder = 'Type to search skills...',
  theme = 'dark',
  label = 'Skills'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const normalizedSelected = (selectedSkills || []).map(s => s.trim());

  // Filter skills based on search term, exclude already selected, sort alphabetically
  const filteredSkills = POPULAR_SKILLS
    .filter(skill => {
      const matchesSearch = skill.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const notSelected = !normalizedSelected.some(s => s.toLowerCase() === skill.toLowerCase());
      return matchesSearch && notSelected;
    })
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const isCustomSkill = searchTerm.trim() && 
    !POPULAR_SKILLS.some(s => s.toLowerCase() === searchTerm.trim().toLowerCase()) &&
    !normalizedSelected.some(s => s.toLowerCase() === searchTerm.trim().toLowerCase());

  const handleAddSkill = (skillToAdd) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!normalizedSelected.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...normalizedSelected, trimmed]);
    }
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillToRemove) => {
    onChange(normalizedSelected.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSkills.length > 0) {
        handleAddSkill(filteredSkills[0]);
      } else if (searchTerm.trim()) {
        handleAddSkill(searchTerm.trim());
      }
    } else if (e.key === 'Backspace' && !searchTerm && normalizedSelected.length > 0) {
      handleRemoveSkill(normalizedSelected[normalizedSelected.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Theme-based style definitions
  const isDark = theme === 'dark';

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <span className="flex items-center gap-1.5">
            <Code size={13} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
            {label}
          </span>
          {normalizedSelected.length > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-blue-950 text-blue-400 border border-blue-900/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              {normalizedSelected.length} selected
            </span>
          )}
        </label>
      )}

      {/* Input container with chips */}
      <div 
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full min-h-[44px] p-2 rounded-xl border flex flex-wrap items-center gap-1.5 transition-all cursor-text ${
          isDark 
            ? 'bg-slate-800 border-slate-700 focus-within:border-blue-500 text-slate-100'
            : 'bg-slate-50 border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white text-slate-800'
        }`}
      >
        {/* Selected Skill Badges */}
        {normalizedSelected.map((skill, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
              isDark 
                ? 'bg-blue-950/80 text-blue-300 border border-blue-800/80' 
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSkill(skill);
              }}
              className={`hover:opacity-80 rounded-full p-0.5 transition-colors cursor-pointer ${
                isDark ? 'text-blue-400 hover:text-white' : 'text-blue-600 hover:text-blue-900'
              }`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Search input field */}
        <div className="flex-1 min-w-[140px] flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={normalizedSelected.length === 0 ? placeholder : 'Add more skills...'}
            className={`w-full bg-transparent border-none outline-none text-xs ${
              isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Dropdown Suggestions - Sorted Alphabetically */}
      {isOpen && (
        <div 
          className={`absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border shadow-xl p-1.5 space-y-0.5 custom-scrollbar backdrop-blur-md ${
            isDark 
              ? 'bg-slate-900 border-slate-700 text-slate-200' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Custom skill option if not in predefined list */}
          {isCustomSkill && (
            <button
              type="button"
              onClick={() => handleAddSkill(searchTerm.trim())}
              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-blue-950/60 hover:bg-blue-900/80 text-blue-300' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              <Plus size={14} /> Add "{searchTerm.trim()}" as custom skill
            </button>
          )}

          {/* Filtered suggestions list (Alphabetical) */}
          {filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleAddSkill(skill)}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  isDark 
                    ? 'hover:bg-slate-800 hover:text-blue-400 text-slate-300' 
                    : 'hover:bg-slate-100 hover:text-blue-600 text-slate-700'
                }`}
              >
                <span>{skill}</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+ select</span>
              </button>
            ))
          ) : !isCustomSkill && (
            <div className={`px-3 py-3 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {normalizedSelected.length === POPULAR_SKILLS.length
                ? 'All available skills already selected.'
                : 'No matching skills found. Type to add custom skill.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
