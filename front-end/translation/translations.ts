
export const translations = {
  vi: {
    nav: {
      home: "Trang chủ",
      about: "Về chúng tôi",
      policy: "Chính sách",
      contact: "Liên hệ",
      cta: "Bắt đầu ngay",
      client: "Truy cập Client"
    },
    hero: {
      badge: "Hơn 20 trường vừa gia nhập trong tháng này",
      title1: "Học đường không tiền mặt,",
      title2: "Trải nghiệm không giới hạn.",
      desc: "Giải pháp an toàn nhất để học sinh thanh toán suất ăn và dịch vụ. Phụ huynh quản lý mọi thứ tức thì qua nền tảng số bảo mật.",
      stats: "5,000+ Học sinh đang sử dụng hàng ngày",
      floating: {
        instant: "Tức thì",
        topup: "Nạp tiền từ phụ huynh"
      }
    },
    about: {
      badge: "Về SmartSchool",
      heroTitle1: "Tái định nghĩa",
      heroTitle2: "Dịch vụ Học đường.",
      heroDesc: "Chúng tôi xây dựng hệ sinh thái học đường thông minh, nơi công nghệ phục vụ con người, mang lại sự an tâm cho phụ huynh và sự tiện lợi cho học sinh.",
      missionBadge: "Sứ mệnh của chúng tôi",
      missionTitle: "Giá trị cốt lõi",
      stats: [
        { label: 'Trường liên kết', value: '20+' },
        { label: 'Học sinh sử dụng', value: '5,000+' },
        { label: 'Giao dịch mỗi ngày', value: '12,000+' },
        { label: 'Độ an toàn', value: '100%' }
      ],
      cards: [
        {
          title: 'An toàn Tuyệt đối',
          desc: 'Loại bỏ rủi ro tiền mặt và mất mát cho học sinh tại trường thông qua hệ thống định danh thông minh.'
        },
        {
          title: 'Minh bạch 100%',
          desc: 'Phụ huynh theo dõi chi tiết từng khoản chi tiêu theo thời gian thực, đảm bảo quyền giám sát dinh dưỡng.'
        },
        {
          title: 'Công nghệ Tiên phong',
          desc: 'Số hóa trải nghiệm căng tin với công nghệ QR Code một chạm và hệ thống báo soát tự động.'
        }
      ]
    },
    contact: {
      heroTitle: "Kết nối với",
      heroDesc: "Luôn sẵn sàng lắng nghe và hỗ trợ nhà trường & phụ huynh 24/7.",
      formTitle: "Gửi tin nhắn",
      labels: {
        name: "Họ tên",
        email: "Email",
        topic: "Chủ đề",
        message: "Nội dung",
        submit: "Gửi yêu cầu"
      },
      topics: [
        "Hỗ trợ kỹ thuật",
        "Hợp tác nhà trường",
        "Yêu cầu hoàn tiền",
        "Khác"
      ],
      placeholders: {
        name: "Nguyễn Văn A",
        email: "name@email.com",
        message: "Chúng tôi có thể giúp gì cho bạn?"
      },
      info: {
        phone: "Hotline",
        email: "Email",
       
        
      },
      alert: "Yêu cầu đã được gửi! Chúng tôi sẽ phản hồi trong vòng 24h."
    },
    footer: {
      desc: "Giải pháp an toàn nhất để học sinh thanh toán các dịch vụ học đường. Được tin dùng bởi hơn 20 trường đối tác trên toàn quốc.",
      navTitle: "Điều hướng",
      contactTitle: "Thông tin Liên hệ",
    },
    policy: {
      header: {
        title: "Báo cáo Dự án — ",
        accent: "Cơ chế Vận hành.",
        desc: "Minh bạch hóa dòng tiền, tối ưu hóa vận hành và đảm bảo an toàn tuyệt đối cho hệ sinh thái học đường."
      },
      sections: {
        compliance: {
          label: "Pháp lý & Tuân thủ",
          title: "Cơ chế Pháp lý & Tuân thủ",
          desc: "Để đảm bảo hoạt động hợp pháp mà không cần giấy phép Trung gian thanh toán, hệ thống vận hành theo mô hình Closed-Loop (Vòng kín). Mọi giao dịch được định nghĩa là 'Giao dịch mua bán hàng hóa/dịch vụ trả trước', chuyển đổi quyền sở hữu tiền sang đơn vị cung cấp (Nhà trường) ngay tại thời điểm mua gói.",
          aml: "Hệ thống không cho phép rút tiền (No Cash-out). Các Voucher đã mua không thể quy đổi ngược thành tiền mặt hoặc chuyển nhượng.",
          kyc: "Sử dụng dữ liệu hồ sơ học sinh đã được nhà trường xác thực làm cơ sở định danh. Mọi giao dịch gắn liền với một cá nhân cụ thể."
        },
        limits: {
          label: "Quy mô & Giới hạn",
          title: "Quy mô & Giới hạn Hệ thống",
          desc: "Thiết kế tối ưu cho các giao dịch vi mô (Micro-payments) phục vụ nhu cầu thiết yếu hàng ngày.",
          avg: "Giá trị trung bình: 10k - 50k VNĐ.",
          storage: "Tối đa 2.000.000 VNĐ/tài khoản. Phụ huynh cài đặt giới hạn chi tiêu hàng ngày.",
          control: "Chặn mua các mặt hàng hạn chế (ví dụ: nước ngọt có ga)."
        },
        scope: {
          label: "Phạm vi Triển khai",
          title: "Phạm vi Triển khai Hiện tại",
          parent: "Phân hệ Phụ huynh",
          parentItems: ["Mua gói dịch vụ TMĐT", "Thanh toán VNPay/VietQR", "Giám sát thời gian thực"],
          student: "Phân hệ Học sinh",
          studentItems: ["Định danh Thẻ/QR", "Redeem nhanh tại quầy"],
          mgmt: "Phân hệ Quản lý",
          mgmtItems: ["POS Tablet/Mobile", "Báo cáo & Đối soát", "Quản lý thực đơn"]
        },
        roadmap: {
          label: "Hiệu quả & Lộ trình",
          title: "Hiệu quả & Lộ trình Phát triển",
          statTime: "Thời gian quét: 3-5 giây",
          statLoss: "Thất thoát tiền mặt: 0%",
          quote: "Giảm thời gian xếp hàng từ 45 giây xuống 3-5 giây.",
          items: [
            { title: "Đặt món trước", desc: "Giảm lãng phí thực phẩm." },
            { title: "Cảnh báo Y tế", desc: "Cảnh báo thành phần gây dị ứng." },
            { title: "Hệ sinh thái", desc: "Mở rộng tới xe đưa đón và thư viện." }
          ]
        }
      }
    }
  },
  en: {
    nav: {
      home: "Home",
      about: "About Us",
      policy: "Policy",
      contact: "Contact",
      cta: "Get Started",
      client: "Launch Client"
    },
    hero: {
      badge: "Over 20 schools joined this month",
      title1: "Cashless Campus,",
      title2: "Seamless Experience.",
      desc: "The safest way for students to pay for meals and services. Parents manage everything instantly via a secure digital platform.",
      stats: "5,000+ Daily Active Students",
      floating: {
        instant: "Instant",
        topup: "Parental Top-up"
      }
    },
    about: {
      badge: "About SmartSchool",
      heroTitle1: "Redefining",
      heroTitle2: "School Services.",
      heroDesc: "We build a smart school ecosystem where technology serves people, providing peace of mind for parents and convenience for students.",
      missionBadge: "Our Mission",
      missionTitle: "Core Values",
      stats: [
        { label: 'Partner Schools', value: '20+' },
        { label: 'Active Students', value: '5,000+' },
        { label: 'Daily Transactions', value: '12,000+' },
        { label: 'Security Level', value: '100%' }
      ],
      cards: [
        {
          title: 'Absolute Security',
          desc: 'Eliminating cash risks and losses for students at school through an intelligent identification system.'
        },
        {
          title: '100% Transparency',
          desc: 'Parents monitor every expense in real-time, ensuring nutrition supervision rights.'
        },
        {
          title: 'Pioneering Tech',
          desc: 'Digitizing canteen experiences with one-touch QR Code technology and automated auditing.'
        }
      ]
    },
    contact: {
      heroTitle: "Connect with",
      heroDesc: "Always ready to listen and support schools & parents 24/7.",
      formTitle: "Send a Message",
      labels: {
        name: "Full Name",
        email: "Email",
        topic: "Topic",
        message: "Message",
        submit: "Submit"
      },
      topics: [
        "Technical Support",
        "School Partnership",
        "Refund Request",
        "Other"
      ],
      placeholders: {
        name: "John Doe",
        email: "name@email.com",
        message: "How can we help you?"
      },
      info: {
        phone: "Hotline",
        email: "Email",
        office: "Office",
        location: "District 1, Ho Chi Minh City"
      },
      alert: "Request sent! We will respond within 24 hours."
    },
    footer: {
      desc: "The safest way for students to pay for school services. Trusted by 20+ partner schools nationwide.",
      navTitle: "Navigation",
      contactTitle: "Contact Info",
      location: "District 1, Ho Chi Minh City, Vietnam"
    },
    policy: {
      header: {
        title: "Project Report — ",
        accent: "Operational Mechanics.",
        desc: "Transparent cash flow, optimized operations, and absolute safety for the school ecosystem."
      },
      sections: {
        compliance: {
          label: "Compliance",
          title: "Legal & Compliance Framework",
          desc: "To ensure legal operation without a payment intermediary license, the system operates on a Closed-Loop model. All transactions are defined as 'Prepaid service purchases', transferring ownership to the Provider (School) at the point of purchase.",
          aml: "No Cash-out Policy. Purchased vouchers cannot be converted back to cash or transferred externally.",
          kyc: "Uses school-verified student profiles for identification. Every transaction is linked to a specific individual."
        },
        limits: {
          label: "Limits",
          title: "System Scale & Limits",
          desc: "Optimized for micro-payments serving essential daily needs in education.",
          avg: "Average value: 10k - 50k VNĐ per meal.",
          storage: "Max 2,000,000 VNĐ storage. Parents can set daily spending limits.",
          control: "Restricted item blocking (e.g., carbonated drinks) based on health policy."
        },
        scope: {
          label: "Scope",
          title: "Current Implementation Scope",
          parent: "Parent Module",
          parentItems: ["E-commerce package purchase", "VNPay/VietQR Integration", "Real-time monitoring"],
          student: "Student Module",
          studentItems: ["Card/QR ID Identification", "Fast Redeem at counter"],
          mgmt: "Management Module",
          mgmtItems: ["Tablet/Mobile POS", "Automated Reconciliation", "Menu & Rate Management"]
        },
        roadmap: {
          label: "Roadmap",
          title: "Impact & Development Roadmap",
          statTime: "Scan time: 3-5 seconds",
          statLoss: "Cash loss: 0%",
          quote: "Reducing queue time from 45s to 3-5s, perfect for short breaks.",
          items: [
            { title: "Pre-order", desc: "Reducing food waste effectively." },
            { title: "Health Alert", desc: "Automated allergen warnings." },
            { title: "Full Ecosystem", desc: "Expansion to transport and library." }
          ]
        }
      }
    }
  }
};

export type TranslationSchema = typeof translations.vi;
