/**
 * Email Template Builder
 * Tạo email templates theo pattern Builder để tái sử dụng và dễ maintain
 */

const { EMAIL_STYLES } = require('../utils/email-styles');
const { formatCurrency, formatDate, formatDateTime, formatPhone } = require('../utils/formatters');

class EmailTemplateBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.template = {
      headerIcon: '🏠',
      headerTitle: 'HomestayBooking',
      headerSubtitle: '',
      headerGradient: 'primary',
      badge: null,
      sections: [],
      highlight: null,
      button: null,
      footer: true,
    };
    return this;
  }

  setHeader(icon, title, subtitle, gradient = 'primary') {
    this.template.headerIcon = icon;
    this.template.headerTitle = title;
    this.template.headerSubtitle = subtitle;
    this.template.headerGradient = gradient;
    return this;
  }

  setBadge(text, type = 'success') {
    this.template.badge = { text, type };
    return this;
  }

  addSection(title, rows, gradient = null) {
    this.template.sections.push({ title, rows, gradient });
    return this;
  }

  setHighlight(title, items) {
    this.template.highlight = { title, items };
    return this;
  }

  setButton(text, url, color = 'primary') {
    this.template.button = { text, url, color };
    return this;
  }

  setFooter(enabled = true) {
    this.template.footer = enabled;
    return this;
  }

  /**
   * Build HTML email template
   */
  buildHTML(greeting, message, closingMessage = null) {
    const { template } = this;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { ${EMAIL_STYLES.body} }
          .container { ${EMAIL_STYLES.container} }
          .header { ${EMAIL_STYLES.header(template.headerGradient)} }
          .logo-icon { ${EMAIL_STYLES.logoIcon} }
          .content { ${EMAIL_STYLES.content} }
          .badge { ${template.badge ? EMAIL_STYLES.badge(template.badge.type) : ''} }
          .info-box { ${EMAIL_STYLES.infoBox} }
          .info-row { ${EMAIL_STYLES.infoRow} }
          .info-row:last-child { border-bottom: none; }
          .info-label { ${EMAIL_STYLES.infoLabel} }
          .info-value { ${EMAIL_STYLES.infoValue} }
          .highlight { ${EMAIL_STYLES.highlight} }
          .button { ${template.button ? EMAIL_STYLES.button(template.button.color) : ''} }
          .footer { ${EMAIL_STYLES.footer} }
          .earnings-box { ${EMAIL_STYLES.earningsBox} }
          .earnings-amount { ${EMAIL_STYLES.earningsAmount} }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-icon">${template.headerIcon}</div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">${template.headerTitle}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${template.headerSubtitle}</p>
          </div>
          <div class="content">
    `;

    // Badge
    if (template.badge) {
      html += `
            <div class="badge">
              ${template.badge.text}
            </div>
      `;
    }

    // Greeting and message
    html += `
            <p>${greeting}</p>
            <p>${message}</p>
    `;

    // Sections
    template.sections.forEach(section => {
      if (section.gradient) {
        html += `
            <div class="earnings-box">
              <div style="font-size: 16px; opacity: 0.9;">${section.title}</div>
              <div class="earnings-amount">${section.rows[0].value}</div>
              ${section.rows[1] ? `<div style="font-size: 14px; opacity: 0.8;">${section.rows[1].value}</div>` : ''}
            </div>
        `;
      } else {
        html += `
            <div class="info-box">
              <h3 style="margin-top: 0; color: ${this._getSectionColor(section.title)};">${section.title}</h3>
        `;
        
        section.rows.forEach(row => {
          html += `
              <div class="info-row">
                <span class="info-label">${row.label}:</span>
                <span class="info-value">${row.value}</span>
              </div>
          `;
        });
        
        html += `
            </div>
        `;
      }
    });

    // Highlight
    if (template.highlight) {
      html += `
            <div class="highlight">
              <p style="margin: 0;"><strong>${template.highlight.title}</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
      `;
      
      template.highlight.items.forEach(item => {
        html += `<li>${item}</li>`;
      });
      
      html += `
              </ul>
            </div>
      `;
    }

    // Button
    if (template.button) {
      html += `
            <div style="text-align: center;">
              <a href="${template.button.url}" class="button">${template.button.text}</a>
            </div>
      `;
    }

    // Closing message
    if (closingMessage) {
      html += `
            <p style="margin-top: 30px;">${closingMessage}</p>
      `;
    }

    html += `
            <p style="margin-top: 20px;">Trân trọng,<br><strong>Đội ngũ Homestay Booking</strong></p>
          </div>
    `;

    // Footer
    if (template.footer) {
      html += `
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>© 2025 Homestay Booking. All rights reserved.</p>
          </div>
      `;
    }

    html += `
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Build plain text email
   */
  buildText(greeting, message, closingMessage = null) {
    const { template } = this;

    let text = `${template.headerSubtitle} - ${template.headerTitle}\n\n`;
    text += `${greeting}\n\n`;
    text += `${message}\n\n`;

    // Badge
    if (template.badge) {
      text += `${template.badge.text}\n\n`;
    }

    // Sections
    template.sections.forEach(section => {
      text += `${section.title.toUpperCase()}:\n`;
      section.rows.forEach(row => {
        text += `- ${row.label}: ${row.value}\n`;
      });
      text += '\n';
    });

    // Highlight
    if (template.highlight) {
      text += `${template.highlight.title.toUpperCase()}:\n`;
      template.highlight.items.forEach(item => {
        text += `- ${item}\n`;
      });
      text += '\n';
    }

    // Button
    if (template.button) {
      text += `${template.button.text}: ${template.button.url}\n\n`;
    }

    // Closing message
    if (closingMessage) {
      text += `${closingMessage}\n\n`;
    }

    text += 'Trân trọng,\nĐội ngũ Homestay Booking';

    return text;
  }

  _getSectionColor(title) {
    if (title.includes('thanh toán') || title.includes('THANH TOÁN')) {
      return '#10B981';
    }
    if (title.includes('booking') || title.includes('BOOKING')) {
      return '#059669';
    }
    if (title.includes('khách') || title.includes('KHÁCH')) {
      return '#3B82F6';
    }
    return '#2563EB';
  }

  /**
   * Build complete email (HTML + Text)
   */
  build(greeting, message, closingMessage = null) {
    return {
      html: this.buildHTML(greeting, message, closingMessage),
      text: this.buildText(greeting, message, closingMessage),
    };
  }
}

module.exports = EmailTemplateBuilder;
