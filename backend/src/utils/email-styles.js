/**
 * Email Styles Configuration
 * Centralized styles for email templates
 */

const EMAIL_COLORS = {
  // Brand colors
  PRIMARY: '#E11D48',
  PRIMARY_DARK: '#BE123C',
  SECONDARY: '#3B82F6',
  SECONDARY_DARK: '#2563EB',
  SUCCESS: '#10B981',
  SUCCESS_DARK: '#059669',
  
  // Text colors
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#475569',
  TEXT_MUTED: '#6B7280',
  TEXT_LIGHT: '#64748b',
  
  // Background colors
  BG_WHITE: '#ffffff',
  BG_LIGHT: '#f9f9f9',
  BG_GRAY: '#f8f9fa',
  BG_BORDER: '#E5E7EB',
  
  // Status colors
  WARNING: '#F59E0B',
  WARNING_BG: '#FEF3C7',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Specific backgrounds
  SUCCESS_LIGHT: '#D1FAE5',
  SUCCESS_TEXT: '#065F46',
  INFO_LIGHT: '#DBEAFE',
  INFO_TEXT: '#1E40AF',
  PRIMARY_LIGHT: '#FFF1F7',
};

const EMAIL_STYLES = {
  body: `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: ${EMAIL_COLORS.TEXT_PRIMARY};
  `,
  
  container: `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `,
  
  header: (gradient = 'primary') => {
    const gradients = {
      primary: `linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY} 0%, ${EMAIL_COLORS.PRIMARY_DARK} 100%)`,
      success: `linear-gradient(135deg, ${EMAIL_COLORS.SUCCESS} 0%, ${EMAIL_COLORS.SUCCESS_DARK} 100%)`,
      info: `linear-gradient(135deg, ${EMAIL_COLORS.SECONDARY} 0%, ${EMAIL_COLORS.SECONDARY_DARK} 100%)`,
      warning: `linear-gradient(135deg, ${EMAIL_COLORS.WARNING} 0%, #D97706 100%)`,
    };
    
    return `
      background: ${gradients[gradient] || gradients.primary};
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    `;
  },
  
  logoIcon: `
    font-size: 48px;
    margin: 0 0 10px 0;
  `,
  
  content: `
    background: ${EMAIL_COLORS.BG_LIGHT};
    padding: 30px;
    border-radius: 0 0 10px 10px;
  `,
  
  badge: (type = 'success') => {
    const badges = {
      success: `background: ${EMAIL_COLORS.SUCCESS_LIGHT}; color: ${EMAIL_COLORS.SUCCESS_TEXT};`,
      info: `background: ${EMAIL_COLORS.INFO_LIGHT}; color: ${EMAIL_COLORS.INFO_TEXT};`,
      warning: `background: ${EMAIL_COLORS.WARNING_BG}; color: ${EMAIL_COLORS.WARNING};`,
    };
    
    return `
      ${badges[type] || badges.success}
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      font-weight: bold;
      font-size: 18px;
    `;
  },
  
  infoBox: `
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `,
  
  infoRow: `
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid ${EMAIL_COLORS.BG_BORDER};
  `,
  
  infoLabel: `
    color: ${EMAIL_COLORS.TEXT_MUTED};
    font-weight: 500;
  `,
  
  infoValue: `
    color: ${EMAIL_COLORS.TEXT_PRIMARY};
    font-weight: 600;
    text-align: right;
  `,
  
  highlight: `
    background: ${EMAIL_COLORS.WARNING_BG};
    padding: 15px;
    border-left: 4px solid ${EMAIL_COLORS.WARNING};
    margin: 20px 0;
  `,
  
  button: (color = 'primary') => {
    const colors = {
      primary: EMAIL_COLORS.PRIMARY,
      success: EMAIL_COLORS.SUCCESS,
      info: EMAIL_COLORS.SECONDARY,
      warning: EMAIL_COLORS.WARNING,
    };
    
    return `
      display: inline-block;
      padding: 12px 30px;
      background-color: ${colors[color] || colors.primary};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    `;
  },
  
  footer: `
    text-align: center;
    padding: 20px;
    color: ${EMAIL_COLORS.TEXT_LIGHT};
    font-size: 12px;
  `,
  
  earningsBox: `
    background: linear-gradient(135deg, ${EMAIL_COLORS.SUCCESS} 0%, ${EMAIL_COLORS.SUCCESS_DARK} 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    margin: 20px 0;
  `,
  
  earningsAmount: `
    font-size: 32px;
    font-weight: bold;
    margin: 10px 0;
  `,
};

module.exports = {
  EMAIL_COLORS,
  EMAIL_STYLES,
};
