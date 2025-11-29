import React from 'react';
import { LogoLoop } from './animations';
import './PartnersSection.css';

/**
 * Partner and payment provider logos section
 * Requirements: 5.1, 5.5 - Display partner logos in continuous loop
 */
const partnerLogos = [
  {
    src: '/images/logo-visa.png',
    alt: 'Visa',
    title: 'Thanh toán Visa'
  },
  {
    src: '/images/mastercard-logo.png',
    alt: 'Mastercard',
    title: 'Thanh toán Mastercard'
  },
  {
    src: '/images/logo-vnpay.png',
    alt: 'VNPay',
    title: 'Thanh toán VNPay'
  },
  {
    src: '/images/logo-momo.png',
    alt: 'MoMo',
    title: 'Ví điện tử MoMo'
  },
  {
    src: '/images/ZaloPay-Oj4VstBFb_brandlogos.net.svg',
    alt: 'ZaloPay',
    title: 'Ví điện tử ZaloPay'
  }
];

const PartnersSection = () => {
  return (
    <section className="partners-section">
      <h2 className="partners-title">Đối tác thanh toán</h2>
      <LogoLoop
        logos={partnerLogos}
        speed={40}
        direction="left"
        logoHeight={48}
        gap={56}
        pauseOnHover={true}
        fadeOut={false}
        ariaLabel="Đối tác thanh toán của HomestayBooking"
      />
    </section>
  );
};

export default PartnersSection;
