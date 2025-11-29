import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import './ThemeSwitch.css';

const ThemeSwitch = ({
  modes = ['light', 'dark', 'system'],
  showInactiveIcons = 'all',
  showActiveIconOnly = false,
  variant = 'default', // 'default' | 'icon-click'
  className = '',
}) => {
  const { theme, setTheme } = useTheme();

  const icons = {
    light: <FiSun size={16} />,
    dark: <FiMoon size={16} />,
    system: <FiMonitor size={16} />,
  };

  const handleClick = () => {
    if (variant === 'icon-click') return;
    
    const currentIndex = modes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex]);
  };

  const handleIconClick = (mode) => {
    if (variant === 'icon-click') {
      setTheme(mode);
    }
  };

  const getVisibleModes = () => {
    if (showActiveIconOnly) {
      return [theme];
    }
    
    switch (showInactiveIcons) {
      case 'none':
        return [theme];
      case 'next': {
        const currentIndex = modes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % modes.length;
        return [theme, modes[nextIndex]];
      }
      case 'all':
      default:
        return modes;
    }
  };

  const visibleModes = getVisibleModes();
  const activeIndex = visibleModes.indexOf(theme);

  return (
    <div
      className={`theme-switch ${className}`}
      onClick={variant !== 'icon-click' ? handleClick : undefined}
      role="button"
      tabIndex={0}
      aria-label="Toggle theme"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className="theme-switch-indicator"
        style={{
          '--indicator-offset': `${activeIndex}`,
        }}
      />
      {visibleModes.map((mode) => (
        <button
          key={mode}
          className={`theme-switch-button ${theme === mode ? 'active' : ''}`}
          onClick={(e) => {
            if (variant === 'icon-click') {
              e.stopPropagation();
              handleIconClick(mode);
            }
          }}
          aria-label={`Switch to ${mode} mode`}
          title={mode.charAt(0).toUpperCase() + mode.slice(1)}
        >
          {icons[mode]}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitch;
