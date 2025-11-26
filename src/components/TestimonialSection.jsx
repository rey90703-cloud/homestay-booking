import React from 'react';
import './TestimonialSection.css';

const TestimonialSection = () => {
  const testimonials = [
    {
      name: 'Minh Anh',
      text: 'Homestay rất đẹp, view tuyệt vời. Chủ nhà thân thiện và nhiệt tình. Sẽ quay lại lần sau!',
      avatar: '/images/hn1-a061b2.png'
    },
    {
      name: 'Tuấn Kiệt',
      text: 'Giá cả hợp lý, vị trí thuận tiện. Phòng sạch sẽ, đầy đủ tiện nghi. Rất hài lòng!',
      avatar: '/images/hn2-7326f7.png'
    },
    {
      name: 'Anh Minh',
      text: 'Trải nghiệm tuyệt vời! Không gian yên tĩnh, thích hợp để nghỉ ngơi và thư giãn.',
      avatar: '/images/hn3-64c570.png'
    }
  ];

  return (
    <section className="testimonial-section">
      <h2 className="section-title">Khách hàng nói gì về chúng tôi?</h2>
      <div className="testimonial-grid">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="testimonial-card">
            <img src={testimonial.avatar} alt={testimonial.name} className="testimonial-avatar" />
            <div className="testimonial-content">
              <h4 className="testimonial-name">{testimonial.name}</h4>
              <p className="testimonial-text">{testimonial.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialSection;

