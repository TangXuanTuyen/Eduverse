/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterConfig, Direction } from '../../types/game.ts';

interface PixelAvatarProps {
  config: CharacterConfig;
  direction?: Direction;
  isWalking?: boolean;
  stepFrame?: number; // 0, 1, 2
  size?: number; // width & height in px
  className?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  config,
  direction = 'down',
  isWalking = false,
  stepFrame = 0,
  size = 64,
  className = '',
}) => {
  // Bobbing offset for walking
  const bobY = isWalking ? (stepFrame % 2 === 1 ? -1 : 1) : 0;
  const legOffsetLeft = isWalking ? (stepFrame === 1 ? -2 : 0) : 0;
  const legOffsetRight = isWalking ? (stepFrame === 2 ? -2 : 0) : 0;

  const skin = config.skinTone || '#FCD34D';
  const hair = config.hairColor || '#1E293B';
  const eyes = config.eyeColor || '#0F172A';
  const outfit = config.outfit || 'thcs_uniform';
  const outfitColor = config.outfitColor || '#3B82F6';
  const accessory = config.accessory || 'none';

  return (
    <div
      className={`inline-block relative pixel-art select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 28"
        width={size}
        height={size}
        className="w-full h-full"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <defs>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="0" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Drop Shadow on Ground */}
        <ellipse cx="12" cy="26" rx="6" ry="1.8" fill="#00000033" />

        {/* Group with bobbing motion */}
        <g transform={`translate(0, ${bobY})`}>
          {/* BACK ACCESSORIES (e.g. Backpack when facing Down/Sides or looking from behind) */}
          {accessory === 'backpack' && direction === 'up' && (
            <rect x="8" y="13" width="8" height="8" rx="1" fill="#DC2626" />
          )}
          {accessory === 'backpack' && (direction === 'left' || direction === 'right') && (
            <rect
              x={direction === 'left' ? '15' : '6'}
              y="13"
              width="3"
              height="7"
              fill="#DC2626"
            />
          )}

          {/* BACK HAIR (When facing Down, long hair/ponytail shows behind head) */}
          {direction === 'down' && (config.hairStyle === 'ponytail' || config.hairStyle === 'wavy') && (
            <path
              d="M 6 8 Q 12 18 18 8 Z"
              fill={hair}
            />
          )}

          {/* LEGS & SHOES */}
          {direction === 'up' || direction === 'down' ? (
            <>
              {/* Left Leg */}
              <rect x="8" y={20 + legOffsetLeft} width="3" height="4" fill="#1E293B" />
              <rect x="7" y={24 + legOffsetLeft} width="4" height="2" fill="#0F172A" />
              {/* Right Leg */}
              <rect x="13" y={20 + legOffsetRight} width="3" height="4" fill="#1E293B" />
              <rect x="13" y={24 + legOffsetRight} width="4" height="2" fill="#0F172A" />
            </>
          ) : (
            // Side walking profile
            <>
              <rect x="10" y={20 + legOffsetLeft} width="4" height="4" fill="#1E293B" />
              <rect
                x={direction === 'left' ? '8' : '12'}
                y={24 + legOffsetLeft}
                width="5"
                height="2"
                fill="#0F172A"
              />
            </>
          )}

          {/* BODY / OUTFIT */}
          {outfit === 'thcs_uniform' ? (
            // Vietnamese THCS Uniform: Crisp white shirt, navy pants/skirt, red youth pioneer scarf!
            <g>
              <rect x="7" y="12" width="10" height="8" fill="#F8FAFC" />
              {/* Navy collar / waistband */}
              <rect x="7" y="18" width="10" height="2" fill="#1E3A8A" />
              {direction === 'down' && (
                <>
                  {/* Distinctive Red Scarf (Khăn quàng đỏ Đội TNTP HCM) */}
                  <polygon points="12,12 10,14 14,14" fill="#EF4444" />
                  <polygon points="12,14 11,18 13,18" fill="#DC2626" />
                </>
              )}
            </g>
          ) : outfit === 'stem_coat' ? (
            // STEM Lab Coat: White medical/science coat, teal inner shirt, pen pocket
            <g>
              <rect x="7" y="12" width="10" height="9" fill="#F1F5F9" />
              <rect x="10" y="12" width="4" height="4" fill="#0D9488" />
              <rect x="11" y="12" width="2" height="9" fill="#CBD5E1" />
              {direction === 'down' && (
                <>
                  {/* Pocket with blue pen */}
                  <rect x="8" y="15" width="2" height="3" fill="#E2E8F0" />
                  <rect x="8" y="14" width="1" height="1" fill="#2563EB" />
                </>
              )}
            </g>
          ) : outfit === 'hoodie' ? (
            // Modern Trendy School Hoodie
            <g>
              <rect x="7" y="12" width="10" height="8" fill={outfitColor} />
              <rect x="9" y="15" width="6" height="4" fill="#00000022" />
              {direction === 'down' && (
                <>
                  {/* Hoodie drawstrings */}
                  <rect x="10" y="12" width="1" height="4" fill="#FFFFFF" />
                  <rect x="13" y="12" width="1" height="4" fill="#FFFFFF" />
                </>
              )}
            </g>
          ) : outfit === 'astronaut' ? (
            // Space Science Explorer Suit: Silver with tech neon glow
            <g>
              <rect x="6" y="12" width="12" height="8" fill="#E2E8F0" />
              <rect x="10" y="14" width="4" height="3" fill="#0284C7" />
              <rect x="11" y="15" width="2" height="1" fill="#38BDF8" />
            </g>
          ) : (
            // Sporty Athletic Jersey
            <g>
              <rect x="7" y="12" width="10" height="8" fill={outfitColor} />
              <rect x="7" y="13" width="10" height="1" fill="#FEF08A" />
              <rect x="7" y="16" width="10" height="1" fill="#FEF08A" />
            </g>
          )}

          {/* ARMS */}
          {direction === 'down' || direction === 'up' ? (
            <>
              <rect
                x="5"
                y={13 + (isWalking && stepFrame === 1 ? 1 : 0)}
                width="2"
                height="5"
                fill={outfit === 'thcs_uniform' ? '#F8FAFC' : outfitColor}
              />
              <rect
                x="5"
                y={17 + (isWalking && stepFrame === 1 ? 1 : 0)}
                width="2"
                height="2"
                fill={skin}
              />
              <rect
                x="17"
                y={13 + (isWalking && stepFrame === 2 ? 1 : 0)}
                width="2"
                height="5"
                fill={outfit === 'thcs_uniform' ? '#F8FAFC' : outfitColor}
              />
              <rect
                x="17"
                y={17 + (isWalking && stepFrame === 2 ? 1 : 0)}
                width="2"
                height="2"
                fill={skin}
              />
            </>
          ) : (
            <>
              <rect
                x={direction === 'left' ? '9' : '13'}
                y="13"
                width="3"
                height="5"
                fill={outfit === 'thcs_uniform' ? '#F8FAFC' : outfitColor}
              />
              <rect
                x={direction === 'left' ? '9' : '13'}
                y="17"
                width="2"
                height="2"
                fill={skin}
              />
            </>
          )}

          {/* HEAD & FACE */}
          {/* Base Face */}
          <rect x="7" y="4" width="10" height="9" fill={skin} rx="1" />

          {/* EYES & EXPRESSION */}
          {direction === 'down' ? (
            <>
              {/* Cute Anime Pupil Eyes */}
              <rect x="9" y="7" width="2" height="3" fill="#FFFFFF" />
              <rect x="9" y="8" width="2" height="2" fill={eyes} />
              <rect x="9" y="7" width="1" height="1" fill="#FFFFFF" />

              <rect x="13" y="7" width="2" height="3" fill="#FFFFFF" />
              <rect x="13" y="8" width="2" height="2" fill={eyes} />
              <rect x="13" y="7" width="1" height="1" fill="#FFFFFF" />

              {/* Rosy Cheeks */}
              <rect x="8" y="10" width="1" height="1" fill="#FB7185" />
              <rect x="15" y="10" width="1" height="1" fill="#FB7185" />

              {/* Gentle Smile */}
              <rect x="11" y="11" width="2" height="1" fill="#991B1B" />
            </>
          ) : direction === 'left' ? (
            <>
              <rect x="8" y="7" width="2" height="3" fill="#FFFFFF" />
              <rect x="8" y="8" width="2" height="2" fill={eyes} />
              <rect x="8" y="7" width="1" height="1" fill="#FFFFFF" />
              <rect x="7" y="10" width="1" height="1" fill="#FB7185" />
            </>
          ) : direction === 'right' ? (
            <>
              <rect x="14" y="7" width="2" height="3" fill="#FFFFFF" />
              <rect x="14" y="8" width="2" height="2" fill={eyes} />
              <rect x="15" y="7" width="1" height="1" fill="#FFFFFF" />
              <rect x="16" y="10" width="1" height="1" fill="#FB7185" />
            </>
          ) : null /* Facing UP -> Back of head, no facial features */}

          {/* HAIR STYLES */}
          {direction === 'up' ? (
            // Full back hair
            <rect x="6" y="3" width="12" height="10" fill={hair} rx="2" />
          ) : (
            // Front hair bangs according to style
            <g>
              {/* Top Hair Cap */}
              <rect x="6" y="2" width="12" height="4" fill={hair} rx="1" />
              <rect x="6" y="3" width="2" height="6" fill={hair} />
              <rect x="16" y="3" width="2" height="6" fill={hair} />

              {config.hairStyle === 'short_classic' && (
                <>
                  <rect x="8" y="4" width="3" height="2" fill={hair} />
                  <rect x="13" y="4" width="3" height="2" fill={hair} />
                </>
              )}

              {config.hairStyle === 'spiky' && (
                <>
                  <polygon points="7,2 9,-1 11,2" fill={hair} />
                  <polygon points="11,2 13,-1 15,2" fill={hair} />
                  <rect x="8" y="4" width="4" height="2" fill={hair} />
                </>
              )}

              {config.hairStyle === 'ponytail' && (
                <>
                  {/* High Ponytail sticking out */}
                  <rect x="15" y="0" width="4" height="4" fill={hair} />
                  <rect x="17" y="3" width="3" height="5" fill={hair} />
                  <rect x="15" y="2" width="2" height="2" fill="#EC4899" /> {/* Scrunchie */}
                  <rect x="8" y="4" width="8" height="2" fill={hair} />
                </>
              )}

              {config.hairStyle === 'bob' && (
                <>
                  <rect x="5" y="5" width="2" height="6" fill={hair} />
                  <rect x="17" y="5" width="2" height="6" fill={hair} />
                  <rect x="8" y="4" width="8" height="2" fill={hair} />
                </>
              )}

              {config.hairStyle === 'curly' && (
                <>
                  <circle cx="6" cy="3" r="2" fill={hair} />
                  <circle cx="10" cy="2" r="2" fill={hair} />
                  <circle cx="14" cy="2" r="2" fill={hair} />
                  <circle cx="18" cy="3" r="2" fill={hair} />
                  <rect x="8" y="4" width="8" height="2" fill={hair} />
                </>
              )}

              {config.hairStyle === 'wavy' && (
                <>
                  <rect x="5" y="5" width="2" height="8" fill={hair} />
                  <rect x="17" y="5" width="2" height="8" fill={hair} />
                  <path d="M 8 5 Q 12 7 16 5" stroke={hair} strokeWidth="2" fill="none" />
                </>
              )}
            </g>
          )}

          {/* ACCESSORIES (Layered on top of hair & face) */}
          {accessory === 'glasses' && direction === 'down' && (
            <g>
              <rect x="8" y="7" width="4" height="3" fill="none" stroke="#1E293B" strokeWidth="1" />
              <rect x="12" y="7" width="4" height="3" fill="none" stroke="#1E293B" strokeWidth="1" />
              <line x1="12" y1="8" x2="12" y2="8" stroke="#1E293B" strokeWidth="1" />
            </g>
          )}

          {accessory === 'vr_headset' && (direction === 'down' || direction === 'left' || direction === 'right') && (
            <g>
              <rect x="7" y="6" width="10" height="4" fill="#06B6D4" rx="1" />
              <rect x="8" y="7" width="8" height="2" fill="#0891B2" />
              <line x1="8" y1="8" x2="16" y2="8" stroke="#A5F3FC" strokeWidth="1" />
            </g>
          )}

          {accessory === 'headphones' && (
            <g>
              <path d="M 6 8 Q 12 0 18 8" stroke="#3B82F6" strokeWidth="2" fill="none" />
              <rect x="5" y="7" width="2" height="4" fill="#1D4ED8" rx="1" />
              <rect x="17" y="7" width="2" height="4" fill="#1D4ED8" rx="1" />
            </g>
          )}

          {accessory === 'cap' && (
            <g>
              <rect x="6" y="1" width="12" height="4" fill="#EF4444" rx="1" />
              {direction === 'down' && <rect x="5" y="4" width="14" height="2" fill="#B91C1C" />}
              {direction === 'left' && <rect x="2" y="4" width="8" height="2" fill="#B91C1C" />}
              {direction === 'right' && <rect x="14" y="4" width="8" height="2" fill="#B91C1C" />}
            </g>
          )}

          {accessory === 'science_badge' && direction === 'down' && (
            // Golden Science Star Badge pinned on shirt
            <g>
              <circle cx="9" cy="14" r="1.5" fill="#F59E0B" />
              <circle cx="9" cy="14" r="0.8" fill="#FEF3C7" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
