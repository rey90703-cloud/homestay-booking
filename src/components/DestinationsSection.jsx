import { Masonry } from './animations';
import ScrollReveal from './animations/ScrollReveal/ScrollReveal';
import './DestinationsSection.css';

function DestinationsSection() {
  const destinations = [
    {
      id: '1',
      title: 'Hà Nội',
      img: '/images/dest-hn-28e1f0.png',
      url: '/search?location=hanoi',
      height: 400
    },
    {
      id: '2',
      title: 'Sa Pa',
      img: '/images/dest-sp-331ab8.png',
      url: '/search?location=sapa',
      height: 500
    },
    {
      id: '3',
      title: 'Hạ Long',
      img: '/images/dest-hl-2b6399.png',
      url: '/search?location=halong',
      height: 350
    },
    {
      id: '4',
      title: 'Đà Nẵng',
      img: '/images/dest-danang.png',
      url: '/search?location=danang',
      height: 450
    },
    {
      id: '5',
      title: 'Hội An',
      img: '/images/dest-hoian.png',
      url: '/search?location=hoian',
      height: 380
    },
    {
      id: '6',
      title: 'Nha Trang',
      img: '/images/dest-nhatrang.png',
      url: '/search?location=nhatrang',
      height: 550
    },
    {
      id: '7',
      title: 'Phú Quốc',
      img: '/images/dest-phuquoc.png',
      url: '/search?location=phuquoc',
      height: 420
    },
    {
      id: '8',
      title: 'Đà Lạt',
      img: '/images/dest-dalat.png',
      url: '/search?location=dalat',
      height: 480
    }
  ];

  return (
    <section className="destinations-section">
      <ScrollReveal animation="fade-up" duration={0.5}>
        <h2 className="section-title">Điểm đến phổ biến</h2>
      </ScrollReveal>
      <ScrollReveal animation="scale" duration={0.6} delay={0.1}>
      <div className="destinations-masonry-container">
        <Masonry
          items={destinations}
          ease="power3.out"
          duration={0.6}
          stagger={0.08}
          animateFrom="bottom"
          scaleOnHover={true}
          hoverScale={0.95}
          blurToFocus={true}
          colorShiftOnHover={false}
          columns={[4, 4, 3, 2]}
          showOverlay={true}
        />
      </div>
      </ScrollReveal>
    </section>
  );
}

export default DestinationsSection;
