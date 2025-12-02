"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './ExpandableCards.css';

/**
 * ExpandableCards Component
 * 
 * Interactive card layout where hovered cards expand smoothly for focused content viewing.
 * Based on ScrollX-UI ExpandableCards component.
 * 
 * @param {Object} props - Component props
 * @param {Array<ExpandableCard>} props.cards - Array of card objects with id and content
 * @param {number} [props.defaultExpanded=1] - ID of initially expanded card
 * @param {string} [props.className=''] - Additional CSS class
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.3
 */
const ExpandableCards = ({
  cards = [],
  defaultExpanded = 1,
  className = ''
}) => {
  const [expandedId, setExpandedId] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();

  // Animation variants matching ScrollX-UI
  const getCardVariants = () => ({
    expanded: { 
      flex: 3, 
      transition: { 
        duration: prefersReducedMotion ? 0 : 0.5, 
        ease: "easeInOut" 
      } 
    },
    collapsed: { 
      flex: 1, 
      transition: { 
        duration: prefersReducedMotion ? 0 : 0.5, 
        ease: "easeInOut" 
      } 
    },
  });

  // Don't render if no cards
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className={`expandable-cards ${className}`.trim()}>
      {cards.map((card) => {
        const isExpanded = expandedId === card.id;

        return (
          <motion.div
            key={card.id}
            className="expandable-cards__item"
            variants={getCardVariants()}
            initial={isExpanded ? "expanded" : "collapsed"}
            animate={isExpanded ? "expanded" : "collapsed"}
            onMouseEnter={() => setExpandedId(card.id)}
          >
            <div className="expandable-cards__content">
              {card.content}
            </div>

            {!isExpanded && (
              <motion.div
                className="expandable-cards__overlay"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ExpandableCards;
