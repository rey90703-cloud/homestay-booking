import { AnimatedTestimonials } from './animations';
import ScrollReveal from './animations/ScrollReveal/ScrollReveal';
import './TestimonialSection.css';

/**
 * TestimonialSection Component
 * 
 * Displays customer testimonials using AnimatedTestimonials carousel.
 * Requirements: 3.1, 3.5 - Display testimonials in animated carousel format
 */
const TestimonialSection = () => {
  // Testimonial data migrated to new format for AnimatedTestimonials
  // Requirements: 3.5 - Show customer avatar, name, and review text
  const testimonials = [
    {
      name: 'Minh Anh',
      description: 'Homestay rất đẹp, view tuyệt vời. Chủ nhà thân thiện và nhiệt tình. Sẽ quay lại lần sau! Đây là một trong những trải nghiệm tuyệt vời nhất của tôi.',
      image: '/images/testimonial-1.png',
      handle: '@minhanh_travel'
    },
    {
      name: 'Thu Hương',
      description: 'Dịch vụ đặt phòng nhanh chóng, tiện lợi. Homestay đúng như mô tả, thậm chí còn đẹp hơn trong ảnh. Chắc chắn sẽ giới thiệu cho bạn bè!',
      image: '/images/testimonial-2.png',
      handle: '@thuhuong_review'
    },
    {
      name: 'Tuấn Kiệt',
      description: 'Giá cả hợp lý, vị trí thuận tiện. Phòng sạch sẽ, đầy đủ tiện nghi. Rất hài lòng với dịch vụ và sự chuyên nghiệp của đội ngũ hỗ trợ!',
      image: '/images/testimonial-3.png',
      handle: '@tuankiet_explorer'
    },
    {
      name: 'Lan Anh',
      description: 'Trải nghiệm tuyệt vời! Không gian yên tĩnh, thích hợp để nghỉ ngơi và thư giãn. Tôi đã có những khoảnh khắc đáng nhớ tại đây.',
      image: '/images/testimonial-4.png',
      handle: '@lananh_vip'
    }
  ];

  return (
    <section className="testimonial-section">
      <ScrollReveal animation="fade-up" duration={0.5}>
        <h2 className="section-title">Khách hàng nói gì về chúng tôi?</h2>
      </ScrollReveal>
      {/* Requirements: 3.1 - Display testimonials in animated carousel format */}
      {/* Requirements: 3.3 - Auto advance after 5 seconds idle */}
      <ScrollReveal animation="fade-up" duration={0.6} delay={0.1}>
      <AnimatedTestimonials
        data={testimonials}
        autoPlay={true}
        autoPlayInterval={5000}
      />
      </ScrollReveal>
    </section>
  );
};

export default TestimonialSection;

