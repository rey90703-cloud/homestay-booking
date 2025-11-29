import { useState, useEffect } from 'react';
import './AmenitiesSection.css';
import { 
  RadialSocials, 
  RadialSocialsContent, 
  RadialCircular, 
  RadialIcon 
} from './animations/RadialSocials/RadialSocials';

import { FaWifi, FaSnowflake, FaSwimmer, FaParking, FaSeedling } from "react-icons/fa";
import { FaKitchenSet } from "react-icons/fa6";
import { MdLocalLaundryService } from "react-icons/md";
import { TbAirConditioning } from "react-icons/tb";

function AmenitiesSection() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive radius
  const getRadius = () => {
    if (windowWidth <= 480) return { inner: 40, outer: 75 };
    if (windowWidth <= 768) return { inner: 50, outer: 90 };
    return { inner: 60, outer: 110 };
  };

  const { inner, outer } = getRadius();

  return (
    <section className="amenities-section">
      <div className="amenities-container">
        <div className="amenities-text">
          <h2 className="amenities-title">Tiện nghi Homestay</h2>
          <p className="amenities-desc">
            Khám phá các tiện nghi hiện đại, đầy đủ cho kỳ nghỉ hoàn hảo của bạn. 
            Từ WiFi tốc độ cao đến hồ bơi riêng, chúng tôi đảm bảo mọi nhu cầu của bạn.
          </p>
        </div>

        <div className="amenities-radial-wrapper">
          <RadialSocials animationDelay={200} expandDuration={600}>
            <RadialSocialsContent>
              <RadialCircular radius={inner} duration={20} startAngle={39}>
                <RadialIcon icon={<FaWifi style={{ color: '#4285F4' }} />} />
                <RadialIcon icon={<FaKitchenSet style={{ color: '#4ECDC4' }} />} />
                <RadialIcon icon={<FaSnowflake style={{ color: '#74C0FC' }} />} />
                <RadialIcon icon={<MdLocalLaundryService style={{ color: '#45B7D1' }} />} />
              </RadialCircular>
              <RadialCircular radius={outer} duration={40} startAngle={70}>
                <RadialIcon icon={<FaParking style={{ color: '#636E72' }} />} />
                <RadialIcon icon={<FaSeedling style={{ color: '#00B894' }} />} />
                <RadialIcon icon={<FaSwimmer style={{ color: '#0984E3' }} />} />
                <RadialIcon icon={<TbAirConditioning style={{ color: '#6C5CE7' }} />} />
              </RadialCircular>
            </RadialSocialsContent>
          </RadialSocials>
        </div>
      </div>
    </section>
  );
}

export default AmenitiesSection;
